"""Интеграционные тесты роутеров (TestClient + фейковый шлюз итд)."""

import logging
from dataclasses import replace

import pytest
from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import get_cipher
from app.db.models import FollowEvent, PostMetricsSnapshot, User
from app.db.session import SessionLocal
from app.integrations.itd.client import ItdAuthError, ItdUnavailableError
from app.main import app
from app.modules.sync.service import SyncRunner
from app.modules.sync.worker import run_once
from tests.conftest import TEST_REFRESH_TOKEN, FakeGateway

PUBLIC = {"/api/status", "/api/auth/login", "/openapi.json", "/docs", "/docs/oauth2-redirect", "/redoc"}


def run_worker():
    return run_once(SyncRunner(SessionLocal, get_cipher(), FakeGateway))


def test_status_is_public(client):
    assert client.get("/api/status").json()["status"] == "ok"


def test_all_endpoints_require_session(client):
    checked = 0
    for raw_path, operations in app.openapi()["paths"].items():
        if raw_path in PUBLIC:
            continue
        path = raw_path.replace("{job_id}", "1")
        for method in operations:
            resp = client.request(method.upper(), path)
            assert resp.status_code == 401, f"{method} {path} → {resp.status_code}"
            assert resp.json()["error"]["code"] == "unauthorized"
            checked += 1
    assert checked >= 12


def test_login_rejects_token_in_url_style_request(client):
    # старый эндпоинт удалён
    assert client.post(f"/api/sync/{TEST_REFRESH_TOKEN}").status_code in (401, 404, 405)


def test_login_stores_encrypted_rotated_token_and_sets_httponly_cookie(client):
    resp = client.post("/api/auth/login", json={"refresh_token": TEST_REFRESH_TOKEN})
    assert resp.status_code == 200
    assert resp.json()["username"] == "tester"
    assert "httponly" in resp.headers["set-cookie"].lower()
    with SessionLocal() as db:
        user = db.scalar(select(User))
        assert TEST_REFRESH_TOKEN not in user.encrypted_refresh_token
        assert get_cipher().decrypt(user.encrypted_refresh_token) == FakeGateway.rotate_to


def test_login_invalid_token(client, monkeypatch):
    monkeypatch.setattr(FakeGateway, "raise_on_init", ItdAuthError("bad"))
    resp = client.post("/api/auth/login", json={"refresh_token": TEST_REFRESH_TOKEN})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "invalid_token"


def test_login_itd_unavailable(client, monkeypatch):
    monkeypatch.setattr(FakeGateway, "raise_on_init", ItdUnavailableError("NetworkError"))
    resp = client.post("/api/auth/login", json={"refresh_token": TEST_REFRESH_TOKEN})
    assert resp.status_code == 502


def test_login_validation(client):
    assert client.post("/api/auth/login", json={"refresh_token": "x"}).status_code == 422


def test_full_sync_flow(logged_in, caplog):
    caplog.set_level(logging.DEBUG)
    client = logged_in
    resp = client.post("/api/sync")
    assert resp.status_code == 202
    job_id = resp.json()["id"]
    assert resp.json()["status"] == "queued"

    # повторный запрос, пока задача в очереди, возвращает её же
    assert client.post("/api/sync").json()["id"] == job_id

    assert run_worker() is True
    assert run_worker() is False

    job = client.get(f"/api/sync/{job_id}").json()
    assert job["status"] == "done", job
    assert job["posts_synced"] == 2
    assert job["new_follow_events"] == 1
    assert client.get("/api/sync/latest").json()["id"] == job_id

    # rate limit
    resp = client.post("/api/sync")
    assert resp.status_code == 429
    assert resp.json()["error"]["code"] == "sync_cooldown"
    assert int(resp.headers["retry-after"]) > 0

    overview = client.get("/api/analytics/overview").json()
    assert overview["posts_count"] == 2
    assert overview["total_views"] == 150
    assert overview["top_post"]["id"] == "p1"
    assert overview["followers_count"] == 10

    followers = client.get("/api/analytics/audience/followers").json()
    assert followers["includes_unfollows"] is False
    assert followers["points"][-1]["followers"] == 10
    assert followers["points"][-1]["source"] == "snapshot"
    assert followers["notifications_since"] == "2026-11-04"

    new = client.get("/api/analytics/audience/new-followers").json()["items"]
    assert new[0]["username"] == "fan1"

    pub = client.get("/api/analytics/engagement/by-publication-date").json()
    assert pub["source"] == "post_date" and sum(i["views"] for i in pub["items"]) == 150

    dyn = client.get("/api/analytics/engagement/dynamics").json()
    assert dyn["items"][-1]["views"] == 150

    pt = client.get("/api/analytics/posting-time").json()
    assert pt["timezone"] == "Europe/Moscow" and len(pt["buckets"]) == 24

    assert len(client.get("/api/analytics/weekdays").json()["items"]) == 7

    comments = client.get("/api/comments/recent").json()
    assert comments["items"][0]["author"]["username"] == "critic"
    assert client.get("/api/comments/top-posts").json()["items"][0]["id"] == "p2"

    posts = client.get("/api/posts", params={"sort": "views", "limit": 1}).json()
    assert posts["total"] == 2 and posts["items"][0]["id"] == "p1"
    assert posts["items"][0]["url"].startswith("https://")

    with SessionLocal() as db:
        assert db.scalar(select(FollowEvent)).is_current_follower is True
        assert len(db.scalars(select(PostMetricsSnapshot)).all()) == 2

    # токен не попадает в логи
    assert TEST_REFRESH_TOKEN not in caplog.text
    assert FakeGateway.rotate_to not in caplog.text


