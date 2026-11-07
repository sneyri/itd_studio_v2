"""Фоновый sync-воркер: отдельный процесс, который забирает задачи из sync_jobs и выполняет их.

Запуск (из папки backend/):  python -m app.modules.sync.worker
Для разработки можно запускать внутри API: RUN_WORKER_IN_PROCESS=true.
"""

import logging
import threading

from app.core.config import get_settings
from app.core.logging import setup_logging
from app.core.security import get_cipher
from app.db.session import SessionLocal
from app.modules.sync.repository import SyncJobsRepository
from app.modules.sync.service import SyncRunner

logger = logging.getLogger(__name__)


def run_once(runner: SyncRunner) -> bool:
    """Выполняет одну задачу из очереди. Возвращает True, если задача была."""
    with SessionLocal() as db:
        job = SyncJobsRepository(db).claim_next()
    if job is None:
        return False
    logger.info("Взята задача синхронизации job=%s user_id=%s", job.id, job.user_id)
    runner.run(job.id)
    return True


def run_forever(stop: threading.Event | None = None) -> None:
    stop = stop or threading.Event()
    settings = get_settings()
    runner = SyncRunner(SessionLocal, get_cipher())
    with SessionLocal() as db:
        stale = SyncJobsRepository(db).fail_stale_running()
    if stale:
        logger.warning("Помечено как failed зависших задач: %s", stale)
    logger.info("Sync-воркер запущен, опрос каждые %s с", settings.worker_poll_interval)
    while not stop.is_set():
        try:
            if run_once(runner):
                continue
        except Exception:
            logger.exception("Ошибка цикла воркера")
        stop.wait(settings.worker_poll_interval)


def start_in_thread() -> threading.Event:
    stop = threading.Event()
    threading.Thread(target=run_forever, args=(stop,), name="sync-worker", daemon=True).start()
    return stop


if __name__ == "__main__":
    setup_logging(get_settings().log_level)
    try:
        run_forever()
    except KeyboardInterrupt:
        logger.info("Sync-воркер остановлен")
