from src.services.analytics.posting_time_service import calculate_best_posting_time


def build_overview_payload(username: str, user_data: dict, posts: list[dict]) -> dict:
    if not posts:
        return {
            "username": username,
            "display_name": user_data.get("displayName", username),
            "avatar": user_data.get("avatar"),
            "bio": user_data.get("bio"),
            "followers_count": user_data.get("followers_count", 0),
            "following_count": user_data.get("following_count", 0),
            "posts_count": 0,
            "total_likes": 0,
            "total_views": 0,
            "total_comments": 0,
            "total_reposts": 0,
            "avg_likes_per_post": 0,
            "avg_views_per_post": 0,
            "avg_comments_per_post": 0,
            "engagement_rate": 0,
            "best_posting_time": {
                "sufficient_data": False,
                "label": None,
                "reason": "Нет постов для анализа",
            },
            "top_post": None,
        }

    total_likes = sum(int(post.get("likes_count", 0) or 0) for post in posts)
    total_views = sum(int(post.get("views_count", 0) or 0) for post in posts)
    total_comments = sum(int(post.get("comments_count", 0) or 0) for post in posts)
    total_reposts = sum(int(post.get("reposts_count", 0) or 0) for post in posts)

    posts_count = len(posts)
    avg_likes = total_likes / posts_count if posts_count > 0 else 0
    avg_views = total_views / posts_count if posts_count > 0 else 0
    avg_comments = total_comments / posts_count if posts_count > 0 else 0

    engagement_rate = (total_likes + total_comments + total_reposts) / total_views if total_views > 0 else 0

    top_post = max(posts, key=lambda post: int(post.get("views_count", 0) or 0), default=None)

    result = {
        "username": username,
        "display_name": user_data.get("displayName", username),
        "avatar": user_data.get("avatar"),
        "bio": user_data.get("bio"),
        "followers_count": user_data.get("followers_count", 0),
        "following_count": user_data.get("following_count", 0),
        "posts_count": posts_count,
        "total_likes": total_likes,
        "total_views": total_views,
        "total_comments": total_comments,
        "total_reposts": total_reposts,
        "avg_likes_per_post": round(avg_likes, 2),
        "avg_views_per_post": round(avg_views, 2),
        "avg_comments_per_post": round(avg_comments, 2),
        "engagement_rate": round(engagement_rate, 4),
        "best_posting_time": calculate_best_posting_time(posts),
        "top_post": {
            "id": top_post.get("id"),
            "content": top_post.get("content", "")[:200] + ("..." if len(top_post.get("content", "")) > 200 else ""),
            "views_count": top_post.get("views_count", 0),
            "likes_count": top_post.get("likes_count", 0),
            "comments_count": top_post.get("comments_count", 0),
            "reposts_count": top_post.get("reposts_count", 0),
            "created_at": top_post.get("created_at"),
        } if top_post else None,
    }

    return result
