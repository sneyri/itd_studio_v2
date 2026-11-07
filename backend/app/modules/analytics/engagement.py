"""Вовлечённость: метрики по дню публикации, реальная динамика по снимкам, дни недели.

- by_publication_date — сумма метрик постов, ОПУБЛИКОВАННЫХ в этот день (не рост во времени!);
- dynamics            — суммарные метрики всех постов во времени по таблице post_metrics_snapshots
                        (снимок пишется только при изменении, поэтому значения переносятся вперёд);
- weekdays            — активность по дням недели публикации.
"""

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime
from zoneinfo import ZoneInfo

from app.modules.analytics.common import PostMetrics, interactions, num
from app.modules.analytics.schemas import (
    Dynamics,
    DynamicsPoint,
    PublicationDay,
    PublicationDays,
    WeekdayStat,
    Weekdays,
)


@dataclass(frozen=True)
class MetricsSnapshot:
    post_id: str
    captured_at: datetime
    views: int
    likes: int
    comments: int
    reposts: int


def by_publication_date(posts: Iterable[PostMetrics], zone: ZoneInfo, timezone_name: str) -> PublicationDays:
    days: dict = {}
    for post in posts:
        if post.created_at is None:
            continue
        day = post.created_at.astimezone(zone).date()
        d = days.setdefault(day, {"posts": 0, "views": 0, "likes": 0, "comments": 0, "reposts": 0})
        d["posts"] += 1
        d["views"] += num(post.views_count)
        d["likes"] += num(post.likes_count)
        d["comments"] += num(post.comments_count)
        d["reposts"] += num(post.reposts_count)
    items = [PublicationDay(date=day, **values) for day, values in sorted(days.items())]
    return PublicationDays(timezone=timezone_name, items=items)


def dynamics(snapshots: Iterable[MetricsSnapshot], zone: ZoneInfo) -> Dynamics:
    latest: dict[str, tuple[int, int, int, int]] = {}
    totals = [0, 0, 0, 0]
    per_day: dict = {}
    for snap in sorted(snapshots, key=lambda s: s.captured_at):
        new = (num(snap.views), num(snap.likes), num(snap.comments), num(snap.reposts))
        old = latest.get(snap.post_id, (0, 0, 0, 0))
        for i in range(4):
            totals[i] += new[i] - old[i]
        latest[snap.post_id] = new
        per_day[snap.captured_at.astimezone(zone).date()] = tuple(totals)

    items = [
        DynamicsPoint(date=day, views=v, likes=l, comments=c, reposts=r)
        for day, (v, l, c, r) in sorted(per_day.items())
    ]
    return Dynamics(since=items[0].date if items else None, items=items)


def weekdays(posts: Iterable[PostMetrics], zone: ZoneInfo, timezone_name: str) -> Weekdays:
    stats = {i: {"posts": 0, "views": 0, "interactions": 0} for i in range(7)}
    for post in posts:
        if post.created_at is None:
            continue
        wd = post.created_at.astimezone(zone).weekday()
        stats[wd]["posts"] += 1
        stats[wd]["views"] += num(post.views_count)
        stats[wd]["interactions"] += interactions(post)
    return Weekdays(timezone=timezone_name, items=[WeekdayStat(weekday=i, **v) for i, v in stats.items()])
