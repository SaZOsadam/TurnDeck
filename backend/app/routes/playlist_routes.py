from fastapi import APIRouter, Request, HTTPException

from app.controllers.auth_middleware import get_current_user_id
from app.controllers.playlist_controller import extract_playlist_id
from app.models.playlist import PlaylistAdd
from app.services.supabase_service import (
    get_playlists,
    add_playlist,
    delete_playlist,
    get_user_by_id,
)
from app.services.spotify_service import get_playlist, refresh_access_token

router = APIRouter()


@router.get("")
def list_playlists(request: Request):
    """Fetch user playlists."""
    user_id = get_current_user_id(request)
    return get_playlists(user_id)


@router.post("")
def create_playlist(body: PlaylistAdd, request: Request):
    """Add playlist manually via Spotify link."""
    user_id = get_current_user_id(request)

    playlist_id = extract_playlist_id(body.url)
    if not playlist_id:
        raise HTTPException(status_code=400, detail="Invalid Spotify playlist URL")

    user = get_user_by_id(user_id)
    if not user or not user.get("refresh_token"):
        raise HTTPException(status_code=401, detail="User not found or missing token")

    try:
        token_data = refresh_access_token(user["refresh_token"])
        access_token = token_data["access_token"]
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to refresh Spotify token")

    try:
        playlist_info = get_playlist(access_token, playlist_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Playlist not found on Spotify")

    name = playlist_info.get("name", "Untitled")
    result = add_playlist(user_id, playlist_id, name, "manual")
    return result


DEFAULT_PLAYLISTS = [
    {"playlist_id": "37i9dQZEVXbKY7jLzlJ11V", "name": "Top 50 Nigeria", "source": "fallback"},
    {"playlist_id": "05RVGTjUUPNOc644TSqqwL", "name": "B-CD Playlist", "source": "fallback"},
    {"playlist_id": "5vpppBmyooe3Wt8jfozyiv", "name": "AutoDJ Today's Hit", "source": "fallback"},
]


@router.post("/defaults")
def load_default_playlists(request: Request):
    """Load built-in default playlists for the user."""
    user_id = get_current_user_id(request)
    existing = get_playlists(user_id)
    existing_ids = {p["playlist_id"] for p in existing}

    added = []
    for pl in DEFAULT_PLAYLISTS:
        if pl["playlist_id"] not in existing_ids:
            result = add_playlist(user_id, pl["playlist_id"], pl["name"], pl["source"])
            added.append(result)

    return {"added": len(added), "playlists": get_playlists(user_id)}


@router.delete("/{id}")
def remove_playlist(id: str, request: Request):
    """Remove a playlist."""
    user_id = get_current_user_id(request)
    delete_playlist(id, user_id)
    return {"message": "Playlist deleted"}
