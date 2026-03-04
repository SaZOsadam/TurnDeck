import os
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client


# --- Users ---

def get_user_by_spotify_id(spotify_user_id: str) -> dict | None:
    client = get_client()
    result = client.table("users").select("*").eq("spotify_user_id", spotify_user_id).execute()
    return result.data[0] if result.data else None


def create_user(spotify_user_id: str, refresh_token: str) -> dict:
    client = get_client()
    result = client.table("users").insert({
        "spotify_user_id": spotify_user_id,
        "refresh_token": refresh_token,
    }).execute()
    return result.data[0]


def update_refresh_token(user_id: str, refresh_token: str) -> None:
    client = get_client()
    client.table("users").update({"refresh_token": refresh_token}).eq("id", user_id).execute()


def get_user_by_id(user_id: str) -> dict | None:
    client = get_client()
    result = client.table("users").select("*").eq("id", user_id).execute()
    return result.data[0] if result.data else None


# --- Playlists ---

def get_playlists(user_id: str) -> list:
    client = get_client()
    result = client.table("playlists").select("*").eq("user_id", user_id).execute()
    return result.data


def add_playlist(user_id: str, playlist_id: str, name: str, source: str) -> dict:
    client = get_client()
    result = client.table("playlists").insert({
        "user_id": user_id,
        "playlist_id": playlist_id,
        "name": name,
        "source": source,
    }).execute()
    return result.data[0]


def delete_playlist(playlist_id: str, user_id: str) -> None:
    client = get_client()
    client.table("playlists").delete().eq("id", playlist_id).eq("user_id", user_id).execute()


# --- Settings ---

def get_settings(user_id: str) -> dict | None:
    client = get_client()
    result = client.table("settings").select("*").eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


def upsert_settings(user_id: str, data: dict) -> dict:
    client = get_client()
    data["user_id"] = user_id
    result = client.table("settings").upsert(data).execute()
    return result.data[0]


def update_last_switch(user_id: str) -> None:
    client = get_client()
    from datetime import datetime
    client.table("settings").update({
        "last_switch_at": datetime.utcnow().isoformat()
    }).eq("user_id", user_id).execute()


# --- Rotation queries ---

def get_all_enabled_users() -> list:
    client = get_client()
    result = client.table("settings").select("*").eq("enabled", True).execute()
    return result.data
