"""Окружение Alembic: берёт URL базы из настроек приложения и метаданные из app.db.models."""

from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import get_settings
from app.db.models import Base

config = context.config
target_metadata = Base.metadata


def _db_url() -> str:
    # Тесты и скрипты могут передать URL явно: config.attributes["db_url"].
    return config.attributes.get("db_url") or get_settings().db_url


def run_migrations_offline() -> None:
    context.configure(
        url=_db_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # Отдельный engine без PRAGMA foreign_keys=ON: при перестройке таблиц SQLite
    # проверки внешних ключей мешают переименованию/удалению старых таблиц.
    engine = create_engine(_db_url(), poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, render_as_batch=True)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
