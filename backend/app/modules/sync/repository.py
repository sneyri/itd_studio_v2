"""Доступ к очереди задач синхронизации (sync_jobs)."""

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.timeutils import utcnow
from app.db.models import SyncJob

ACTIVE = ("queued", "running")


class SyncJobsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_for_user(self, job_id: int, user_id: int) -> SyncJob | None:
        return self.db.scalar(select(SyncJob).where(SyncJob.id == job_id, SyncJob.user_id == user_id))

    def latest_for_user(self, user_id: int) -> SyncJob | None:
        return self.db.scalar(
            select(SyncJob).where(SyncJob.user_id == user_id).order_by(SyncJob.created_at.desc(), SyncJob.id.desc())
        )

    def active_for_user(self, user_id: int) -> SyncJob | None:
        return self.db.scalar(select(SyncJob).where(SyncJob.user_id == user_id, SyncJob.status.in_(ACTIVE)))

    def last_done_for_user(self, user_id: int) -> SyncJob | None:
        return self.db.scalar(
            select(SyncJob)
            .where(SyncJob.user_id == user_id, SyncJob.status == "done")
            .order_by(SyncJob.finished_at.desc())
        )

    def create(self, user_id: int) -> SyncJob:
        job = SyncJob(user_id=user_id, status="queued", created_at=utcnow())
        self.db.add(job)
        self.db.flush()
        return job

    def claim_next(self) -> SyncJob | None:
        """Атомарно забирает самую старую задачу из очереди (защита от двух воркеров)."""
        job = self.db.scalar(select(SyncJob).where(SyncJob.status == "queued").order_by(SyncJob.created_at))
        if job is None:
            return None
        claimed = self.db.execute(
            update(SyncJob)
            .where(SyncJob.id == job.id, SyncJob.status == "queued")
            .values(status="running", started_at=utcnow())
        ).rowcount
        self.db.commit()
        if not claimed:
            return None
        self.db.refresh(job)
        return job

    def fail_stale_running(self) -> int:
        """При старте воркера: задачи, оставшиеся «running» после падения процесса, помечаем failed."""
        count = self.db.execute(
            update(SyncJob)
            .where(SyncJob.status == "running")
            .values(status="failed", finished_at=utcnow(), error="Воркер был перезапущен во время синхронизации")
        ).rowcount
        self.db.commit()
        return count
