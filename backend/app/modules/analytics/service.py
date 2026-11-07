"""Сервис аналитики: достаёт данные из репозиториев и передаёт их в чистые функции расчёта.

Ничего не знает про HTTP — роутер только вызывает методы и возвращает схемы.
"""

from datetime import datetime

from sqlalchemy.orm import Session

from app.core.timeutils import get_zone, utcnow
from app.db.models import User
from app.modules.analytics import audience, engagement, overview, posting_time
from app.modules.analytics.schemas import (
    Dynamics,
    FollowersSeries,
    NewFollower,
    NewFollowersList,
    Overview,
    PostingTime,
    PublicationDays,
    Weekdays,
)
from app.modules.notifications.repository import NotificationsRepository
from app.modules.posts.repository import PostsRepository
from app.modules.posts.schemas import to_post_out
from app.modules.users.repository import UsersRepository


class AnalyticsService:
    def __init__(self, db: Session, user: User, now: datetime | None = None):
        self.user = user
        self.zone = get_zone(user.timezone)
        self.now = now or utcnow()
        self.posts = PostsRepository(db)
        self.users = UsersRepository(db)
        self.notifications = NotificationsRepository(db)

    def _follows(self) -> list[audience.Follow]:
        return [
            audience.Follow(e.follower_id, e.followed_at, e.is_current_follower)
            for e in self.notifications.follow_events(self.user.id)
        ]

    def overview(self) -> Overview:
        has_notifications = self.notifications.oldest_notification_at(self.user.id) is not None
        today = audience.followers_today(self._follows(), has_notifications, self.zone, self.now)
        return overview.build_overview(
            self.user,
            self.posts.all_for_user(self.user.id),
            today,
            self.zone,
            lambda p: to_post_out(p, self.user.username),
        )

    def followers(self) -> FollowersSeries:
        snapshots = [audience.SnapshotPoint(s.captured_at, s.followers_count) for s in self.users.snapshots(self.user.id)]
        return audience.build_followers_series(
            current=self.user.followers_count or 0,
            snapshots=snapshots,
            follows=self._follows(),
            notifications_since=self.notifications.oldest_notification_at(self.user.id),
            zone=self.zone,
            now=self.now,
        )

    def new_followers(self, limit: int) -> NewFollowersList:
        events = self.notifications.latest_follow_events(self.user.id, limit)
        return NewFollowersList(
            items=[
                NewFollower(
                    username=e.follower_username,
                    display_name=e.follower_display_name,
                    avatar=e.follower_avatar,
                    followed_at=e.followed_at,
                )
                for e in events
            ]
        )

    def by_publication_date(self) -> PublicationDays:
        return engagement.by_publication_date(self.posts.all_for_user(self.user.id), self.zone, self.user.timezone)

    def dynamics(self) -> Dynamics:
        snaps = [
            engagement.MetricsSnapshot(s.post_id, s.captured_at, s.views, s.likes, s.comments, s.reposts)
            for s in self.posts.metric_snapshots(self.user.id)
        ]
        return engagement.dynamics(snaps, self.zone)

    def posting_time(self) -> PostingTime:
        return posting_time.build_posting_time(self.posts.all_for_user(self.user.id), self.zone, self.user.timezone)

    def weekdays(self) -> Weekdays:
        return engagement.weekdays(self.posts.all_for_user(self.user.id), self.zone, self.user.timezone)
