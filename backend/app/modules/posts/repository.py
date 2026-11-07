"""Доступ к постам и снимкам их метрик (posts, post_metrics_snapshots)."""

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import Post, PostMetricsSnapshot
from app.integrations.itd.client import ItdPost

SORT_COLUMNS = {
    "new": Post.created_at.desc(),
    "views": Post.views_count.desc(),
    "likes": Post.likes_count.desc(),
    "comments": Post.comments_count.desc(),
}


class PostsRepository:
    def __init__(self, db: Session):
        self.db = db

    def all_for_user(self, user_id: int) -> list[Post]:
        return list(self.db.scalars(select(Post).where(Post.user_id == user_id)))

    def page(self, user_id: int, limit: int, offset: int, sort: str = "new") -> tuple[list[Post], int]:
        order = SORT_COLUMNS.get(sort, SORT_COLUMNS["new"])
        items = self.db.scalars(
            select(Post).where(Post.user_id == user_id).order_by(order, Post.id).limit(limit).offset(offset)
        )
        total = self.db.scalar(select(func.count()).select_from(Post).where(Post.user_id == user_id)) or 0
        return list(items), total

    def upsert_from_itd(self, user_id: int, posts: Sequence[ItdPost], seen_at: datetime) -> int:
        """Обновляет посты и пишет снимок метрик для тех, у кого метрики изменились.

        Возвращает число записанных снимков. Последний снимок поста берётся одним запросом.
        """
        existing = {p.id: p for p in self.db.scalars(select(Post).where(Post.user_id == user_id))}
        last_snap = self._latest_snapshots(user_id)
        written = 0
        for item in posts:
            post = existing.get(item.id)
            if post is None:
                post = Post(id=item.id, user_id=user_id)
                self.db.add(post)
            post.content = item.content
            post.created_at = item.created_at
            post.edited_at = item.edited_at
            post.likes_count = item.likes_count
            post.comments_count = item.comments_count
            post.reposts_count = item.reposts_count
            post.views_count = item.views_count
            post.is_repost = item.is_repost
            post.repost_original_id = item.repost_original_id
            post.last_seen_at = seen_at

            metrics = (item.views_count, item.likes_count, item.comments_count, item.reposts_count)
            if last_snap.get(item.id) != metrics:
                self.db.add(
                    PostMetricsSnapshot(
                        post_id=item.id,
                        captured_at=seen_at,
                        views=metrics[0],
                        likes=metrics[1],
                        comments=metrics[2],
                        reposts=metrics[3],
                    )
                )
                written += 1
        return written

    def _latest_snapshots(self, user_id: int) -> dict[str, tuple[int, int, int, int]]:
        latest = (
            select(PostMetricsSnapshot.post_id, func.max(PostMetricsSnapshot.captured_at).label("ts"))
            .join(Post, Post.id == PostMetricsSnapshot.post_id)
            .where(Post.user_id == user_id)
            .group_by(PostMetricsSnapshot.post_id)
            .subquery()
        )
        rows = self.db.execute(
            select(
                PostMetricsSnapshot.post_id,
                PostMetricsSnapshot.views,
                PostMetricsSnapshot.likes,
                PostMetricsSnapshot.comments,
                PostMetricsSnapshot.reposts,
            ).join(
                latest,
                (latest.c.post_id == PostMetricsSnapshot.post_id) & (latest.c.ts == PostMetricsSnapshot.captured_at),
            )
        )
        return {r.post_id: (r.views, r.likes, r.comments, r.reposts) for r in rows}

    def metric_snapshots(self, user_id: int) -> list[PostMetricsSnapshot]:
        return list(
            self.db.scalars(
                select(PostMetricsSnapshot)
                .join(Post, Post.id == PostMetricsSnapshot.post_id)
                .where(Post.user_id == user_id)
                .order_by(PostMetricsSnapshot.captured_at)
            )
        )
