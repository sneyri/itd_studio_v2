"""Pydantic-схемы задач синхронизации."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.db.models import SyncJob

SyncStatus = Literal["queued", "running", "done", "failed"]


class SyncJobOut(BaseModel):
    id: int
    status: SyncStatus
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None
    posts_synced: int | None
    new_follow_events: int | None
    error: str | None


def to_job_out(job: SyncJob) -> SyncJobOut:
    return SyncJobOut(
        id=job.id,
        status=job.status,
        created_at=job.created_at,
        started_at=job.started_at,
        finished_at=job.finished_at,
        posts_synced=job.posts_synced,
        new_follow_events=job.new_follow_events,
        error=job.error,
    )
