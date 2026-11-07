"""Доступ к уведомлениям итд и восстановленным по ним подпискам (notification_events, follow_events).

Подписки берутся только из уведомлений типа `follow`. `follow_request` — это ещё не подписка,
`follow_accepted` — уведомление о том, что приняли ВАШУ заявку (это ваша подписка, а не подписчик).
"""

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.db.models import FollowEvent, NotificationEvent
from app.integrations.itd.client import ItdNotification

FOLLOW_TYPES = {"follow"}
COMMENT_TYPES = ("comment", "reply", "comment_mention")


class NotificationsRepository:
    def __init__(self, db: Session):
        self.db = db

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
                )
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