def test_resync_writes_snapshots_only_for_changed_posts(logged_in, monkeypatch):
    client = logged_in
    client.post("/api/sync")
    run_worker()
    monkeypatch.setattr(get_settings(), "sync_cooldown", 0)
    changed = [replace(FakeGateway.posts[0], views_count=200), FakeGateway.posts[1]]
    monkeypatch.setattr(FakeGateway, "posts", changed)
    assert client.post("/api/sync").status_code == 202
    run_worker()
    with SessionLocal() as db:
        snaps = db.scalars(select(PostMetricsSnapshot)).all()
        assert len(snaps) == 3  # p1 дважды, p2 один раз
        # follow_event не задублировался
        assert len(db.scalars(select(FollowEvent)).all()) == 1


def test_sync_job_fails_gracefully_on_auth_error(logged_in, monkeypatch):
    client = logged_in
    job_id = client.post("/api/sync").json()["id"]
    monkeypatch.setattr(FakeGateway, "raise_on_init", ItdAuthError("SessionRevokedError"))
    run_worker()
    job = client.get(f"/api/sync/{job_id}").json()
    assert job["status"] == "failed"
    assert "войдите заново" in job["error"]
    # после ошибки — короткая пауза перед повтором
    assert client.post("/api/sync").status_code == 429


def test_sync_job_unavailable_and_unexpected_errors(logged_in, monkeypatch):
    client = logged_in
    job_id = client.post("/api/sync").json()["id"]
    monkeypatch.setattr(FakeGateway, "raise_on_init", ItdUnavailableError("NetworkError"))
    run_worker()
    assert client.get(f"/api/sync/{job_id}").json()["error"] == "Сервис итд недоступен, попробуйте позже"

    with SessionLocal() as db:
        from app.modules.sync.repository import SyncJobsRepository

        job = SyncJobsRepository(db).create(db.scalar(select(User)).id)
        db.commit()
        new_id = job.id
    monkeypatch.setattr(FakeGateway, "raise_on_init", RuntimeError("boom with secret"))
    run_worker()
    body = client.get(f"/api/sync/{new_id}").json()
    assert body["error"] == "Внутренняя ошибка синхронизации"
    assert "boom" not in body["error"]


def test_notifications_failure_does_not_break_sync(logged_in, monkeypatch):
    client = logged_in
    job_id = client.post("/api/sync").json()["id"]

    def broken(self, *a, **k):
        raise ItdUnavailableError("RateLimitError")

    monkeypatch.setattr(FakeGateway, "notifications", broken)
    run_worker()
    job = client.get(f"/api/sync/{job_id}").json()
    assert job["status"] == "done" and job["new_follow_events"] == 0


def test_job_of_other_user_is_hidden(logged_in):
    assert logged_in.get("/api/sync/999").status_code == 404


def test_settings_timezone(logged_in):
    assert logged_in.get("/api/settings").json() == {"timezone": "Europe/Moscow"}
    assert logged_in.put("/api/settings", json={"timezone": "Asia/Yekaterinburg"}).status_code == 200
    assert logged_in.get("/api/auth/me").json()["timezone"] == "Asia/Yekaterinburg"
    resp = logged_in.put("/api/settings", json={"timezone": "Mars/Base"})
    assert resp.status_code == 422 and resp.json()["error"]["code"] == "validation_error"


@pytest.mark.parametrize("params", [{"limit": 0}, {"limit": 201}, {"offset": -1}, {"sort": "random"}])
def test_posts_query_validation(logged_in, params):
    assert logged_in.get("/api/posts", params=params).status_code == 422


def test_logout_removes_session_and_token(logged_in):
    assert logged_in.post("/api/auth/logout").status_code == 204
    with SessionLocal() as db:
        assert db.scalar(select(User)).encrypted_refresh_token is None
    assert logged_in.get("/api/auth/me").status_code == 401
    # без сохранённого токена синк невозможен даже с новой сессией не начнётся без входа
    assert logged_in.post("/api/sync").status_code == 401


