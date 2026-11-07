"""HTTP-эндпоинты настроек пользователя (/api/settings)."""

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.modules.users.schemas import UserSettings

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=UserSettings, summary="Настройки пользователя")
def get_settings_(user: CurrentUser):
    return UserSettings(timezone=user.timezone)


@router.put("", response_model=UserSettings, summary="Изменить настройки (часовой пояс)")
def update_settings(payload: UserSettings, user: CurrentUser, db: DbSession):
    user.timezone = payload.timezone
    db.commit()
    return UserSettings(timezone=user.timezone)
