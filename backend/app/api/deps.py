"""Общие зависимости FastAPI: сессия БД и текущий пользователь (по cookie сессии)."""

from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import UnauthorizedError
from app.core.security import hash_session_token
from app.core.timeutils import utcnow
from app.db.models import AuthSession, User
from app.db.session import get_session

DbSession = Annotated[Session, Depends(get_session)]


def get_current_user(request: Request, db: DbSession) -> User:
    token = request.cookies.get(get_settings().session_cookie_name)
    if not token:
        raise UnauthorizedError()
    session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_session_token(token)))
    if session is None or session.expires_at <= utcnow():
        raise UnauthorizedError("Сессия истекла, войдите снова")
    user = db.get(User, session.user_id)
    if user is None:
        raise UnauthorizedError()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_gateway_factory():
    """Фабрика шлюза итд. В тестах подменяется через app.dependency_overrides."""
    from app.integrations.itd.client import ItdGateway

    return ItdGateway
