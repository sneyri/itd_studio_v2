"""HTTP-эндпоинты комментариев (/api/comments): последние комментарии из уведомлений итд
и посты с наибольшим числом комментариев."""

from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.api.deps import CurrentUser, DbSession
from app.modules.notifications.repository import NotificationsRepository
from app.modules.posts.repository import PostsRepository
from app.modules.posts.schemas import PostsList, to_post_out

router = APIRouter(prefix="/comments", tags=["comments"])


class CommentAuthor(BaseModel):
    username: str | None
    display_name: str | None
    avatar: str | None


class CommentEvent(BaseModel):
    id: str
    type: Literal["comment", "reply", "comment_mention"]
    author: CommentAuthor
    preview: str | None
    post_id: str | None
    created_at: datetime


class CommentEvents(BaseModel):
    items: list[CommentEvent]
    since: datetime | None


@router.get("/recent", response_model=CommentEvents, summary="Последние комментарии (по уведомлениям итд)")
def recent_comments(user: CurrentUser, db: DbSession, limit: int = Query(30, ge=1, le=100)):
    repo = NotificationsRepository(db)
    events = repo.recent_comments(user.id, limit)
    return CommentEvents(
        items=[
            CommentEvent(
                id=e.id,
                type=e.type,
                author=CommentAuthor(
                    username=e.actor_username, display_name=e.actor_display_name, avatar=e.actor_avatar
                ),
                preview=e.preview,
                post_id=e.target_id,
                created_at=e.created_at,
            )
            for e in events
        ],
        since=repo.oldest_notification_at(user.id),
    )


@router.get("/top-posts", response_model=PostsList, summary="Посты с наибольшим числом комментариев")
def top_commented(user: CurrentUser, db: DbSession, limit: int = Query(10, ge=1, le=50)):
    items, _ = PostsRepository(db).page(user.id, limit, 0, "comments")
    return PostsList(items=[to_post_out(p, user.username) for p in items])
