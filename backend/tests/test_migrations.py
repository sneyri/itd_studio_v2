"""Миграции: старая data.db (схема v1) переносится в v2 без потери данных; пустая база тоже поднимается."""

import sqlite3

from alembic import command
from alembic.config import Config

from app.core.config import BACKEND_DIR


def upgrade(db_path):
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.attributes["db_url"] = f"sqlite:///{db_path.as_posix()}"
    command.upgrade(cfg, "head")


def make_legacy_db(path):
    conn = sqlite3.connect(path)
    conn.executescript(
        """
        CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(255) UNIQUE NOT NULL,
            displayName VARCHAR(255), avatar VARCHAR(255), bio VARCHAR(255), followers_count INTEGER DEFAULT 0,
            following_count INTEGER DEFAULT 0, posts_count INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE posts (id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), username VARCHAR(255) NOT NULL,
            content TEXT, created_at TIMESTAMP, updated_at TIMESTAMP, likes_count INTEGER DEFAULT 0,
            reposts_count INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0, views_count INTEGER DEFAULT 0,
            is_repost BOOLEAN DEFAULT 0, repost_original_id VARCHAR(255),
            FOREIGN KEY (username) REFERENCES users(username));
        CREATE INDEX idx_posts_username ON posts(username);
        INSERT INTO users (username, displayName, avatar, followers_count, following_count, posts_count, updated_at)
            VALUES ('old', 'Old User', '🫎', 549, 53, 2, '2026-11-07 19:25:34');
        INSERT INTO posts (id, username, content, created_at, likes_count, views_count)
            VALUES ('p1', 'old', NULL, '2026-11-07T19:10:09.607Z', 10, 48),
                   ('p2', 'old', 'text', '2026-11-06T10:00:00Z', 1, 5);
        """
    )
    conn.commit()
    conn.close()


def test_legacy_db_upgrade_keeps_data(tmp_path):
    path = tmp_path / "legacy.db"
    make_legacy_db(path)
    upgrade(path)

    conn = sqlite3.connect(path)
    user = conn.execute("SELECT id, username, display_name, followers_count, updated_at, timezone FROM users").fetchone()
    assert user == (1, "old", "Old User", 549, "2026-11-07T19:25:34.000Z", "Europe/Moscow")
    posts = conn.execute("SELECT id, user_id, content, created_at, views_count FROM posts ORDER BY id").fetchall()
    assert posts == [
        ("p1", 1, None, "2026-11-07T19:10:09.607Z", 48),
        ("p2", 1, "text", "2026-11-06T10:00:00.000Z", 5),
    ]
    assert conn.execute("SELECT followers_count FROM account_snapshots").fetchall() == [(549,)]
    assert conn.execute("SELECT COUNT(*) FROM post_metrics_snapshots").fetchone() == (2,)
    tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    assert {"follow_events", "notification_events", "sync_jobs", "auth_sessions"} <= tables
    assert "users_legacy" not in tables


def test_empty_db_upgrade(tmp_path):
    path = tmp_path / "fresh.db"
    upgrade(path)
    conn = sqlite3.connect(path)
    assert conn.execute("SELECT COUNT(*) FROM users").fetchone() == (0,)
