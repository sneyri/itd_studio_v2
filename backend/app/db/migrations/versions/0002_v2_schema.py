"""Схема v2: перестройка users/posts без потери данных + новые таблицы.

Что делает:
1. Переименовывает старые users/posts в *_legacy.
2. Создаёт новые users/posts (FK posts.user_id → users.id, время в ISO-8601 UTC).
3. Переносит данные: users.displayName → display_name, posts.username → posts.user_id,
   все даты нормализуются в `YYYY-MM-DDTHH:MM:SS.mmmZ`.
4. Создаёт auth_sessions, account_snapshots, post_metrics_snapshots,
   notification_events, follow_events, sync_jobs.
5. Засевает по одному снимку аккаунта и метрик постов из уже сохранённых данных —
   это реальные значения на момент последней синхронизации старой версии (users.updated_at).
6. Удаляет *_legacy.

Revision ID: 0002_v2_schema
Revises: 0001_legacy_baseline
Create Date: 2026-11-07
"""

from datetime import datetime, timezone

import sqlalchemy as sa
from alembic import op

revision = "0002_v2_schema"
down_revision = "0001_legacy_baseline"
branch_labels = None
depends_on = None

TS = sa.String(32)


def _norm(value) -> str | None:
    """Любая строка даты → ISO-8601 UTC с миллисекундами и Z (наивное время считаем UTC)."""
    if value is None or value == "":
        return None
    try:
        dt = datetime.fromisoformat(str(value).strip().replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond // 1000:03d}Z"


def upgrade() -> None:
    conn = op.get_bind()

    op.execute("DROP INDEX IF EXISTS idx_posts_username")
    op.execute("DROP INDEX IF EXISTS idx_posts_created_at")
    op.rename_table("posts", "posts_legacy")
    op.rename_table("users", "users_legacy")

    users = op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("username", sa.String(255), nullable=False, unique=True),
        sa.Column("itd_user_id", sa.String(64), unique=True),
        sa.Column("display_name", sa.String(255)),
        sa.Column("avatar", sa.Text),
        sa.Column("bio", sa.Text),
        sa.Column("followers_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("following_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("posts_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("registered_at", TS),
        sa.Column("timezone", sa.String(64), nullable=False, server_default="Europe/Moscow"),
        sa.Column("encrypted_refresh_token", sa.Text),
        sa.Column("updated_at", TS),
        sa.Column("last_synced_at", TS),
    )
    posts = op.create_table(
        "posts",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text),
        sa.Column("created_at", TS),
        sa.Column("edited_at", TS),
        sa.Column("likes_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("comments_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("reposts_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("views_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_repost", sa.Boolean, nullable=False, server_default="0"),
        sa.Column("repost_original_id", sa.String(64)),
        sa.Column("last_seen_at", TS),
    )
    op.create_index("ix_posts_user_created", "posts", ["user_id", "created_at"])

    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("created_at", TS, nullable=False),
        sa.Column("expires_at", TS, nullable=False),
    )
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])

    account_snapshots = op.create_table(
        "account_snapshots",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("captured_at", TS, nullable=False),
        sa.Column("followers_count", sa.Integer, nullable=False),
        sa.Column("following_count", sa.Integer, nullable=False),
        sa.Column("posts_count", sa.Integer, nullable=False),
    )
    op.create_index("ix_account_snapshots_user_time", "account_snapshots", ["user_id", "captured_at"])

    post_snapshots = op.create_table(
        "post_metrics_snapshots",
        sa.Column("post_id", sa.String(64), sa.ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("captured_at", TS, primary_key=True),
        sa.Column("views", sa.Integer, nullable=False),
        sa.Column("likes", sa.Integer, nullable=False),
        sa.Column("comments", sa.Integer, nullable=False),
        sa.Column("reposts", sa.Integer, nullable=False),
    )

    op.create_table(
        "notification_events",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(32), nullable=False),
        sa.Column("actor_id", sa.String(64)),
        sa.Column("actor_username", sa.String(255)),
        sa.Column("actor_display_name", sa.String(255)),
        sa.Column("actor_avatar", sa.Text),
        sa.Column("target_id", sa.String(64)),
        sa.Column("preview", sa.Text),
        sa.Column("created_at", TS, nullable=False),
    )
    op.create_index(
        "ix_notification_events_user_type_time", "notification_events", ["user_id", "type", "created_at"]
    )

    op.create_table(
        "follow_events",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("follower_id", sa.String(64), nullable=False),
        sa.Column("follower_username", sa.String(255)),
        sa.Column("follower_display_name", sa.String(255)),
        sa.Column("follower_avatar", sa.Text),
        sa.Column("followed_at", TS, nullable=False),
        sa.Column("source", sa.String(32), nullable=False, server_default="notification"),
        sa.Column("is_current_follower", sa.Boolean),
        sa.UniqueConstraint("user_id", "follower_id", "followed_at", name="uq_follow_events_dedup"),
    )
    op.create_index("ix_follow_events_user_time", "follow_events", ["user_id", "followed_at"])

    op.create_table(
        "sync_jobs",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="queued"),
        sa.Column("created_at", TS, nullable=False),
        sa.Column("started_at", TS),
        sa.Column("finished_at", TS),
        sa.Column("posts_synced", sa.Integer),
        sa.Column("new_follow_events", sa.Integer),
        sa.Column("error", sa.Text),
    )
    op.create_index("ix_sync_jobs_user_id", "sync_jobs", ["user_id"])
    op.create_index("ix_sync_jobs_status", "sync_jobs", ["status", "created_at"])

    # --- перенос данных -------------------------------------------------------------
    legacy_users = conn.execute(sa.text("SELECT * FROM users_legacy")).mappings().all()
    user_rows, account_rows, user_by_name, synced_at_by_id = [], [], {}, {}
    for row in legacy_users:
        updated_at = _norm(row["updated_at"])
        user_rows.append(
            {
                "id": row["id"],
                "username": row["username"],
                "display_name": row["displayName"],
                "avatar": row["avatar"],
                "bio": row["bio"],
                "followers_count": row["followers_count"] or 0,
                "following_count": row["following_count"] or 0,
                "posts_count": row["posts_count"] or 0,
                "timezone": "Europe/Moscow",
                "updated_at": updated_at,
                "last_synced_at": updated_at,
            }
        )
        user_by_name[row["username"]] = row["id"]
        synced_at_by_id[row["id"]] = updated_at
        if updated_at:
            account_rows.append(
                {
                    "user_id": row["id"],
                    "captured_at": updated_at,
                    "followers_count": row["followers_count"] or 0,
                    "following_count": row["following_count"] or 0,
                    "posts_count": row["posts_count"] or 0,
                }
            )
    if user_rows:
        op.bulk_insert(users, user_rows)
    if account_rows:
        op.bulk_insert(account_snapshots, account_rows)

    legacy_posts = conn.execute(sa.text("SELECT * FROM posts_legacy")).mappings().all()
    post_rows, snapshot_rows = [], []
    for row in legacy_posts:
        user_id = user_by_name.get(row["username"])
        if user_id is None:
            continue  # пост без владельца в users — в старой схеме такого быть не должно
        post_rows.append(
            {
                "id": row["id"],
                "user_id": user_id,
                "content": row["content"],
                "created_at": _norm(row["created_at"]),
                "edited_at": _norm(row["updated_at"]),
                "likes_count": row["likes_count"] or 0,
                "comments_count": row["comments_count"] or 0,
                "reposts_count": row["reposts_count"] or 0,
                "views_count": row["views_count"] or 0,
                "is_repost": bool(row["is_repost"]),
                "repost_original_id": row["repost_original_id"],
                "last_seen_at": synced_at_by_id.get(user_id),
            }
        )
        captured_at = synced_at_by_id.get(user_id)
        if captured_at:
            snapshot_rows.append(
                {
                    "post_id": row["id"],
                    "captured_at": captured_at,
                    "views": row["views_count"] or 0,
                    "likes": row["likes_count"] or 0,
                    "comments": row["comments_count"] or 0,
                    "reposts": row["reposts_count"] or 0,
                }
            )
    if post_rows:
        op.bulk_insert(posts, post_rows)
    if snapshot_rows:
        op.bulk_insert(post_snapshots, snapshot_rows)

    op.drop_table("posts_legacy")
    op.drop_table("users_legacy")


def downgrade() -> None:
    raise NotImplementedError(
        "Откат схемы v2 не поддерживается: восстановите резервную копию data.db (см. README)."
    )
