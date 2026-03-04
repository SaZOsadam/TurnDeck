from pydantic import BaseModel
from typing import Optional


class PlaylistAdd(BaseModel):
    url: str


class PlaylistResponse(BaseModel):
    id: str
    user_id: str
    playlist_id: str
    name: Optional[str] = None
    source: Optional[str] = None
    active: Optional[bool] = True
    created_at: Optional[str] = None
