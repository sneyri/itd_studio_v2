"""Вход и выход: проверка refresh_token через итд, шифрованное хранение, выдача сессии.

Токен проверяется вызовом users.me(). Итд может сразу ротировать токен — сохраняем
актуальный (gateway.refresh_token), а не тот, что прислал пользователь.
"""

import logging
from collections.abc import Callable
from datetime import timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import ExternalServiceError, InvalidTokenError
from app.core.security import TokenCipher, hash_session_token, new_session_token
from app.core.timeutils import utcnow
from app.db.models import AuthSession, User
from app.integrations.itd.client import ItdAuthError, ItdGateway, ItdProfile, ItdUnavailableError
from app.modules.users.repository import UsersRepository

logger = logging.getLogger(__name__)

GatewayFactory = Callable[..., ItdGateway]


def apply_profile(user: User, profile: ItdProfile) -> None:
    user.username = profile.username
    user.itd_user_id = profile.id
    user.display_name = profile.display_name
    user.avatar = profile.avatar
    user.bio = profile.bio
    user.followers_count = profile.followers_count
    user.following_count = profile.following_count
    user.posts_count = profile.posts_count
    user.registered_at = profile.registered_at
    user.updated_at = utcnow()


class AuthService:
    def __init__(self, db: Session, cipher: TokenCipher, gateway_factory: GatewayFactory = ItdGateway):
        self.db = db
        self.cipher = cipher
        self.gateway_factory = gateway_factory
        self.users = UsersRepository(db)

    def login(self, refresh_token: str) -> tuple[User, str]:
        """Возвращает пользователя и сырой токен сессии (его кладут в cookie)."""
        try:
            with self.gateway_factory(refresh_token) as gateway:
                profile = gateway.me()
                current_token = gateway.refresh_token
        except ItdAuthError:
            raise InvalidTokenError() from None
        except ItdUnavailableError:
            raise ExternalServiceError() from None

        # Ищем сначала по id в итд, затем по username (пользователь из старой БД без itd_user_id).
        user = self.users.by_itd_id(profile.id) or self.users.by_username(profile.username)
        if user is None:
            user = self.users.add(User(username=profile.username, timezone=get_settings().timezone))
        apply_profile(user, profile)
        user.encrypted_refresh_token = self.cipher.encrypt(current_token)

        raw = new_session_token()
        now = utcnow()
        self.db.add(
            AuthSession(
                user_id=user.id,
                token_hash=hash_session_token(raw),
                created_at=now,
                expires_at=now + timedelta(days=get_settings().session_ttl_days),
            )
        )
        self.db.commit()
        logger.info("Вход выполнен: user_id=%s", user.id)
        return user, raw

    def logout(self, user: User) -> None:
        # Выход = отзыв доступа к итд: удаляем сохранённый refresh_token и все сессии пользователя.
        self.db.execute(delete(AuthSession).where(AuthSession.user_id == user.id))
        user.encrypted_refresh_token = None
        self.db.commit()
        logger.info("Выход: user_id=%s", user.id)
