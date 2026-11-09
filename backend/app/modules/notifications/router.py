"""HTTP-эндпоинты уведомлений (/api/notifications): список с фильтрами и сортировкой, сводка, авторы."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.modules.notifications.schemas import (
    ActorsList,
    NotificationSort,
    NotificationsPage,
    NotificationsSummary,
    NotificationType,
)
from app.modules.notifications.service import NotificationFilters, NotificationsService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationsPage, summary="Уведомления с фильтрами и сортировкой")
def list_notifications(
    user: CurrentUser,
    db: DbSession,
    types: Annotated[list[NotificationType] | None, Query(description="типы, можно несколько")] = None,
    actor: Annotated[str | None, Query(max_length=255, description="username автора")] = None,
    verified: Annotated[bool | None, Query(description="true — верифицированные, false — нет")] = None,
    unread: bool = False,
    q: Annotated[str | None, Query(max_length=200, description="поиск по тексту и автору")] = None,
    date_from: date | None = None,
    date_to: date | None = None,
    sort: NotificationSort = "new",
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    filters = NotificationFilters(
        types=list(types or []),
        actor=actor,
        verified=verified,
        unread=unread,
        q=q,
        date_from=date_from,
        date_to=date_to,
    )
    return NotificationsService(db, user).list(filters, sort, limit, offset)


@router.get("/summary", response_model=NotificationsSummary, summary="Сводка по уведомлениям")
def notifications_summary(user: CurrentUser, db: DbSession):
    return NotificationsService(db, user).summary()


@router.get("/actors", response_model=ActorsList, summary="Авторы уведомлений (для фильтра по пользователю)")
def notification_actors(
    user: CurrentUser,
    db: DbSession,
    q: Annotated[str | None, Query(max_length=100)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    return NotificationsService(db, user).actors(q, limit)
