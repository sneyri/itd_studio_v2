def build_growth_series(posts: list[dict], field: str) -> list[dict]:
    if not posts:
        return []

    metric_field_map = {
        "likes": "likes_count",
        "comments": "comments_count",
        "reposts": "reposts_count",
    }
    metric_field = metric_field_map.get(field, field)

    grouped: dict[str, dict] = {}
    for post in posts:
        created_at = post.get("created_at")
        if not created_at:
            continue

        date = created_at.split("T")[0] if "T" in created_at else created_at[:10]
        bucket = grouped.setdefault(date, {"likes": 0, "comments": 0, "reposts": 0, "views": 0, "posts": 0})
        bucket[field] += int(post.get(metric_field, 0) or 0)
        bucket["posts"] += 1

    sorted_dates = sorted(grouped.keys())
    result = []
    running_total = 0
    for date in sorted_dates:
        running_total += grouped[date][field]
        result.append({
            "date": date,
            "count": running_total,
            "daily": grouped[date][field],
            "posts": grouped[date]["posts"],
        })

    return result


def build_followers_growth_series(posts: list[dict], followers_count: int) -> list[dict]:
    if not posts:
        return []

    grouped: dict[str, dict] = {}
    for post in posts:
        created_at = post.get("created_at")
        if not created_at:
            continue

        date = created_at.split("T")[0] if "T" in created_at else created_at[:10]
        bucket = grouped.setdefault(date, {"posts": 0, "likes": 0})
        bucket["posts"] += 1
        bucket["likes"] += int(post.get("likes_count", 0) or 0)

    sorted_dates = sorted(grouped.keys())
    total_activity = sum(entry["posts"] for entry in grouped.values())
    result = []
    running_total = 0

    if total_activity > 0:
        for date in sorted_dates:
            daily_posts = grouped[date]["posts"]
            daily_followers = int((daily_posts / total_activity) * followers_count)
            running_total += daily_followers
            result.append({
                "date": date,
                "count": running_total,
                "daily": daily_followers,
                "posts": daily_posts,
            })

    return result
