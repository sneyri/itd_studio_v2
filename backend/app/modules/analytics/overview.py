"""Сводка по аккаунту: суммы и средние по постам, ER по просмотрам, топ-пост, лучшее время."""

from collections.abc import Callable, Sequence
from zoneinfo import ZoneInfo

from app.db.models import Post, User
from app.modules.analytics.common import interactions, num
from app.modules.analytics.posting_time import DEFAULT_MIN_POSTS_PER_BUCKET, build_posting_time
from app.modules.analytics.schemas import Overview
from app.modules.posts.schemas import PostOut

ER_FORMULA = "(лайки + комментарии + репосты) / просмотры, по всем постам в базе"


def engagement_rate(posts: Sequence[Post]) -> float:
    views = sum(num(p.views_count) for p in posts)
    if views <= 0:
        return 0.0
    return round(sum(interactions(p) for p in posts) / views, 4)


def build_overview(
    user: User,
    posts: Sequence[Post],
    followers_today: int | None,
    zone: ZoneInfo,
    to_post_out: Callable[[Post], PostOut],
    min_posts_per_bucket: int = DEFAULT_MIN_POSTS_PER_BUCKET,
) -> Overview:
    count = len(posts)
    total_views = sum(num(p.views_count) for p in posts)
    total_likes = sum(num(p.likes_count) for p in posts)
    total_comments = sum(num(p.comments_count) for p in posts)
    total_reposts = sum(num(p.reposts_count) for p in posts)

    def avg(total: int) -> float:
        return round(total / count, 2) if count else 0.0

    top = max(posts, key=lambda p: num(p.views_count), default=None)
    posting = build_posting_time(posts, zone, user.timezone, min_posts_per_bucket)

    return Overview(
        followers_count=num(user.followers_count),
        following_count=num(user.following_count),
        posts_count=count,
        followers_today=followers_today,
        total_views=total_views,
        total_likes=total_likes,
        total_comments=total_comments,
        total_reposts=total_reposts,
        avg_views_per_post=avg(total_views),
        avg_likes_per_post=avg(total_likes),
        avg_comments_per_post=avg(total_comments),
        engagement_rate=engagement_rate(posts),
        engagement_rate_formula=ER_FORMULA,
        best_posting_time=posting.best,
        top_post=to_post_out(top) if top is not None else None,
        last_synced_at=user.last_synced_at,
    )
