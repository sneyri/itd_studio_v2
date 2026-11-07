"""Подключение к БД: engine и фабрика сессий SQLAlchemy 2.0.

Для SQLite включаем WAL и busy_timeout — API и sync-воркер работают в разных процессах
и пишут в один файл.
"""

from collections.abc import Iterator
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def build_engine(db_url: str) -> Engine:
    url = make_url(db_url)
    connect_args = {}
    if url.get_backend_name() == "sqlite":
        connect_args = {"check_same_thread": False, "timeout": 30}
        if url.database and url.database != ":memory:":
            Path(url.database).parent.mkdir(parents=True, exist_ok=True)

    engine = create_engine(db_url, connect_args=connect_args)

    if url.get_backend_name() == "sqlite":
        @event.listens_for(engine, "connect")
        def _sqlite_pragmas(dbapi_conn, _record):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA busy_timeout=30000")
            if url.database and url.database != ":memory:":
                cursor.execute("PRAGMA journal_mode=WAL")
            cursor.close()

    return engine


engine = build_engine(get_settings().db_url)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_session() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
