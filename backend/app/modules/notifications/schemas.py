"""Pydantic-схемы уведомлений: список с фильтрами, сводка, авторы для выпадающего списка."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

from app.modules.posts.schemas import PostOut

NotificationSort = Literal["new", "old", "actor"]
NotificationType = Literal[
    "like",
    "comment",
    "reply",
    "repost",
    "follow",
    "follow_request",
    "follow_accepted",
    "comment_reaction",
    "comment_mention",
    "mention",
    "wall_post",
]


class NotificationActorOut(BaseModel):
    id: str | None
    username: str | None
    display_name: str | None
    avatar: str | None
    is_verified: bool | None


class NotificationItem(BaseModel):
    id: str
    type: str
    created_at: datetime
    is_read: bool | None
    preview: str | None
    actor: NotificationActorOut
    post: PostOut | None
    target_id: str | None


class NotificationsPage(BaseModel):
    items: list[NotificationItem]
    total: int
    limit: int
    offset: int


class TypeCount(BaseModel):
    type: str
    count: int


class VerifiedCounts(BaseModel):
    verified: int
    not_verified: int
    unknown: int


class ActorStat(BaseModel):
    username: str
    display_name: str | None
    avatar: str | None
    is_verified: bool | None
    count: int


class DayCount(BaseModel):
    date: date
    count: int


class NotificationsSummary(BaseModel):
    total: int
    unread: int
    since: datetime | None
    by_type: list[TypeCount]
    verified: VerifiedCounts
    top_actors: list[ActorStat]
    by_day: list[DayCount]


class ActorsList(BaseModel):
    items: list[ActorStat]
