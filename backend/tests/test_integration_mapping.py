"""Маппинг моделей itdpy в наши DTO, перевод ошибок и вычистка токенов из логов."""

import logging

from itdpy import exceptions as itd_exc
from itdpy.models import Post, User

from app.core.logging import RedactSecretsFilter, redact
from app.integrations.itd.client import ItdAuthError, ItdUnavailableError, _raw_notification, _to_post, attachment_kind, _to_profile, _translate


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


def test_raw_notification_mapping_keeps_verified_flag():
    dto = _raw_notification(
        {
            "id": "n1",
            "type": "follow",
            "createdAt": "2026-11-07T10:00:00Z",
            "readAt": None,
            "targetType": "post",
            "actor": {"id": "a1", "displayName": "Fan", "username": "fan", "isVerified": True},
        }
    )
    assert (dto.type, dto.actor_id, dto.actor_username, dto.actor_is_verified) == ("follow", "a1", "fan", True)
    assert dto.is_read is False and dto.target_type == "post"
    unknown = _raw_notification({"id": "n2", "type": "like", "createdAt": "2026-11-07T10:00:00Z", "actor": {}})
    assert unknown.actor_is_verified is None and unknown.is_read is None and unknown.actor_id is None
    assert _raw_notification({"id": "n3", "type": "like"}) is None


def test_post_attachments_and_kinds():
    post = Post.model_validate(
        {
            "id": "p1",
            "createdAt": "2026-11-07T19:10:09.607Z",
            "attachments": [
                {"id": "a", "url": "https://x/1.jpg", "type": "image/jpeg", "width": 10, "height": 20},
                {"id": "b", "url": "https://x/2", "type": "video"},
            ],
        }
    )
    kinds = [a.kind for a in _to_post(post).attachments]
    assert kinds == ["image", "video"]
    assert attachment_kind(None, "https://x/a.webm?x=1") == "video"
    assert attachment_kind("audio/mpeg") == "audio"
    assert attachment_kind(None, "https://x/doc.pdf") == "file"
    assert attachment_kind("gif") == "image"


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
