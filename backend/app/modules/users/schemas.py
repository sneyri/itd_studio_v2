"""Pydantic-схемы профиля и настроек пользователя."""

from datetime import datetime

from pydantic import BaseModel, field_validator

from app.core.timeutils import is_valid_timezone
from app.db.models import User


class Profile(BaseModel):
    username: str
    display_name: str | None
    avatar: str | None
    bio: str | None
    followers_count: int
    following_count: int
    posts_count: int
    registered_at: datetime | None
    timezone: str
    last_synced_at: datetime | None


class UserSettings(BaseModel):
    timezone: str

    @field_validator("timezone")
    @classmethod
    def _check_timezone(cls, value: str) -> str:
        if not is_valid_timezone(value):
            raise ValueError("Неизвестный часовой пояс")
        return value


def to_profile(user: User) -> Profile:
    return Profile(
        username=user.username,
        display_name=user.display_name,
        avatar=user.avatar,
        bio=user.bio,
        followers_count=user.followers_count or 0,
        following_count=user.following_count or 0,
        posts_count=user.posts_count or 0,
        registered_at=user.registered_at,
        timezone=user.timezone,
        last_synced_at=user.last_synced_at,
    )
