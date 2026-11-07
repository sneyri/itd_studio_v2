"""Общие помощники аналитики: безопасное чтение числовых полей (NULL → 0) и взаимодействия."""

from typing import Protocol
from datetime import datetime


class PostMetrics(Protocol):
    created_at: datetime | None
    views_count: int | None
    likes_count: int | None
    comments_count: int | None
    reposts_count: int | None


def num(value) -> int:
    """NULL/None/мусор → 0."""
    try:
        return int(value or 0)
    except (TypeError, ValueError):
        return 0


def interactions(post: PostMetrics) -> int:
    return num(post.likes_count) + num(post.comments_count) + num(post.reposts_count)
