"""Pydantic-схемы постов и функция преобразования ORM → ответ API."""

import json
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.core.config import get_settings
from app.db.models import Post

PostSort = Literal["new", "views", "likes", "comments"]
MediaFilter = Literal["all", "with_media", "image", "video", "text_only"]


class AttachmentOut(BaseModel):
    id: str
    url: str
    kind: Literal["image", "video", "audio", "file"]
    mime: str | None
    width: int | None
    height: int | None


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
    attachments: list[AttachmentOut]


class PostsPage(BaseModel):
    items: list[PostOut]
    total: int
    limit: int
    offset: int
    attachments_synced: bool


class PostsList(BaseModel):
    items: list[PostOut]


def parse_attachments(raw: str | None) -> list[AttachmentOut]:
    from app.integrations.itd.client import attachment_kind

    if not raw:
        return []
    try:
        items = json.loads(raw)
    except ValueError:
        return []
    return [
        AttachmentOut(
            id=str(a.get("id", "")),
            url=a["url"],
            kind=attachment_kind(a.get("mime"), a.get("url")),
            mime=a.get("mime"),
            width=a.get("width"),
            height=a.get("height"),
        )
        for a in items
        if isinstance(a, dict) and a.get("url")
    ]


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
        attachments=parse_attachments(post.attachments),
    )
