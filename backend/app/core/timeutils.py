"""Работа со временем: всё внутри приложения — aware datetime в UTC.

В БД время хранится строкой ISO-8601 UTC с миллисекундами и `Z` (как его отдаёт итд),
поэтому строки сортируются лексикографически так же, как по времени.
"""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

UTC = timezone.utc


def utcnow() -> datetime:
    return datetime.now(UTC)


def parse_utc(value: str | datetime | None) -> datetime | None:
    """Разбирает ISO-8601 (с `Z`, смещением, пробелом вместо `T` или без пояса) в aware UTC."""
    if value is None:
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        text = value.strip()
        if not text:
            return None
        try:
            dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def format_utc(dt: datetime) -> str:
    dt = parse_utc(dt)
    assert dt is not None
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond // 1000:03d}Z"


def get_zone(name: str) -> ZoneInfo:
    try:
        return ZoneInfo(name)
    except (ZoneInfoNotFoundError, ValueError):
        raise ValueError(f"Неизвестный часовой пояс: {name}") from None


def is_valid_timezone(name: str) -> bool:
    try:
        get_zone(name)
        return True
    except ValueError:
        return False


def local_date(dt: datetime, zone: ZoneInfo) -> date:
    return dt.astimezone(zone).date()
