"""Сборка FastAPI-приложения: настройки, логи, CORS, обработчики ошибок, роутеры модулей.

Запуск (из папки backend/):  uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import setup_logging
from app.core.security import get_cipher
from app.modules.analytics.router import router as analytics_router
from app.modules.auth.router import router as auth_router
from app.modules.comments.router import router as comments_router
from app.modules.posts.router import router as posts_router
from app.modules.sync.router import router as sync_router
from app.modules.users.router import router as settings_router


class StatusOut(BaseModel):
    status: str
    version: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    get_cipher()  # падаем сразу, если TOKEN_ENCRYPTION_KEY не задан
    stop = None
    if settings.run_worker_in_process:
        from app.modules.sync.worker import start_in_thread

        stop = start_in_thread()
    yield
    if stop is not None:
        stop.set()


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(settings.log_level)

    app = FastAPI(title="ITD-Studio API", version=settings.app_version, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT"],
        allow_headers=["Content-Type"],
    )
    register_exception_handlers(app)

    api = APIRouter(prefix=settings.api_prefix)

    @api.get("/status", response_model=StatusOut, tags=["service"], summary="Проверка доступности")
    def status():
        return StatusOut(status="ok", version=settings.app_version)

    for router in (auth_router, sync_router, posts_router, analytics_router, comments_router, settings_router):
        api.include_router(router)
    app.include_router(api)
    return app


app = create_app()
