"""Pydantic-схемы ответов аналитики. Поле `source` везде говорит, откуда данные:
snapshot — реальные снимки, notifications — восстановлено по уведомлениям,
post_date — сумма метрик постов по дате публикации (это НЕ рост во времени)."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.modules.posts.schemas import PostOut


class BestPostingTime(BaseModel):
    sufficient_data: bool
    hour: int | None = None
    label: str | None = None
    avg_views: float | None = None
    avg_interactions: float | None = None
    sample_posts: int | None = None
    reason: str | None = None
    timezone: str


class Overview(BaseModel):
    followers_count: int
    following_count: int
    posts_count: int = Field(description="Постов в локальной базе")
    followers_today: int | None = Field(description="Новые подписчики сегодня по уведомлениям; null — данных нет")
    total_views: int
    total_likes: int
    total_comments: int
    total_reposts: int
    avg_views_per_post: float
    avg_likes_per_post: float
    avg_comments_per_post: float
    engagement_rate: float = Field(description="ER по просмотрам, доля 0..1")
    engagement_rate_formula: str
    best_posting_time: BestPostingTime
    top_post: PostOut | None
    last_synced_at: datetime | None


class FollowersPoint(BaseModel):
    date: date
    followers: int
    new_followers: int | None
    source: Literal["snapshot", "notifications"]


class FollowersSeries(BaseModel):
    current: int
    points: list[FollowersPoint]
    snapshots_since: date | None
    notifications_since: date | None
    includes_unfollows: Literal[False] = False
    note: str


class NewFollower(BaseModel):
    username: str | None
    display_name: str | None
    avatar: str | None
    followed_at: datetime


class NewFollowersList(BaseModel):
    items: list[NewFollower]


class PublicationDay(BaseModel):
    date: date
    posts: int
    views: int
    likes: int
    comments: int
    reposts: int


class PublicationDays(BaseModel):
    source: Literal["post_date"] = "post_date"
    timezone: str
    items: list[PublicationDay]


class DynamicsPoint(BaseModel):
    date: date
    views: int
    likes: int
    comments: int
    reposts: int


class Dynamics(BaseModel):
    source: Literal["snapshot"] = "snapshot"
    since: date | None
    items: list[DynamicsPoint]


class HourBucket(BaseModel):
    hour: int
    posts: int
    avg_views: float
    avg_interactions: float
    sufficient: bool


class PostingTime(BaseModel):
    timezone: str
    min_posts_per_bucket: int
    buckets: list[HourBucket]
    best: BestPostingTime


class WeekdayStat(BaseModel):
    weekday: int = Field(description="0 = понедельник")
    posts: int
    views: int
    interactions: int


class Weekdays(BaseModel):
    timezone: str
    items: list[WeekdayStat]
