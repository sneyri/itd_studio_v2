"""Настройки приложения: читаются из переменных окружения и backend/.env (pydantic-settings).

Все пути вычисляются от папки backend/, поэтому приложение не зависит от текущей директории.
"""

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = BACKEND_DIR / "data" / "data.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_version: str = "2.0.0"
    api_prefix: str = "/api"

    # База данных. По умолчанию — абсолютный путь к backend/data/data.db.
    db_url: str = Field(default=f"sqlite:///{DEFAULT_DB_PATH.as_posix()}")

    # CORS нужен, только если фронт ходит на API с другого origin (в dev работает vite proxy).
    # В .env задаётся через запятую: CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Часовой пояс по умолчанию для новых пользователей (для «лучшего времени», группировки по дням).
    timezone: str = "Europe/Moscow"

    # Минимальный интервал между успешными синхронизациями одного пользователя, секунды.
    sync_cooldown: int = 600
    # Как часто воркер проверяет очередь, секунды.
    worker_poll_interval: float = 2.0
    # Запускать воркер внутри процесса API (удобно для разработки; в проде — отдельный процесс).
    run_worker_in_process: bool = False
    # Сколько максимум уведомлений читать за одну синхронизацию (защита от бесконечной пагинации).
    notifications_sync_limit: int = 5000

    # Ключ Fernet для шифрования refresh_token (Fernet.generate_key()).
    token_encryption_key: str = ""

    # Сессии
    session_cookie_name: str = "itd_session"
    session_ttl_days: int = 14
    cookie_secure: bool = False

    # Шаблон ссылки на пост на сайте итд (формат URL сайта не документирован — при смене поправьте тут).
    itd_post_url_template: str = "https://xn--d1ah4a.com/@{username}/post/{post_id}"

    log_level: str = "INFO"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value):
        if isinstance(value, str) and not value.strip().startswith("["):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
