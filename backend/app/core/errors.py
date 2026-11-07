"""Единые исключения приложения и их обработчики.

Клиент получает только общий текст и код ошибки, подробности (stack trace) уходят в лог.
Формат ответа: {"error": {"code": "...", "message": "...", "retry_after": 123?}}.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    status_code = 500
    code = "internal_error"
    message = "Внутренняя ошибка сервера"

    def __init__(self, message: str | None = None, **extra):
        super().__init__(message or self.message)
        self.message = message or self.message
        self.extra = extra


class UnauthorizedError(AppError):
    status_code = 401
    code = "unauthorized"
    message = "Требуется вход"


class InvalidTokenError(AppError):
    status_code = 401
    code = "invalid_token"
    message = "Токен недействителен или истёк. Получите новый refresh_token."


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"
    message = "Не найдено"


class ValidationAppError(AppError):
    status_code = 422
    code = "validation_error"
    message = "Некорректные параметры запроса"


class SyncCooldownError(AppError):
    status_code = 429
    code = "sync_cooldown"
    message = "Синхронизация пока недоступна"


class ExternalServiceError(AppError):
    status_code = 502
    code = "itd_unavailable"
    message = "Сервис итд недоступен, попробуйте позже"


def _payload(code: str, message: str, **extra) -> dict:
    return {"error": {"code": code, "message": message, **extra}}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(request: Request, exc: AppError):
        headers = {}
        if "retry_after" in exc.extra:
            headers["Retry-After"] = str(exc.extra["retry_after"])
        return JSONResponse(
            status_code=exc.status_code,
            content=_payload(exc.code, exc.message, **exc.extra),
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_error(request: Request, exc: RequestValidationError):
        fields = [".".join(str(p) for p in err.get("loc", ())[1:]) for err in exc.errors()]
        return JSONResponse(
            status_code=422,
            content=_payload("validation_error", "Некорректные параметры запроса", fields=fields),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(request: Request, exc: StarletteHTTPException):
        code = {401: "unauthorized", 404: "not_found", 405: "method_not_allowed"}.get(exc.status_code, "http_error")
        message = exc.detail if isinstance(exc.detail, str) else "Ошибка запроса"
        return JSONResponse(status_code=exc.status_code, content=_payload(code, message))

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception):
        logger.exception("Необработанная ошибка: %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content=_payload("internal_error", "Внутренняя ошибка сервера"))
