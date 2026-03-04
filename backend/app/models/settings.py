from pydantic import BaseModel
from typing import Optional


class SettingsUpdate(BaseModel):
    rotation_mode: Optional[str] = None
    interval_minutes: Optional[int] = None
    fallback_playlist_id: Optional[str] = None
    enabled: Optional[bool] = None


class SettingsResponse(BaseModel):
    user_id: str
    rotation_mode: str
    interval_minutes: int
    fallback_playlist_id: Optional[str] = None
    enabled: bool
    current_playlist_index: int
    last_switch_at: Optional[str] = None
