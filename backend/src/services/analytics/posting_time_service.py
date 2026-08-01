def calculate_best_posting_time(posts: list[dict]) -> dict:
    if len(posts) < 5:
        return {
            "sufficient_data": False,
            "label": None,
            "reason": "Недостаточно постов для расчета (нужно минимум 5)",
            "posts_considered": len(posts),
        }

    buckets = {}
    for post in posts:
        created_at = post.get("created_at")
        if not created_at:
            continue
        try:
            if "T" in created_at:
                time_str = created_at.split("T")[1][:5]
                hour = int(time_str.split(":")[0])
            else:
                continue
        except (ValueError, IndexError):
            continue

        bucket = buckets.setdefault(hour, {
            "views": 0,
            "posts": 0,
            "likes": 0,
            "comments": 0,
            "reposts": 0,
        })
        bucket["views"] += int(post.get("views_count", 0) or 0)
        bucket["likes"] += int(post.get("likes_count", 0) or 0)
        bucket["comments"] += int(post.get("comments_count", 0) or 0)
        bucket["reposts"] += int(post.get("reposts_count", 0) or 0)
        bucket["posts"] += 1

    if not buckets:
        return {
            "sufficient_data": False,
            "label": None,
            "reason": "Нет данных о времени публикации",
            "posts_considered": len(posts),
        }

    best_hour, best_data = max(
        buckets.items(),
        key=lambda item: (
            item[1]["views"],
            item[1]["likes"] + item[1]["comments"] + item[1]["reposts"],
            item[1]["posts"],
        ),
    )

    avg_views = best_data["views"] / best_data["posts"] if best_data["posts"] else 0
    avg_interactions = (best_data["likes"] + best_data["comments"] + best_data["reposts"]) / best_data["posts"] if best_data["posts"] else 0

    return {
        "sufficient_data": True,
        "label": f"{best_hour:02d}:00 - {((best_hour + 1) % 24):02d}:00",
        "hour": best_hour,
        "posts_considered": len(posts),
        "sample_posts": best_data["posts"],
        "avg_views": round(avg_views, 2),
        "avg_interactions": round(avg_interactions, 2),
    }
