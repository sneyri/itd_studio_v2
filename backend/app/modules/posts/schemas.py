"""Pydantic-схемы постов и функция преобразования ORM → ответ API."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.core.config import get_settings
from app.db.models import Post

PostSort = Literal["new", "views", "likes", "comments"]


class PostOut(BaseModel):
    id: str
    content: str
    created_at: datetime | None
    views_count: int
    likes_count: int
    comments_count: int
    reposts_count: int
    is_repost: bool
    url: str


class PostsPage(BaseModel):
    items: list[PostOut]
    total: int
    limit: int
    offset: int


class PostsList(BaseModel):
    items: list[PostOut]


def to_post_out(post: Post, username: str) -> PostOut:
    template = get_settings().itd_post_url_template
    return PostOut(
        id=post.id,
        content=post.content or "",
        created_at=post.created_at,
        views_count=post.views_count or 0,
        likes_count=post.likes_count or 0,
        comments_count=post.comments_count or 0,
        reposts_count=post.reposts_count or 0,
        is_repost=bool(post.is_repost),
        url=template.format(username=username, post_id=post.id),
    )
