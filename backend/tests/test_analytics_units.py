"""Unit-тесты чистых функций аналитики: крайние случаи (пусто, NULL, часовые пояса, разрывы дат)."""

from datetime import date
from zoneinfo import ZoneInfo

from app.db.models import Post, User
from app.modules.analytics import audience, engagement, overview, posting_time
from app.modules.analytics.common import num
from app.modules.posts.schemas import to_post_out
from tests.conftest import dt

MSK = ZoneInfo("Europe/Moscow")
UTC = ZoneInfo("UTC")


def post(pid="p", created="2026-11-01T10:00:00Z", views=0, likes=0, comments=0, reposts=0, content="x"):
    return Post(
        id=pid,
        user_id=1,
        content=content,
        created_at=dt(created) if created else None,
        views_count=views,
        likes_count=likes,
        comments_count=comments,
        reposts_count=reposts,
        is_repost=False,
    )


# --- common -----------------------------------------------------------------------------

def test_num_handles_null_and_garbage():
    assert num(None) == 0
    assert num("7") == 7
    assert num("abc") == 0


# --- posting time -----------------------------------------------------------------------

def test_posting_time_empty():
    result = posting_time.build_posting_time([], MSK, "Europe/Moscow")
    assert len(result.buckets) == 24
    assert result.best.sufficient_data is False
    assert "Нет постов" in result.best.reason


def test_posting_time_converts_to_user_timezone():
    # 23:30 UTC = 02:30 MSK следующего дня
    posts = [post(f"p{i}", "2026-11-01T23:30:00Z", views=10) for i in range(5)]
    result = posting_time.build_posting_time(posts, MSK, "Europe/Moscow")
    assert result.buckets[2].posts == 5
    assert result.buckets[23].posts == 0
    assert result.best.hour == 2
    assert result.best.label == "02:00 - 03:00"


def test_posting_time_requires_min_posts_per_bucket():
    # 30 постов всего, но в каждом часе по одному — «лучшего часа» нет
    posts = [post(f"p{h}", f"2026-11-01T{h:02d}:00:00Z", views=100 * h) for h in range(24)]
    result = posting_time.build_posting_time(posts, UTC, "UTC", min_posts_per_bucket=3)
    assert result.best.sufficient_data is False
    assert all(not b.sufficient for b in result.buckets)


def test_posting_time_uses_average_not_sum():
    busy = [post(f"b{i}", "2026-11-01T10:00:00Z", views=20) for i in range(10)]  # сумма 200, среднее 20
    rare = [post(f"r{i}", "2026-11-01T15:00:00Z", views=50) for i in range(3)]  # сумма 150, среднее 50
    result = posting_time.build_posting_time(busy + rare, UTC, "UTC", min_posts_per_bucket=3)
    assert result.best.hour == 15
    assert result.best.avg_views == 50
    assert result.best.sample_posts == 3


def test_posting_time_skips_null_dates_and_counts_interactions():
    posts = [post("n", created=None)] + [post(f"p{i}", "2026-11-01T08:00:00Z", views=10, likes=1, comments=1) for i in range(5)]
    result = posting_time.build_posting_time(posts, UTC, "UTC")
    assert sum(b.posts for b in result.buckets) == 5
    assert result.best.avg_interactions == 2


# --- engagement -------------------------------------------------------------------------

def test_by_publication_date_includes_views_and_respects_timezone():
    posts = [
        post("a", "2026-11-01T22:00:00Z", views=10, likes=1),  # 02.11 по Москве
        post("b", "2026-11-01T10:00:00Z", views=5),
        post("c", None, views=1000),
    ]
    result = engagement.by_publication_date(posts, MSK, "Europe/Moscow")
    assert result.source == "post_date"
    assert [(i.date, i.views, i.posts) for i in result.items] == [(date(2026, 11, 1), 5, 1), (date(2026, 11, 2), 10, 1)]


def test_by_publication_date_has_gaps_not_interpolation():
    posts = [post("a", "2026-11-01T10:00:00Z"), post("b", "2026-11-05T10:00:00Z")]
    days = [i.date for i in engagement.by_publication_date(posts, UTC, "UTC").items]
    assert days == [date(2026, 11, 1), date(2026, 11, 5)]


def test_by_publication_date_empty_and_null_metrics():
    assert engagement.by_publication_date([], UTC, "UTC").items == []
    p = post("a")
    p.views_count = None
    p.likes_count = None
    item = engagement.by_publication_date([p], UTC, "UTC").items[0]
    assert item.views == 0 and item.likes == 0


def test_dynamics_carries_forward_unchanged_posts():
    snaps = [
        engagement.MetricsSnapshot("a", dt("2026-11-01T10:00:00Z"), 10, 1, 0, 0),
        engagement.MetricsSnapshot("b", dt("2026-11-01T10:00:00Z"), 5, 0, 0, 0),
        engagement.MetricsSnapshot("a", dt("2026-11-03T10:00:00Z"), 30, 2, 1, 0),  # b не менялся
    ]
    result = engagement.dynamics(snaps, UTC)
    assert result.since == date(2026, 11, 1)
    assert [(i.date, i.views, i.likes, i.comments) for i in result.items] == [
        (date(2026, 11, 1), 15, 1, 0),
        (date(2026, 11, 3), 35, 2, 1),
    ]


def test_dynamics_empty():
    result = engagement.dynamics([], UTC)
    assert result.items == [] and result.since is None


