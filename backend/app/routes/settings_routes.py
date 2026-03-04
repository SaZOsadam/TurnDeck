from fastapi import APIRouter, Request, HTTPException

from app.controllers.auth_middleware import get_current_user_id
from app.controllers.settings_controller import validate_settings
from app.models.settings import SettingsUpdate
from app.services.supabase_service import get_settings, upsert_settings

router = APIRouter()


@router.get("")
def read_settings(request: Request):
    """Get user settings."""
    user_id = get_current_user_id(request)
    settings = get_settings(user_id)
    if not settings:
        settings = upsert_settings(user_id, {"fallback_playlist_id": "37i9dQZEVXbKY7jLzlJ11V"})
    return settings


@router.put("")
def update_settings(body: SettingsUpdate, request: Request):
    """Update user settings."""
    user_id = get_current_user_id(request)

    data = body.model_dump(exclude_none=True)
    validated = validate_settings(data)
    if validated is None:
        raise HTTPException(status_code=400, detail="Invalid settings values")

    result = upsert_settings(user_id, validated)
    return result