def synced(client):
    client.post("/api/sync")
    run_worker()
    return client


def test_posts_include_attachments_and_media_filter(logged_in):
    client = logged_in
    before = client.get("/api/posts").json()
    assert before["items"] == [] and before["attachments_synced"] is False
    synced(client)
    page = client.get("/api/posts").json()
    assert page["attachments_synced"] is True
    by_id = {p["id"]: p for p in page["items"]}
    assert by_id["p1"]["attachments"][0]["kind"] == "image"
    assert by_id["p1"]["attachments"][0]["width"] == 800
    assert by_id["p2"]["attachments"][0]["kind"] == "video"

    def ids(media):
        return [p["id"] for p in client.get("/api/posts", params={"media": media}).json()["items"]]

    assert ids("image") == ["p1"]
    assert ids("video") == ["p2"]
    assert sorted(ids("with_media")) == ["p1", "p2"]
    assert ids("text_only") == []
    assert client.get("/api/analytics/overview").json()["top_post"]["attachments"][0]["kind"] == "image"


def test_notifications_filters_and_sorting(logged_in):
    client = synced(logged_in)

    def get(**params):
        return client.get("/api/notifications", params=params).json()

    everything = get()
    assert everything["total"] == 4
    assert [i["id"] for i in everything["items"]] == ["n3", "n4", "n1", "n2"]  # новые сверху
    assert [i["id"] for i in get(sort="old")["items"]] == ["n2", "n1", "n4", "n3"]
    assert [i["actor"]["username"] for i in get(sort="actor")["items"]] == ["critic", "critic", "fan1", "star"]

    assert [i["id"] for i in get(types=["like"])["items"]] == ["n3", "n4"]
    both = client.get("/api/notifications?types=like&types=follow").json()["items"]
    assert {i["id"] for i in both} == {"n1", "n3", "n4"}
    assert [i["id"] for i in get(actor="@Critic")["items"]] == ["n4", "n2"]

    # верификация: n3 — из уведомления, f1 — из списка подписчиков (не верифицирован), critic — неизвестно
    assert [i["id"] for i in get(verified="true")["items"]] == ["n3"]
    assert [i["id"] for i in get(verified="false")["items"]] == ["n1"]
    star = get(verified="true")["items"][0]
    assert star["actor"]["is_verified"] is True
    assert star["post"]["id"] == "p1" and star["post"]["attachments"][0]["kind"] == "image"
    assert get(actor="critic")["items"][0]["actor"]["is_verified"] is None

    assert [i["id"] for i in get(unread="true")["items"]] == ["n3"]
    assert [i["id"] for i in get(q="звезда")["items"]] == ["n3"]  # кириллица без учёта регистра
    assert [i["id"] for i in get(q="NICE")["items"]] == ["n2"]
    # n3 создан 06.11 21:30 UTC = 07.11 00:30 по Москве
    assert [i["id"] for i in get(date_from="2026-11-07", date_to="2026-11-07")["items"]] == ["n3"]
    assert {i["id"] for i in get(date_to="2026-11-05")["items"]} == {"n1", "n2"}

    paged = get(limit=1, offset=1)
    assert paged["total"] == 4 and [i["id"] for i in paged["items"]] == ["n4"]


def test_notifications_summary_and_actors(logged_in):
    client = synced(logged_in)
    s = client.get("/api/notifications/summary").json()
    assert s["total"] == 4 and s["unread"] == 1
    assert s["by_type"][0] == {"type": "like", "count": 2}
    assert s["verified"] == {"verified": 1, "not_verified": 1, "unknown": 2}
    assert s["top_actors"][0]["username"] == "critic" and s["top_actors"][0]["count"] == 2
    assert len(s["by_day"]) == 30
    assert s["since"].startswith("2026-11-04")

    actors = client.get("/api/notifications/actors", params={"q": "ЗВЕЗ"}).json()["items"]
    assert [a["username"] for a in actors] == ["star"] and actors[0]["is_verified"] is True
    assert len(client.get("/api/notifications/actors").json()["items"]) == 3


@pytest.mark.parametrize(
    "params", [{"types": "spam"}, {"sort": "random"}, {"limit": 0}, {"verified": "maybe"}, {"date_from": "07.11.2026"}]
)
def test_notifications_validation(logged_in, params):
    assert logged_in.get("/api/notifications", params=params).status_code == 422


def test_notifications_empty(logged_in):
    s = logged_in.get("/api/notifications/summary").json()
    assert s["total"] == 0 and s["since"] is None and s["top_actors"] == []
    assert logged_in.get("/api/notifications").json()["items"] == []
