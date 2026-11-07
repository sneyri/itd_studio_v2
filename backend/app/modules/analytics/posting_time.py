"""Лучшее время для публикаций.

Час публикации берётся из created_at (UTC) и переводится в часовой пояс пользователя.
Час считается «достаточным», только если в нём не меньше `min_posts_per_bucket` постов —
иначе один удачный пост сделал бы час «лучшим». Сравниваем СРЕДНИЕ просмотры на пост
(а не сумму — сумма просто выигрывает у часов, в которые публикуются чаще).
"""

from collections.abc import Iterable
from zoneinfo import ZoneInfo

from app.modules.analytics.common import PostMetrics, interactions, num
from app.modules.analytics.schemas import BestPostingTime, HourBucket, PostingTime

DEFAULT_MIN_POSTS_PER_BUCKET = 5


def hourly_buckets(posts: Iterable[PostMetrics], zone: ZoneInfo, min_posts_per_bucket: int) -> list[HourBucket]:
    totals = {h: {"posts": 0, "views": 0, "interactions": 0} for h in range(24)}
    for post in posts:
        if post.created_at is None:
            continue
        hour = post.created_at.astimezone(zone).hour
        bucket = totals[hour]
        bucket["posts"] += 1
        bucket["views"] += num(post.views_count)
        bucket["interactions"] += interactions(post)

    result = []
    for hour, b in totals.items():
        count = b["posts"]
        result.append(
            HourBucket(
                hour=hour,
                posts=count,
                avg_views=round(b["views"] / count, 2) if count else 0.0,
                avg_interactions=round(b["interactions"] / count, 2) if count else 0.0,
                sufficient=count >= min_posts_per_bucket,
            )
        )
    return result


def best_posting_time(buckets: list[HourBucket], timezone_name: str, min_posts_per_bucket: int) -> BestPostingTime:
    total_posts = sum(b.posts for b in buckets)
    if total_posts == 0:
        return BestPostingTime(sufficient_data=False, reason="Нет постов с датой публикации", timezone=timezone_name)

    candidates = [b for b in buckets if b.sufficient]
    if not candidates:
        return BestPostingTime(
            sufficient_data=False,
            reason=f"Ни в одном часе нет {min_posts_per_bucket}+ постов — выборка слишком мала",
            timezone=timezone_name,
        )

    best = max(candidates, key=lambda b: (b.avg_views, b.avg_interactions, b.posts))
    return BestPostingTime(
        sufficient_data=True,
        hour=best.hour,
        label=f"{best.hour:02d}:00 - {(best.hour + 1) % 24:02d}:00",
        avg_views=best.avg_views,
        avg_interactions=best.avg_interactions,
        sample_posts=best.posts,
        timezone=timezone_name,
    )


def build_posting_time(
    posts: Iterable[PostMetrics],
    zone: ZoneInfo,
    timezone_name: str,
    min_posts_per_bucket: int = DEFAULT_MIN_POSTS_PER_BUCKET,
) -> PostingTime:
    buckets = hourly_buckets(posts, zone, min_posts_per_bucket)
    return PostingTime(
        timezone=timezone_name,
        min_posts_per_bucket=min_posts_per_bucket,
        buckets=buckets,
        best=best_posting_time(buckets, timezone_name, min_posts_per_bucket),
    )
