"""Общие фикстуры тестов: временная БД, тестовый ключ шифрования, фейковый шлюз итд."""

import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from cryptography.fernet import Fernet

_TMP = Path(tempfile.mkdtemp(prefix="itd-tests-"))
os.environ["DB_URL"] = f"sqlite:///{(_TMP / 'test.db').as_posix()}"
os.environ["TOKEN_ENCRYPTION_KEY"] = Fernet.generate_key().decode()
os.environ["RUN_WORKER_IN_PROCESS"] = "false"
os.environ["SYNC_COOLDOWN"] = "600"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.api.deps import get_gateway_factory  # noqa: E402
from app.db.models import Base  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.integrations.itd.client import ItdAttachment, ItdNotification, ItdPost, ItdProfile, ItdUserLite  # noqa: E402
from app.main import app  # noqa: E402

UTC = timezone.utc
TEST_REFRESH_TOKEN = "eyJhbGciOiJIUzI1NiJ9.secret-refresh-token-payload.signature-part-123"


def dt(text: str) -> datetime:
    return datetime.fromisoformat(text.replace("Z", "+00:00")).astimezone(UTC)


class FakeGateway:
    """Подмена ItdGateway: отдаёт заранее заданные данные, умеет «ротировать» токен."""

    profile = ItdProfile(
        id="itd-user-1",
        username="tester",
        display_name="Tester",
        avatar="🫎",
        bio=None,
        followers_count=10,
        following_count=3,
        posts_count=2,
        registered_at=dt("2025-01-01T00:00:00Z"),
    )
    posts = [
        ItdPost(
            "p1", "hello", dt("2026-11-01T10:00:00Z"), None, 5, 1, 0, 100, False, None,
            (ItdAttachment("a1", "https://cdn.example/pic.jpg", "image/jpeg", 800, 600),),
        ),
        ItdPost(
            "p2", None, dt("2026-11-02T10:00:00Z"), None, 3, 2, 1, 50, False, None,
            (ItdAttachment("a2", "https://cdn.example/clip.mp4", "video"),),
        ),
    ]
    notifications_data = [
        ItdNotification("n1", "follow", "f1", "fan1", "Fan 1", None, None, None, dt("2026-11-05T09:00:00Z")),
        ItdNotification("n2", "comment", "c1", "critic", "Critic", None, "p1", "nice", dt("2026-11-04T09:00:00Z")),
        ItdNotification(
            "n3", "like", "s1", "star", "Звезда Итд", None, "p1", None, dt("2026-11-06T21:30:00Z"),
            actor_is_verified=True, is_read=False, target_type="post",
        ),
        ItdNotification(
            "n4", "like", "c1", "critic", "Critic", None, "p2", None, dt("2026-11-06T10:00:00Z"), is_read=True
        ),
    ]
    followers_result: list | None = [ItdUserLite("f1", "fan1", "Fan 1", None, False)]
    raise_on_init: Exception | None = None
    rotate_to: str | None = "rotated-token-value-0001"

    def __init__(self, refresh_token, on_token_rotated=None):
        if self.raise_on_init:
            raise self.raise_on_init
        self._token = refresh_token
        if self.rotate_to:  # как настоящий итд: при обновлении access-токена выдаётся новый refresh
            self._token = self.rotate_to
            if on_token_rotated:
                on_token_rotated(self.rotate_to)

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()

    @property
    def refresh_token(self):
        return self._token

    def close(self):
        pass

    def me(self):
        return self.profile

    def all_posts(self, username, limit=None):
        return list(self.posts)

    def notifications(self, known_ids=(), max_items=5000):
        known = set(known_ids)
        return [n for n in self.notifications_data if n.id not in known][:max_items]

    def followers(self, user_id, expected_total):
        return self.followers_result


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield


@pytest.fixture
def db():
    with SessionLocal() as session:
        yield session


@pytest.fixture
def client():
    app.dependency_overrides[get_gateway_factory] = lambda: FakeGateway
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def logged_in(client):
    resp = client.post("/api/auth/login", json={"refresh_token": TEST_REFRESH_TOKEN})
    assert resp.status_code == 200, resp.text
    return client
