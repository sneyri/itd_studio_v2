"""Доступ к уведомлениям итд и восстановленным по ним подпискам (notification_events, follow_events).

Подписки берутся только из уведомлений типа `follow`. `follow_request` — это ещё не подписка,
`follow_accepted` — уведомление о том, что приняли ВАШУ заявку (это ваша подписка, а не подписчик).
"""

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.timeutils import utcnow
from app.db.models import FollowEvent, ItdUser, NotificationEvent
from app.integrations.itd.client import ItdNotification, ItdUserLite

FOLLOW_TYPES = {"follow"}
COMMENT_TYPES = ("comment", "reply", "comment_mention")


class NotificationsRepository:
    def __init__(self, db: Session):
        self.db = db
        # autoflush выключен: только что добавленные строки itd_users не видны через db.get — держим их тут.
        self._users: dict[str, ItdUser] = {}

    def known_ids(self, user_id: int) -> set[str]:
        return set(self.db.scalars(select(NotificationEvent.id).where(NotificationEvent.user_id == user_id)))

    def oldest_notification_at(self, user_id: int) -> datetime | None:
        return self.db.scalar(
            select(func.min(NotificationEvent.created_at)).where(NotificationEvent.user_id == user_id)
        )

    def save_notifications(self, user_id: int, items: Sequence[ItdNotification]) -> int:
        """Сохраняет новые уведомления и создаёт follow_events (с дедупликацией). Возвращает число новых подписок."""
        known = self.known_ids(user_id)
        existing_follows = {
            (f.follower_id, f.followed_at)
            for f in self.db.scalars(select(FollowEvent).where(FollowEvent.user_id == user_id))
        }
        new_follows = 0
        for n in items:
            if n.id in known:
                continue
            known.add(n.id)
            self.db.add(
                NotificationEvent(
                    id=n.id,
                    user_id=user_id,
                    type=n.type,
                    actor_id=n.actor_id,
                    actor_username=n.actor_username,
                    actor_display_name=n.actor_display_name,
                    actor_avatar=n.actor_avatar,
                    target_id=n.target_id,
                    preview=n.preview,
                    created_at=n.created_at,
                    actor_is_verified=n.actor_is_verified,
                    is_read=n.is_read,
                    target_type=n.target_type,
                )
            )
            if n.actor_id:
                self.upsert_user(
                    ItdUserLite(n.actor_id, n.actor_username, n.actor_display_name, n.actor_avatar, n.actor_is_verified)
                )
            if n.type in FOLLOW_TYPES and n.actor_id:
                key = (n.actor_id, n.created_at)
                if key in existing_follows:
                    continue
                existing_follows.add(key)
                self.db.add(
                    FollowEvent(
                        user_id=user_id,
                        follower_id=n.actor_id,
                        follower_username=n.actor_username,
                        follower_display_name=n.actor_display_name,
                        follower_avatar=n.actor_avatar,
                        followed_at=n.created_at,
                        source="notification",
                    )
                )
                new_follows += 1
        return new_follows

    def upsert_user(self, u: ItdUserLite) -> None:
        """Справочник пользователей итд. Известный статус верификации не затирается неизвестным (None)."""
        row = self._users.get(u.id) or self.db.get(ItdUser, u.id)
        if row is None:
            row = ItdUser(id=u.id)
            self.db.add(row)
        self._users[u.id] = row
        row.username = u.username or row.username
        row.display_name = u.display_name or row.display_name
        row.avatar = u.avatar if u.avatar is not None else row.avatar
        if u.is_verified is not None:
            row.is_verified = u.is_verified
        row.updated_at = utcnow()

    def upsert_users(self, users: Sequence[ItdUserLite]) -> None:
        for u in users:
            self.upsert_user(u)

    def mark_current_followers(self, user_id: int, follower_ids: set[str]) -> None:
        self.db.flush()
        self.db.execute(
            update(FollowEvent)
            .where(FollowEvent.user_id == user_id)
            .values(is_current_follower=FollowEvent.follower_id.in_(follower_ids))
        )

    def follow_events(self, user_id: int) -> list[FollowEvent]:
        return list(
            self.db.scalars(
                select(FollowEvent).where(FollowEvent.user_id == user_id).order_by(FollowEvent.followed_at)
            )
        )

    def latest_follow_events(self, user_id: int, limit: int) -> list[FollowEvent]:
        return list(
            self.db.scalars(
                select(FollowEvent)
                .where(FollowEvent.user_id == user_id)
                .order_by(FollowEvent.followed_at.desc())
                .limit(limit)
            )
        )

    def recent_comments(self, user_id: int, limit: int) -> list[NotificationEvent]:
        return list(
            self.db.scalars(
                select(NotificationEvent)
                .where(NotificationEvent.user_id == user_id, NotificationEvent.type.in_(COMMENT_TYPES))
                .order_by(NotificationEvent.created_at.desc())
                .limit(limit)
            )
        )
