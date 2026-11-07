"""HTTP-эндпоинты аналитики (/api/analytics/*). Пользователь — из сессии, username в путях нет."""

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.modules.analytics.schemas import (
    Dynamics,
    FollowersSeries,
    NewFollowersList,
    Overview,
    PostingTime,
    PublicationDays,
    Weekdays,
)
from app.modules.analytics.service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=Overview, summary="Сводка по аккаунту")
def get_overview(user: CurrentUser, db: DbSession):
    return AnalyticsService(db, user).overview()


@router.get(
    "/audience/followers",
    response_model=FollowersSeries,
    summary="Рост подписчиков: снимки + восстановление по уведомлениям",
)
def get_followers(user: CurrentUser, db: DbSession):
    return AnalyticsService(db, user).followers()


@router.get("/audience/new-followers", response_model=NewFollowersList, summary="Последние подписчики (по уведомлениям)")
def get_new_followers(user: CurrentUser, db: DbSession, limit: int = Query(20, ge=1, le=100)):
    return AnalyticsService(db, user).new_followers(limit)


@router.get(
    "/engagement/by-publication-date",
    response_model=PublicationDays,
    summary="Метрики постов по дню публикации (не рост во времени)",
)
def get_by_publication_date(user: CurrentUser, db: DbSession):
    return AnalyticsService(db, user).by_publication_date()


@router.get("/engagement/dynamics", response_model=Dynamics, summary="Динамика суммарных метрик по снимкам")
def get_dynamics(user: CurrentUser, db: DbSession):
    return AnalyticsService(db, user).dynamics()


@router.get("/posting-time", response_model=PostingTime, summary="Метрики по часу публикации и лучшее время")
def get_posting_time(user: CurrentUser, db: DbSession):
    return AnalyticsService(db, user).posting_time()


@router.get("/weekdays", response_model=Weekdays, summary="Активность по дням недели публикации")
def get_weekdays(user: CurrentUser, db: DbSession):
    return AnalyticsService(db, user).weekdays()
