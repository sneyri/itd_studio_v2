"""Базовая схема старой версии (users, posts) — как её создавал src/database/database.py.

Если таблицы уже есть (существующая data.db), миграция ничего не меняет. Для новой
пустой базы создаёт ту же старую схему, чтобы дальше обе базы шли одним путём (0002).

Revision ID: 0001_legacy_baseline
Revises:
Create Date: 2026-11-07
"""

from alembic import op

revision = "0001_legacy_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(255) UNIQUE NOT NULL,
            displayName VARCHAR(255),
            avatar VARCHAR(255),
            bio VARCHAR(255),
            followers_count INTEGER DEFAULT 0,
            following_count INTEGER DEFAULT 0,
            posts_count INTEGER DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS posts (
            id VARCHAR(255) PRIMARY KEY,
            user_id VARCHAR(255),
            username VARCHAR(255) NOT NULL,
            content TEXT,
            created_at TIMESTAMP,
            updated_at TIMESTAMP,
            likes_count INTEGER DEFAULT 0,
            reposts_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            views_count INTEGER DEFAULT 0,
            is_repost BOOLEAN DEFAULT 0,
            repost_original_id VARCHAR(255),
            FOREIGN KEY (username) REFERENCES users(username)
        )
        """
    )


def downgrade() -> None:
    # Базовая схема содержит пользовательские данные — не удаляем её откатом.
    pass
