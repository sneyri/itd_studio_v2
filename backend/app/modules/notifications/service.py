"""Запросы к сохранённым уведомлениям: фильтры, сортировка, сводка.

Статус верификации автора = значение из уведомления (если итд его прислал),
иначе — из справочника itd_users (заполняется из списка подписчиков), иначе неизвестен (null).
"""

from collections import Counter
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.core.timeutils import UTC, get_zone, utcnow
from app.db.models import ItdUser, NotificationEvent, Post, User
from app.modules.notifications.schemas import (
    ActorStat,
    ActorsList,
    DayCount,
    NotificationActorOut,
    NotificationItem,
    NotificationsPage,
    NotificationsSummary,
    TypeCount,
    VerifiedCounts,
)
from app.modules.posts.schemas import to_post_out

VERIFIED = func.coalesce(NotificationEvent.actor_is_verified, ItdUser.is_verified)
SUMMARY_DAYS = 30


@dataclass
class NotificationFilters:
    types: list[str] = field(default_factory=list)
    actor: str | None = None
    verified: bool | None = None
    unread: bool = False
    q: str | None = None
    date_from: date | None = None
    date_to: date | None = None


def _bool(value) -> bool | None:
    return None if value is None else bool(value)


class NotificationsService:
    def __init__(self, db: Session, user: User, now: datetime | None = None):
        self.db = db
        self.user = user
        self.zone = get_zone(user.timezone)
        self.now = now or utcnow()

    def _base(self, *columns) -> Select:
        return (
            select(*columns)
            .select_from(NotificationEvent)
            .outerjoin(ItdUser, ItdUser.id == NotificationEvent.actor_id)
            .where(NotificationEvent.user_id == self.user.id)
        )

    def _day_start(self, day: date) -> datetime:
        return datetime.combine(day, time.min, self.zone).astimezone(UTC)

    def _conditions(self, f: NotificationFilters) -> list:
        cond = []
        if f.types:
            cond.append(NotificationEvent.type.in_(f.types))
        if f.actor and f.actor.strip():
            cond.append(func.py_lower(NotificationEvent.actor_username) == f.actor.strip().lstrip("@").lower())
        if f.verified is True:
            cond.append(VERIFIED.is_(True))
        elif f.verified is False:
            cond.append(VERIFIED.is_(False))
        if f.unread:
            cond.append(NotificationEvent.is_read.is_(False))
        if f.q and f.q.strip():
            pattern = f"%{f.q.strip().lower()}%"
            cond.append(
                or_(
                    func.py_lower(NotificationEvent.preview).like(pattern),
                    func.py_lower(NotificationEvent.actor_username).like(pattern),
                    func.py_lower(NotificationEvent.actor_display_name).like(pattern),
                )
            )
        if f.date_from:
            cond.append(NotificationEvent.created_at >= self._day_start(f.date_from))
        if f.date_to:
            cond.append(NotificationEvent.created_at < self._day_start(f.date_to + timedelta(days=1)))
        return cond

    def list(self, f: NotificationFilters, sort: str, limit: int, offset: int) -> NotificationsPage:
        cond = self._conditions(f)
        order = {
            "old": [NotificationEvent.created_at.asc()],
            "actor": [func.py_lower(NotificationEvent.actor_username).asc(), NotificationEvent.created_at.desc()],
        }.get(sort, [NotificationEvent.created_at.desc()])
        rows = self.db.execute(
            self._base(NotificationEvent, VERIFIED.label("verified"))
            .where(*cond)
            .order_by(*order, NotificationEvent.id)
            .limit(limit)
            .offset(offset)
        ).all()
        total = self.db.scalar(self._base(func.count()).where(*cond)) or 0

        target_ids = {e.target_id for e, _ in rows if e.target_id}
        posts = {}
        if target_ids:
            posts = {
                p.id: p
                for p in self.db.scalars(select(Post).where(Post.user_id == self.user.id, Post.id.in_(target_ids)))
            }
        items = [
            NotificationItem(
                id=e.id,
                type=e.type,
                created_at=e.created_at,
                is_read=e.is_read,
                preview=e.preview,
                actor=NotificationActorOut(
                    id=e.actor_id,
                    username=e.actor_username,
                    display_name=e.actor_display_name,
                    avatar=e.actor_avatar,
                    is_verified=_bool(verified),
                ),
                post=to_post_out(posts[e.target_id], self.user.username) if e.target_id in posts else None,
                target_id=e.target_id,
            )
            for e, verified in rows
        ]
        return NotificationsPage(items=items, total=total, limit=limit, offset=offset)

    def actors(self, q: str | None, limit: int) -> ActorsList:
        cond = [NotificationEvent.actor_username.is_not(None)]
        if q and q.strip():
            pattern = f"%{q.strip().lstrip('@').lower()}%"
            cond.append(
                or_(
                    func.py_lower(NotificationEvent.actor_username).like(pattern),
                    func.py_lower(NotificationEvent.actor_display_name).like(pattern),
                )
            )
        return ActorsList(items=self._actor_stats(cond, limit))

    def _actor_stats(self, cond: list, limit: int) -> list[ActorStat]:
        count = func.count().label("cnt")
        rows = self.db.execute(
            self._base(
                func.max(NotificationEvent.actor_username),
                func.max(NotificationEvent.actor_display_name),
                func.max(NotificationEvent.actor_avatar),
                func.max(VERIFIED),
                count,
            )
            .where(*cond)
            .group_by(NotificationEvent.actor_id)
            .order_by(count.desc(), func.max(NotificationEvent.actor_username))
            .limit(limit)
        ).all()
        return [
            ActorStat(username=u, display_name=d, avatar=a, is_verified=_bool(v), count=c) for u, d, a, v, c in rows
        ]

    def summary(self) -> NotificationsSummary:
        total = self.db.scalar(self._base(func.count())) or 0
        unread = self.db.scalar(self._base(func.count()).where(NotificationEvent.is_read.is_(False))) or 0
        since = self.db.scalar(self._base(func.min(NotificationEvent.created_at)))

        by_type = [
            TypeCount(type=t, count=c)
            for t, c in self.db.execute(
                self._base(NotificationEvent.type, func.count().label("c"))
                .group_by(NotificationEvent.type)
                .order_by(func.count().desc(), NotificationEvent.type)
            ).all()
        ]

        verified_counts = Counter()
        for value, c in self.db.execute(self._base(VERIFIED, func.count()).group_by(VERIFIED)).all():
            verified_counts[_bool(value)] += c

        today = self.now.astimezone(self.zone).date()
        first_day = today - timedelta(days=SUMMARY_DAYS - 1)
        stamps = self.db.scalars(
            self._base(NotificationEvent.created_at).where(NotificationEvent.created_at >= self._day_start(first_day))
        ).all()
        per_day = Counter(ts.astimezone(self.zone).date() for ts in stamps)
        days = [first_day + timedelta(days=i) for i in range(SUMMARY_DAYS)]

        return NotificationsSummary(
            total=total,
            unread=unread,
            since=since,
            by_type=by_type,
            verified=VerifiedCounts(
                verified=verified_counts[True], not_verified=verified_counts[False], unknown=verified_counts[None]
            ),
            top_actors=self._actor_stats([NotificationEvent.actor_username.is_not(None)], 10),
            by_day=[DayCount(date=d, count=per_day.get(d, 0)) for d in days],
        )
