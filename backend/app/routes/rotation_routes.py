import logging
import traceback
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException

from app.controllers.auth_middleware import get_current_user_id
from app.services.supabase_service import (
    get_settings, upsert_settings, get_playlists, update_last_switch,
)
from app.workers.rotation_worker import start_scheduler, stop_scheduler

logger = logging.getLogger("rotation_routes")

router = APIRouter()


@router.post("/start")
def start_rotation(request: Request):
    """Start the rotation schedule. Sets current playlist and begins the timer."""
    user_id = get_current_user_id(request)

    playlists = get_playlists(user_id)
    if not playlists:
        raise HTTPException(status_code=400, detail="Add at least one playlist before starting rotation.")

    settings = get_settings(user_id)
    current_index = settings.get("current_playlist_index", 0) if settings else 0
    if current_index >= len(playlists):
        current_index = 0

    upsert_settings(user_id, {"enabled": True, "current_playlist_index": current_index})
    update_last_switch(user_id)
    start_scheduler()

    playlist = playlists[current_index]
    name = playlist.get("name", playlist["playlist_id"])

    logger.info(f"Rotation started for user {user_id}, current: {name}")
    return {
        "message": f"Rotation started! Now play: {name}",
        "current_playlist": _playlist_info(playlist),
    }


@router.post("/stop")
def stop_rotation(request: Request):
    """Stop the rotation schedule."""
    user_id = get_current_user_id(request)
    upsert_settings(user_id, {"enabled": False})
    return {"message": "Rotation stopped"}


@router.post("/skip")
def skip_to_next(request: Request):
    """Manually skip to the next playlist in the rotation."""
    try:
        user_id = get_current_user_id(request)
        playlists = get_playlists(user_id)
        if not playlists:
            raise HTTPException(status_code=400, detail="No playlists to skip to.")

        settings = get_settings(user_id)
        current_index = settings.get("current_playlist_index", 0) if settings else 0
        next_index = (current_index + 1) % len(playlists)

        upsert_settings(user_id, {"current_playlist_index": next_index})
        update_last_switch(user_id)

        playlist = playlists[next_index]
        name = playlist.get("name", playlist["playlist_id"])

        logger.info(f"User {user_id} skipped to playlist: {name}")
        return {
            "message": f"Skipped! Now play: {name}",
            "current_playlist": _playlist_info(playlist),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Skip failed: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
def rotation_status(request: Request):
    """Get full rotation state with playlist details, Spotify links, and countdown."""
    user_id = get_current_user_id(request)
    try:
        settings = get_settings(user_id)
    except Exception as e:
        logger.warning(f"Failed to fetch settings: {e}")
        return {"enabled": False, "current_playlist": None, "next_playlist": None, "playlists": []}

    if not settings:
        return {"enabled": False, "current_playlist": None, "next_playlist": None, "playlists": []}

    try:
        playlists = get_playlists(user_id)
    except Exception as e:
        logger.warning(f"Failed to fetch playlists: {e}")
        playlists = []

    current_index = settings.get("current_playlist_index", 0)
    if playlists and current_index >= len(playlists):
        current_index = 0

    current_pl = _playlist_info(playlists[current_index]) if playlists and current_index < len(playlists) else None
    next_index = (current_index + 1) % len(playlists) if playlists else 0
    next_pl = _playlist_info(playlists[next_index]) if playlists and len(playlists) > 1 else None

    last_switch = settings.get("last_switch_at")
    interval = settings.get("interval_minutes", 30)
    rotation_mode = settings.get("rotation_mode", "playlist_end")
    seconds_remaining = None
    if last_switch and settings.get("enabled"):
        if isinstance(last_switch, str):
            last_switch_dt = datetime.fromisoformat(last_switch.replace("Z", "+00:00").replace("+00:00", ""))
        else:
            last_switch_dt = last_switch
        elapsed = (datetime.utcnow() - last_switch_dt).total_seconds()

        if rotation_mode == "interval":
            seconds_remaining = max(0, int(interval * 60 - elapsed))

    return {
        "enabled": settings.get("enabled", False),
        "rotation_mode": settings.get("rotation_mode", "playlist_end"),
        "interval_minutes": interval,
        "current_playlist": current_pl,
        "current_playlist_index": current_index,
        "next_playlist": next_pl,
        "last_switch_at": settings.get("last_switch_at"),
        "seconds_remaining": seconds_remaining,
        "total_playlists": len(playlists),
        "playlists": [_playlist_info(p) for p in playlists],
    }


def _playlist_info(playlist: dict) -> dict:
    pid = playlist.get("playlist_id", "")
    return {
        "id": playlist.get("id"),
        "playlist_id": pid,
        "name": playlist.get("name", pid),
        "spotify_url": f"https://open.spotify.com/playlist/{pid}",
        "spotify_uri": f"spotify:playlist:{pid}",
        "play_url": f"https://open.spotify.com/playlist/{pid}?play=true&go=1",
        "active": playlist.get("active", True),
    }
