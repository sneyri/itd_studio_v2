"""Безопасность: шифрование refresh_token (Fernet) и непрозрачные токены сессий.

Сессия — случайная строка в httpOnly cookie; в БД хранится только её SHA-256,
поэтому утечка базы не даёт войти под пользователем.
"""

import hashlib
import secrets

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings


class TokenCipher:
    def __init__(self, key: str):
        if not key:
            raise RuntimeError(
                "TOKEN_ENCRYPTION_KEY не задан. Сгенерируйте ключ: "
                "python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\" "
                "и пропишите его в backend/.env"
            )
        self._fernet = Fernet(key.encode())

    def encrypt(self, value: str) -> str:
        return self._fernet.encrypt(value.encode()).decode()

    def decrypt(self, value: str) -> str | None:
        try:
            return self._fernet.decrypt(value.encode()).decode()
        except InvalidToken:
            return None


def get_cipher() -> TokenCipher:
    return TokenCipher(get_settings().token_encryption_key)


def new_session_token() -> str:
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
