"""Доступ к данным пользователей и снимков аккаунта (users, account_snapshots)."""

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import AccountSnapshot, User


class UsersRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def by_username(self, username: str) -> User | None:
        return self.db.scalar(select(User).where(User.username == username))

    def by_itd_id(self, itd_user_id: str) -> User | None:
        return self.db.scalar(select(User).where(User.itd_user_id == itd_user_id))

    def add(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user

    def add_snapshot(self, user: User, captured_at: datetime) -> AccountSnapshot:
        snapshot = AccountSnapshot(
            user_id=user.id,
            captured_at=captured_at,
            followers_count=user.followers_count or 0,
            following_count=user.following_count or 0,
            posts_count=user.posts_count or 0,
        )
        self.db.add(snapshot)
        return snapshot

    def snapshots(self, user_id: int) -> list[AccountSnapshot]:
        return list(
            self.db.scalars(
                select(AccountSnapshot).where(AccountSnapshot.user_id == user_id).order_by(AccountSnapshot.captured_at)
            )
        )