def test_weekdays():
    posts = [post("a", "2026-11-02T10:00:00Z", views=10, likes=2), post("b", None)]  # 02.11.2026 — понедельник
    result = engagement.weekdays(posts, UTC, "UTC")
    assert len(result.items) == 7
    assert result.items[0].posts == 1 and result.items[0].interactions == 2
    assert sum(i.posts for i in result.items) == 1


# --- audience ---------------------------------------------------------------------------

NOW = dt("2026-11-07T12:00:00Z")


def test_followers_no_data():
    s = audience.build_followers_series(100, [], [], None, UTC, NOW)
    assert s.points == []
    assert s.includes_unfollows is False
    assert "Данных нет" in s.note


def test_followers_reconstructed_backwards_from_current():
    follows = [
        audience.Follow("f1", dt("2026-11-05T10:00:00Z")),
        audience.Follow("f2", dt("2026-11-07T08:00:00Z")),
        audience.Follow("f3", dt("2026-11-07T09:00:00Z")),
    ]
    s = audience.build_followers_series(100, [], follows, dt("2026-11-04T00:00:00Z"), UTC, NOW)
    values = {p.date: (p.followers, p.new_followers, p.source) for p in s.points}
    assert values[date(2026, 11, 4)] == (97, 0, "notifications")
    assert values[date(2026, 11, 5)] == (98, 1, "notifications")
    assert values[date(2026, 11, 6)] == (98, 0, "notifications")  # разрыв заполняется честно: подписок не было
    assert values[date(2026, 11, 7)] == (100, 2, "notifications")
    assert s.notifications_since == date(2026, 11, 4)
    assert "без учёта отписок" in s.note


def test_followers_refollow_counted_once_and_left_followers_ignored():
    follows = [
        audience.Follow("f1", dt("2026-11-05T10:00:00Z"), True),
        audience.Follow("f1", dt("2026-11-06T10:00:00Z"), True),  # повторная подписка
        audience.Follow("gone", dt("2026-11-06T11:00:00Z"), False),  # подписался и ушёл
    ]
    s = audience.build_followers_series(50, [], follows, dt("2026-11-05T00:00:00Z"), UTC, NOW)
    values = {p.date: p.followers for p in s.points}
    assert values[date(2026, 11, 5)] == 49
    assert values[date(2026, 11, 6)] == 50
    assert audience.new_followers_by_day(follows, UTC) == {date(2026, 11, 6): 1}


def test_followers_snapshots_override_reconstruction():
    snaps = [
        audience.SnapshotPoint(dt("2026-11-06T08:00:00Z"), 90),
        audience.SnapshotPoint(dt("2026-11-06T20:00:00Z"), 95),  # последний за день
    ]
    s = audience.build_followers_series(100, snaps, [], dt("2026-11-05T00:00:00Z"), UTC, NOW)
    by_day = {p.date: p for p in s.points}
    assert by_day[date(2026, 11, 6)].followers == 95
    assert by_day[date(2026, 11, 6)].source == "snapshot"
    assert by_day[date(2026, 11, 6)].new_followers == 0
    assert s.snapshots_since == date(2026, 11, 6)


def test_followers_snapshots_only_have_unknown_new_followers():
    s = audience.build_followers_series(100, [audience.SnapshotPoint(NOW, 100)], [], None, UTC, NOW)
    assert len(s.points) == 1
    assert s.points[0].new_followers is None
    assert s.notifications_since is None


def test_followers_timezone_shifts_day():
    follows = [audience.Follow("f1", dt("2026-11-06T22:30:00Z"))]  # 07.11 01:30 по Москве
    assert audience.new_followers_by_day(follows, MSK) == {date(2026, 11, 7): 1}


def test_followers_today():
    follows = [audience.Follow("f1", dt("2026-11-07T08:00:00Z")), audience.Follow("f2", dt("2026-11-06T08:00:00Z"))]
    assert audience.followers_today(follows, True, UTC, NOW) == 1
    assert audience.followers_today([], True, UTC, NOW) == 0
    assert audience.followers_today(follows, False, UTC, NOW) is None


# --- overview ---------------------------------------------------------------------------

def make_user():
    return User(id=1, username="tester", followers_count=10, following_count=2, timezone="UTC")


def test_overview_empty_posts():
    o = overview.build_overview(make_user(), [], None, UTC, lambda p: to_post_out(p, "tester"))
    assert o.posts_count == 0
    assert o.engagement_rate == 0
    assert o.top_post is None
    assert o.best_posting_time.sufficient_data is False
    assert o.followers_today is None


def test_overview_null_content_top_post_does_not_crash():
    posts = [post("a", views=100, content=None), post("b", views=10)]
    o = overview.build_overview(make_user(), posts, 3, UTC, lambda p: to_post_out(p, "tester"))
    assert o.top_post.id == "a"
    assert o.top_post.content == ""
    assert o.followers_today == 3


def test_overview_engagement_rate_by_views():
    posts = [post("a", views=100, likes=5, comments=3, reposts=2), post("b", views=0, likes=10)]
    o = overview.build_overview(make_user(), posts, None, UTC, lambda p: to_post_out(p, "tester"))
    assert o.engagement_rate == 0.2  # (5+3+2+10)/100
    assert o.avg_views_per_post == 50
    assert "просмотры" in o.engagement_rate_formula


def test_overview_zero_views():
    o = overview.build_overview(make_user(), [post("a", likes=5)], None, UTC, lambda p: to_post_out(p, "tester"))
    assert o.engagement_rate == 0
