"""HTTP-эндпоинты синхронизации (/api/sync): поставить задачу и узнать её статус.
Сама синхронизация выполняется воркером (worker.py), а не в запросе."""

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.core.errors import NotFoundError
from app.modules.sync.repository import SyncJobsRepository
from app.modules.sync.schemas import SyncJobOut, to_job_out
from app.modules.sync.service import enqueue_sync

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("", response_model=SyncJobOut, status_code=status.HTTP_202_ACCEPTED, summary="Запустить синхронизацию")
def start_sync(user: CurrentUser, db: DbSession):
    return to_job_out(enqueue_sync(db, user))


@router.get("/latest", response_model=SyncJobOut | None, summary="Последняя задача синхронизации")
def latest_job(user: CurrentUser, db: DbSession):
    job = SyncJobsRepository(db).latest_for_user(user.id)
    return to_job_out(job) if job else None


@router.get("/{job_id}", response_model=SyncJobOut, summary="Статус задачи синхронизации")
def get_job(job_id: int, user: CurrentUser, db: DbSession):
    job = SyncJobsRepository(db).get_for_user(job_id, user.id)
    if job is None:
        raise NotFoundError("Задача не найдена")
    return to_job_out(job)
