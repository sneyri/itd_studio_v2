"""Вложения постов и расширенные уведомления.

- posts.attachments (JSON-текст; NULL — пост ещё не синхронизировался после этой миграции);
- notification_events: actor_is_verified, is_read, target_type;
- itd_users — справочник пользователей итд со статусом верификации.

Revision ID: 0003_media_notifications
Revises: 0002_v2_schema
Create Date: 2026-11-09
"""

import sqlalchemy as sa
from alembic import op

revision = "0003_media_notifications"
down_revision = "0002_v2_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("posts") as batch:
        batch.add_column(sa.Column("attachments", sa.Text))
    with op.batch_alter_table("notification_events") as batch:
        batch.add_column(sa.Column("actor_is_verified", sa.Boolean))
        batch.add_column(sa.Column("is_read", sa.Boolean))
        batch.add_column(sa.Column("target_type", sa.String(32)))
    op.create_table(
        "itd_users",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("username", sa.String(255)),
        sa.Column("display_name", sa.String(255)),
        sa.Column("avatar", sa.Text),
        sa.Column("is_verified", sa.Boolean),
        sa.Column("updated_at", sa.String(32)),
    )
    op.create_index("ix_itd_users_username", "itd_users", ["username"])


def downgrade() -> None:
    op.drop_index("ix_itd_users_username", "itd_users")
    op.drop_table("itd_users")
    with op.batch_alter_table("notification_events") as batch:
        batch.drop_column("target_type")
        batch.drop_column("is_read")
        batch.drop_column("actor_is_verified")
    with op.batch_alter_table("posts") as batch:
        batch.drop_column("attachments")
