"""Шлюз к API соцсети итд. ЕДИНСТВЕННОЕ место в проекте, где импортируется itdpy.

Наружу отдаются только собственные DTO (dataclass), поэтому замена/обновление itdpy
затрагивает один этот файл. Ошибки itdpy превращаются в ItdAuthError / ItdUnavailableError.

Важно: итд ротирует refresh_token при обновлении access-токена. Новый токен приходит
в колбэк on_token_rotated — вызывающий код обязан сохранить его, иначе следующий вход упадёт.
"""

from __future__ import annotations

import logging
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from datetime import datetime

import itdpy
from itdpy import exceptions as itd_exc

from app.core.timeutils import parse_utc

logger = logging.getLogger(__name__)

PAGE_SIZE = 50


class ItdError(Exception):
    """Базовая ошибка интеграции (текст безопасен для логов: без токенов)."""


class ItdAuthError(ItdError):
    """Токен недействителен/просрочен/отозван."""


class ItdUnavailableError(ItdError):
    """Сеть, rate limit, 5xx и прочие временные проблемы итд."""


@dataclass(frozen=True)
class ItdProfile:
    id: str
    username: str
    display_name: str | None
    avatar: str | None
    bio: str | None
    followers_count: int
    following_count: int
    posts_count: int
    registered_at: datetime | None


@dataclass(frozen=True)
class ItdPost:
    id: str
    content: str | None
    created_at: datetime | None
    edited_at: datetime | None
    likes_count: int
    comments_count: int
    reposts_count: int
    views_count: int
    is_repost: bool
    repost_original_id: str | None


@dataclass(frozen=True)
class ItdNotification:
    id: str
    type: str
    actor_id: str | None
    actor_username: str | None
    actor_display_name: str | None
    actor_avatar: str | None
    target_id: str | None
    preview: str | None
    created_at: datetime


def _translate(exc: Exception) -> ItdError:
    if isinstance(exc, ItdError):
        return exc
    if isinstance(exc, (itd_exc.AuthenticationError, itd_exc.ForbiddenError)):
        return ItdAuthError(type(exc).__name__)
    return ItdUnavailableError(type(exc).__name__)


def _value(obj, name: str, default=None):
    return getattr(obj, name, default)


def _to_profile(user) -> ItdProfile:
    return ItdProfile(
        id=str(user.id),
        username=user.username,
        display_name=_value(user, "display_name"),
        avatar=_value(user, "avatar"),
        bio=_value(user, "bio"),
        followers_count=int(_value(user, "followers_count", 0) or 0),
        following_count=int(_value(user, "following_count", 0) or 0),
        posts_count=int(_value(user, "posts_count", 0) or 0),
        registered_at=parse_utc(_value(user, "created_at")),
    )


def _to_post(post) -> ItdPost:
    original = _value(post, "original_post")
    return ItdPost(
        id=str(post.id),
        content=_value(post, "content"),
        created_at=parse_utc(_value(post, "created_at")),
        edited_at=parse_utc(_value(post, "edited_at")),
        likes_count=int(_value(post, "likes_count", 0) or 0),
        comments_count=int(_value(post, "comments_count", 0) or 0),
        reposts_count=int(_value(post, "reposts_count", 0) or 0),
        views_count=int(_value(post, "views_count", 0) or 0),
        is_repost=original is not None,
        repost_original_id=str(original.id) if original is not None else None,
    )


def _to_notification(item) -> ItdNotification | None:
    created_at = parse_utc(_value(item, "created_at"))
    if created_at is None:
        return None
    actor = _value(item, "actor")
    kind = _value(item, "type")
    return ItdNotification(
        id=str(item.id),
        type=str(getattr(kind, "value", kind)),
        actor_id=str(actor.id) if actor is not None else None,
        actor_username=_value(actor, "username") if actor is not None else None,
        actor_display_name=_value(actor, "display_name") if actor is not None else None,
        actor_avatar=_value(actor, "avatar") if actor is not None else None,
        target_id=_value(item, "target_id"),
        preview=_value(item, "preview"),
        created_at=created_at,
    )


class ItdGateway:
    """Сеанс работы с итд под одним refresh_token. Используйте как контекстный менеджер."""

    def __init__(self, refresh_token: str, on_token_rotated: Callable[[str], None] | None = None):
        if not refresh_token:
            raise ItdAuthError("empty refresh_token")
        try:
            self._client = itdpy.ITDClient(
                refresh_token=refresh_token,
                on_refresh_token_update=on_token_rotated,
                auto_refresh_interval=None,  # фоновые потоки нам не нужны: сеанс короткий
            )
        except Exception as exc:  # noqa: BLE001 - любые ошибки itdpy переводим в свои
            raise _translate(exc) from None

    def __enter__(self) -> ItdGateway:
        return self

    def __exit__(self, *_exc) -> None:
        self.close()

    @property
    def refresh_token(self) -> str:
        """Актуальный (возможно, уже ротированный) refresh_token."""
        return self._client.refresh_token

    def close(self) -> None:
        try:
            self._client.close()
        except Exception:  # pragma: no cover - закрытие не должно ронять вызывающий код
            logger.warning("Не удалось корректно закрыть клиент итд")

    def me(self) -> ItdProfile:
        try:
            return _to_profile(self._client.users.me())
        except Exception as exc:  # noqa: BLE001
            raise _translate(exc) from None

    def all_posts(self, username: str, limit: int | None = None) -> list[ItdPost]:
        """Все посты пользователя (limit=None — столько, сколько postsCount в профиле)."""
        try:
            posts = self._client.posts.get_all_user_posts(username, limit=limit)
        except Exception as exc:  # noqa: BLE001
            raise _translate(exc) from None
        return [_to_post(p) for p in posts]

    def notifications(self, known_ids: Iterable[str] = (), max_items: int = 5000) -> list[ItdNotification]:
        """Уведомления от новых к старым. Останавливается, как только целая страница уже известна
        (инкрементальная синхронизация), страница неполная или достигнут max_items."""
        known = set(known_ids)
        result: list[ItdNotification] = []
        offset = 0
        while len(result) < max_items:
            try:
                page = self._client.notifications.list(limit=PAGE_SIZE, offset=offset)
            except Exception as exc:  # noqa: BLE001
                raise _translate(exc) from None
            items = list(page)
            if not items:
                break
            converted = [n for n in (_to_notification(i) for i in items) if n is not None]
            fresh = [n for n in converted if n.id not in known]
            result.extend(fresh)
            if not fresh or len(items) < PAGE_SIZE:
                break
            offset += PAGE_SIZE
        return result[:max_items]

    def follower_ids(self, user_id: str, expected_total: int) -> set[str] | None:
        """id всех текущих подписчиков (без дат — API их не отдаёт). None, если список неполный."""
        ids: set[str] = set()
        max_pages = expected_total // PAGE_SIZE + 3
        for page_no in range(1, max_pages + 1):
            try:
                page = self._client.users.get_followers(user_id, limit=PAGE_SIZE, page=page_no)
            except Exception as exc:  # noqa: BLE001
                raise _translate(exc) from None
            items = list(page)
            before = len(ids)
            ids.update(str(u.id) for u in items if getattr(u, "id", None))
            if not items or len(ids) == before or not getattr(page, "has_more", False):
                break
        # Если API отдало заметно меньше, чем followers_count, считаем список ненадёжным.
        if expected_total and len(ids) < expected_total * 0.95:
            logger.warning("Список подписчиков неполный: %s из %s", len(ids), expected_total)
            return None
        return ids
