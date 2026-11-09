"""ORM-модели (SQLAlchemy 2.0). Схема меняется только через Alembic-миграции (app/db/migrations).

Таблицы:
- users                   — профиль итд + зашифрованный refresh_token + часовой пояс;
- auth_sessions           — сессии нашего приложения (в БД только хэш токена);
- posts                   — посты с последними известными метриками;
- account_snapshots       — снимки счётчиков аккаунта при каждой синхронизации (честная история);
- post_metrics_snapshots  — снимки метрик постов (пишутся, только если метрики изменились);
- notification_events     — уведомления итд (подписки, комментарии), источник реальных дат;
- follow_events           — подписки, восстановленные из уведомлений, с дедупликацией;
- itd_users               — справочник пользователей итд (авторы уведомлений, подписчики) со статусом верификации;
- sync_jobs               — очередь задач синхронизации для воркера.
"""

from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, Text, TypeDecorator, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.timeutils import format_utc, parse_utc


class UTCDateTime(TypeDecorator):
    """aware datetime ⇄ строка ISO-8601 UTC `YYYY-MM-DDTHH:MM:SS.mmmZ`."""

    impl = String(32)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        parsed = parse_utc(value)
        return format_utc(parsed) if parsed else None

    def process_result_value(self, value, dialect):
        return parse_utc(value)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(255), unique=True)
    itd_user_id: Mapped[str | None] = mapped_column(String(64), unique=True)
    display_name: Mapped[str | None] = mapped_column(String(255))
    avatar: Mapped[str | None] = mapped_column(Text)
    bio: Mapped[str | None] = mapped_column(Text)
    followers_count: Mapped[int] = mapped_column(Integer, default=0)
    following_count: Mapped[int] = mapped_column(Integer, default=0)
    posts_count: Mapped[int] = mapped_column(Integer, default=0)
    registered_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    timezone: Mapped[str] = mapped_column(String(64), default="Europe/Moscow")
    encrypted_refresh_token: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    last_synced_at: Mapped[datetime | None] = mapped_column(UTCDateTime)


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime)
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime)


class Post(Base):
    __tablename__ = "posts"
    __table_args__ = (Index("ix_posts_user_created", "user_id", "created_at"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    content: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    edited_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    likes_count: Mapped[int] = mapped_column(Integer, default=0)
    comments_count: Mapped[int] = mapped_column(Integer, default=0)
    reposts_count: Mapped[int] = mapped_column(Integer, default=0)
    views_count: Mapped[int] = mapped_column(Integer, default=0)
    is_repost: Mapped[bool] = mapped_column(Boolean, default=False)
    repost_original_id: Mapped[str | None] = mapped_column(String(64))
    # JSON-массив вложений [{id,url,mime,width,height}]; NULL — пост не синхронизировался после внедрения вложений.
    attachments: Mapped[str | None] = mapped_column(Text)
    last_seen_at: Mapped[datetime | None] = mapped_column(UTCDateTime)


class AccountSnapshot(Base):
    __tablename__ = "account_snapshots"
    __table_args__ = (Index("ix_account_snapshots_user_time", "user_id", "captured_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    captured_at: Mapped[datetime] = mapped_column(UTCDateTime)
    followers_count: Mapped[int] = mapped_column(Integer)
    following_count: Mapped[int] = mapped_column(Integer)
    posts_count: Mapped[int] = mapped_column(Integer)


class PostMetricsSnapshot(Base):
    __tablename__ = "post_metrics_snapshots"

    post_id: Mapped[str] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    captured_at: Mapped[datetime] = mapped_column(UTCDateTime, primary_key=True)
    views: Mapped[int] = mapped_column(Integer)
    likes: Mapped[int] = mapped_column(Integer)
    comments: Mapped[int] = mapped_column(Integer)
    reposts: Mapped[int] = mapped_column(Integer)


class NotificationEvent(Base):
    __tablename__ = "notification_events"
    __table_args__ = (Index("ix_notification_events_user_type_time", "user_id", "type", "created_at"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # id уведомления в итд
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String(32))
    actor_id: Mapped[str | None] = mapped_column(String(64))
    actor_username: Mapped[str | None] = mapped_column(String(255))
    actor_display_name: Mapped[str | None] = mapped_column(String(255))
    actor_avatar: Mapped[str | None] = mapped_column(Text)
    target_id: Mapped[str | None] = mapped_column(String(64))
    preview: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime)
    actor_is_verified: Mapped[bool | None] = mapped_column(Boolean)
    is_read: Mapped[bool | None] = mapped_column(Boolean)
    target_type: Mapped[str | None] = mapped_column(String(32))


class ItdUser(Base):
    __tablename__ = "itd_users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # id пользователя в итд
    username: Mapped[str | None] = mapped_column(String(255), index=True)
    display_name: Mapped[str | None] = mapped_column(String(255))
    avatar: Mapped[str | None] = mapped_column(Text)
    is_verified: Mapped[bool | None] = mapped_column(Boolean)
    updated_at: Mapped[datetime | None] = mapped_column(UTCDateTime)


class FollowEvent(Base):
    __tablename__ = "follow_events"
    __table_args__ = (
        UniqueConstraint("user_id", "follower_id", "followed_at", name="uq_follow_events_dedup"),
        Index("ix_follow_events_user_time", "user_id", "followed_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    follower_id: Mapped[str] = mapped_column(String(64))
    follower_username: Mapped[str | None] = mapped_column(String(255))
    follower_display_name: Mapped[str | None] = mapped_column(String(255))
    follower_avatar: Mapped[str | None] = mapped_column(Text)
    followed_at: Mapped[datetime] = mapped_column(UTCDateTime)
    source: Mapped[str] = mapped_column(String(32), default="notification")
    # True/False — есть ли этот человек в текущем списке подписчиков (проверяется при синке); None — не проверяли.
    is_current_follower: Mapped[bool | None] = mapped_column(Boolean)


class SyncJob(Base):
    __tablename__ = "sync_jobs"
    __table_args__ = (Index("ix_sync_jobs_status", "status", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(16), default="queued")  # queued|running|done|failed
    created_at: Mapped[datetime] = mapped_column(UTCDateTime)
    started_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    finished_at: Mapped[datetime | None] = mapped_column(UTCDateTime)
    posts_synced: Mapped[int | None] = mapped_column(Integer)
    new_follow_events: Mapped[int | None] = mapped_column(Integer)
    error: Mapped[str | None] = mapped_column(Text)
