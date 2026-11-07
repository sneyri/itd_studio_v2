"""Рост аудитории — только из реальных источников, без «размазывания».

Источники:
1. account_snapshots (source="snapshot") — точное значение followers_count в момент синхронизации.
2. follow_events из уведомлений (source="notifications") — реальные даты новых подписок.
   Кривая строится НАЗАД от текущего числа: followers(конец дня d) = current − подписки после d.
   API итд не отдаёт отписки, поэтому это оценка без учёта отписок до текущего момента.
   Уточнения:
   - повторная подписка одного человека учитывается один раз (по последней дате);
   - если человек подписался (по уведомлению), но его уже нет в списке подписчиков
     (is_current_follower=False), он подписался и отписался после d — на кривую не влияет.
Ряд по уведомлениям начинается с самого старого полученного уведомления любого типа:
раньше этой даты история уведомлений недоступна, и точек там нет.
"""

from collections import Counter
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.modules.analytics.schemas import FollowersPoint, FollowersSeries


@dataclass(frozen=True)
class SnapshotPoint:
    captured_at: datetime
    followers_count: int


@dataclass(frozen=True)
class Follow:
    follower_id: str
    followed_at: datetime
    is_current_follower: bool | None = None


def effective_follows(follows: Iterable[Follow]) -> list[Follow]:
    """Одна (последняя) подписка на человека; ушедшие подписчики исключаются."""
    latest: dict[str, Follow] = {}
    for f in follows:
        prev = latest.get(f.follower_id)
        if prev is None or f.followed_at > prev.followed_at:
            latest[f.follower_id] = f
    return [f for f in latest.values() if f.is_current_follower is not False]


def new_followers_by_day(follows: Iterable[Follow], zone: ZoneInfo) -> Counter:
    return Counter(f.followed_at.astimezone(zone).date() for f in effective_follows(follows))


def reconstruct_from_notifications(
    current: int, follows: Iterable[Follow], coverage_start: date, today: date, zone: ZoneInfo
) -> list[FollowersPoint]:
    per_day = new_followers_by_day(follows, zone)
    points = []
    # подписки, случившиеся ПОСЛЕ конца дня d
    after = sum(n for d, n in per_day.items() if d > coverage_start)
    day = coverage_start
    while day <= today:
        points.append(
            FollowersPoint(
                date=day,
                followers=max(current - after, 0),
                new_followers=per_day.get(day, 0),
                source="notifications",
            )
        )
        day += timedelta(days=1)
        after -= per_day.get(day, 0)
    return points


def snapshot_points(snapshots: Iterable[SnapshotPoint], zone: ZoneInfo) -> dict[date, int]:
    """Последний снимок каждого локального дня."""
    by_day: dict[date, tuple[datetime, int]] = {}
    for s in snapshots:
        day = s.captured_at.astimezone(zone).date()
        if day not in by_day or s.captured_at >= by_day[day][0]:
            by_day[day] = (s.captured_at, s.followers_count)
    return {day: value for day, (_, value) in by_day.items()}


def build_followers_series(
    current: int,
    snapshots: Iterable[SnapshotPoint],
    follows: Iterable[Follow],
    notifications_since: datetime | None,
    zone: ZoneInfo,
    now: datetime,
) -> FollowersSeries:
    follows = list(follows)
    today = now.astimezone(zone).date()
    snap_days = snapshot_points(snapshots, zone)
    coverage_start = notifications_since.astimezone(zone).date() if notifications_since else None

    points: dict[date, FollowersPoint] = {}
    if coverage_start is not None and coverage_start <= today:
        for p in reconstruct_from_notifications(current, follows, coverage_start, today, zone):
            points[p.date] = p

    per_day = new_followers_by_day(follows, zone) if coverage_start else Counter()
    for day, value in snap_days.items():
        covered = coverage_start is not None and day >= coverage_start
        points[day] = FollowersPoint(
            date=day,
            followers=value,
            new_followers=per_day.get(day, 0) if covered else None,
            source="snapshot",
        )

    snapshots_since = min(snap_days) if snap_days else None
    return FollowersSeries(
        current=current,
        points=[points[d] for d in sorted(points)],
        snapshots_since=snapshots_since,
        notifications_since=coverage_start,
        note=_note(snapshots_since, coverage_start),
    )


def _note(snapshots_since: date | None, coverage_start: date | None) -> str:
    if snapshots_since is None and coverage_start is None:
        return "Данных нет: история подписчиков появится после первой синхронизации."
    parts = []
    if snapshots_since:
        parts.append(f"Точные значения — по снимкам при синхронизации с {snapshots_since:%d.%m.%Y}.")
    if coverage_start:
        parts.append(
            f"Остальные точки восстановлены по уведомлениям о подписках с {coverage_start:%d.%m.%Y} "
            "без учёта отписок (итд их не отдаёт) — это оценка снизу."
        )
    parts.append("Раньше этой даты данных нет.")
    return " ".join(parts)


def followers_today(follows: Iterable[Follow], has_notification_data: bool, zone: ZoneInfo, now: datetime) -> int | None:
    if not has_notification_data:
        return None
    today = now.astimezone(zone).date()
    return sum(1 for f in follows if f.followed_at.astimezone(zone).date() == today)
