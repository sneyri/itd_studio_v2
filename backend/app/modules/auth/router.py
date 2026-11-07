"""HTTP-эндпоинты входа (/api/auth). refresh_token принимается ТОЛЬКО в JSON-теле."""

from fastapi import APIRouter, Depends, Response, status

from app.api.deps import CurrentUser, DbSession, get_gateway_factory
from app.core.config import get_settings
from app.core.security import get_cipher
from app.modules.auth.schemas import LoginRequest
from app.modules.auth.service import AuthService
from app.modules.users.schemas import Profile, to_profile

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Profile, summary="Вход по refresh_token (в теле запроса)")
def login(payload: LoginRequest, response: Response, db: DbSession, gateway_factory=Depends(get_gateway_factory)):
    settings = get_settings()
    user, raw_session = AuthService(db, get_cipher(), gateway_factory).login(payload.refresh_token)
    response.set_cookie(
        key=settings.session_cookie_name,
        value=raw_session,
        max_age=settings.session_ttl_days * 24 * 3600,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/api",
    )
    return to_profile(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Выход: удаляет сессии и сохранённый токен")
def logout(user: CurrentUser, db: DbSession):
    settings = get_settings()
    AuthService(db, get_cipher()).logout(user)
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(settings.session_cookie_name, path="/api")
    return response


@router.get("/me", response_model=Profile, summary="Профиль текущего пользователя")
def me(user: CurrentUser):
    return to_profile(user)
