"""Синхронизация с итд: постановка задачи (с rate limit) и её выполнение воркером.

Шаги выполнения задачи:
1. профиль (users.me) → обновить users + снимок account_snapshots;
2. все посты → обновить posts + снимки метрик для изменившихся постов;
3. новые уведомления (инкрементально) → notification_events + follow_events;
4. список текущих подписчиков (без дат) → itd_users (статус верификации) и отметка, кто из follow_events ещё подписан.
Шаги 3–4 необязательные: их сбой не отменяет обновление профиля и постов.

Ротированный итд refresh_token сохраняется сразу отдельной транзакцией, чтобы не потерять
его даже при падении задачи.
"""

import logging
from collections.abc import Callable
from datetime import timedelta

from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.core.errors import SyncCooldownError, UnauthorizedError
from app.core.security import TokenCipher
from app.core.timeutils import utcnow
from app.db.models import SyncJob, User
from app.integrations.itd.client import ItdAuthError, ItdError, ItdGateway, ItdUnavailableError
from app.modules.auth.service import apply_profile
from app.modules.notifications.repository import NotificationsRepository
from app.modules.posts.repository import PostsRepository
from app.modules.sync.repository import SyncJobsRepository
from app.modules.users.repository import UsersRepository

logger = logging.getLogger(__name__)

FAILED_RETRY_SECONDS = 60
GatewayFactory = Callable[..., ItdGateway]


def enqueue_sync(db: Session, user: User) -> SyncJob:
    """Создаёт задачу или возвращает уже активную. Бросает SyncCooldownError, если рано."""
    if not user.encrypted_refresh_token:
        raise UnauthorizedError("Токен итд не сохранён — войдите заново")
    jobs = SyncJobsRepository(db)
    active = jobs.active_for_user(user.id)
    if active:
        return active

    now = utcnow()
    cooldown = get_settings().sync_cooldown
    last_done = jobs.last_done_for_user(user.id)
    if last_done and last_done.finished_at:
        wait = (last_done.finished_at + timedelta(seconds=cooldown) - now).total_seconds()
        if wait > 0:
            minutes = max(1, round(wait / 60))
            raise SyncCooldownError(
                f"Синхронизация доступна раз в {cooldown // 60} мин. Попробуйте через {minutes} мин.",
                retry_after=int(wait) + 1,
            )
    latest = jobs.latest_for_user(user.id)
    if latest and latest.status == "failed" and latest.finished_at:
        wait = (latest.finished_at + timedelta(seconds=FAILED_RETRY_SECONDS) - now).total_seconds()
        if wait > 0:
            raise SyncCooldownError("Последняя синхронизация завершилась ошибкой, повторите через минуту", retry_after=int(wait) + 1)

    job = jobs.create(user.id)
    db.commit()
    return job


class SyncRunner:
    def __init__(
        self,
        session_factory: sessionmaker,
        cipher: TokenCipher,
        gateway_factory: GatewayFactory = ItdGateway,
    ):
        self.session_factory = session_factory
        self.cipher = cipher
        self.gateway_factory = gateway_factory

    def _persist_rotated_token(self, user_id: int) -> Callable[[str], None]:
        def _save(new_token: str) -> None:
            with self.session_factory() as s:
                user = s.get(User, user_id)
                if user is not None:
                    user.encrypted_refresh_token = self.cipher.encrypt(new_token)
                    s.commit()
            logger.info("refresh_token ротирован и сохранён: user_id=%s", user_id)

        return _save

    def run(self, job_id: int) -> None:
        with self.session_factory() as db:
            job = db.get(SyncJob, job_id)
            if job is None:
                return
            try:
                posts, follows = self._run(db, job)
                job.status, job.posts_synced, job.new_follow_events = "done", posts, follows
            except ItdAuthError:
                db.rollback()
                job.status, job.error = "failed", "Токен итд недействителен или отозван — войдите заново"
            except ItdUnavailableError as exc:
                db.rollback()
                logger.warning("Итд недоступен во время синка job=%s: %s", job_id, exc)
                job.status, job.error = "failed", "Сервис итд недоступен, попробуйте позже"
            except Exception:
                db.rollback()
                logger.exception("Ошибка синхронизации job=%s", job_id)
                job.status, job.error = "failed", "Внутренняя ошибка синхронизации"
            job.finished_at = utcnow()
            db.commit()
            logger.info("Синк job=%s завершён: %s", job_id, job.status)

    def _run(self, db: Session, job: SyncJob) -> tuple[int, int]:
        user = db.get(User, job.user_id)
        token = self.cipher.decrypt(user.encrypted_refresh_token) if user and user.encrypted_refresh_token else None
        if not token:
            raise ItdAuthError("no stored token")

        settings = get_settings()
        now = utcnow()
        with self.gateway_factory(token, on_token_rotated=self._persist_rotated_token(user.id)) as gateway:
            profile = gateway.me()
            apply_profile(user, profile)

            posts = gateway.all_posts(profile.username)
            PostsRepository(db).upsert_from_itd(user.id, posts, now)

            new_follows = 0
            notifications = NotificationsRepository(db)
            try:
                items = gateway.notifications(notifications.known_ids(user.id), settings.notifications_sync_limit)
                new_follows = notifications.save_notifications(user.id, items)
                followers = gateway.followers(profile.id, profile.followers_count)
                if followers is not None:
                    notifications.upsert_users(followers)
                    notifications.mark_current_followers(user.id, {f.id for f in followers})
            except ItdAuthError:
                raise
            except ItdError as exc:
                logger.warning("Уведомления/подписчики не получены (job=%s): %s", job.id, exc)

            UsersRepository(db).add_snapshot(user, now)
            user.last_synced_at = now
            user.encrypted_refresh_token = self.cipher.encrypt(gateway.refresh_token)
        return len(posts), new_follows
