"""Маппинг моделей itdpy в наши DTO, перевод ошибок и вычистка токенов из логов."""

import logging

from itdpy import exceptions as itd_exc
from itdpy.models import Notification, Post, User

from app.core.logging import RedactSecretsFilter, redact
from app.integrations.itd.client import ItdAuthError, ItdUnavailableError, _to_notification, _to_post, _to_profile, _translate


def test_post_mapping_marks_reposts_and_parses_dates():
    post = Post.model_validate(
        {
            "id": "p1",
            "content": None,
            "createdAt": "2026-11-07T19:10:09.607Z",
            "likesCount": 3,
            "viewsCount": 10,
            "originalPost": {"id": "orig", "createdAt": "2026-11-01T00:00:00Z"},
        }
    )
    dto = _to_post(post)
    assert dto.is_repost is True and dto.repost_original_id == "orig"
    assert dto.created_at.isoformat() == "2026-11-07T19:10:09.607000+00:00"
    assert dto.views_count == 10 and dto.comments_count == 0


def test_profile_mapping():
    user = User.model_validate(
        {"id": "u1", "username": "me", "displayName": "Me", "followersCount": 5, "createdAt": "2025-01-01T00:00:00Z"}
    )
    dto = _to_profile(user)
    assert (dto.id, dto.followers_count, dto.registered_at.year) == ("u1", 5, 2025)


def test_notification_mapping():
    n = Notification.model_validate(
        {
            "id": "n1",
            "type": "follow",
            "createdAt": "2026-11-07T10:00:00Z",
            "actor": {"id": "a1", "displayName": "Fan", "username": "fan"},
        }
    )
    dto = _to_notification(n)
    assert (dto.type, dto.actor_id, dto.actor_username) == ("follow", "a1", "fan")


def test_error_translation():
    assert isinstance(_translate(itd_exc.SessionExpiredError("x")), ItdAuthError)
    assert isinstance(_translate(itd_exc.NetworkError("x")), ItdUnavailableError)
    assert isinstance(_translate(itd_exc.RateLimitError("x")), ItdUnavailableError)


def test_redact_hides_tokens():
    jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl"
    assert jwt not in redact(f"token {jwt}")
    assert "secret123" not in redact("POST /api/sync?refresh_token=secret123 HTTP/1.1")
    assert "secret123" not in redact('{"refresh_token": "secret123"}')

    record = logging.LogRecord("x", logging.INFO, __file__, 1, "auth with %s", (jwt,), None)
    RedactSecretsFilter().filter(record)
    assert jwt not in record.getMessage()
