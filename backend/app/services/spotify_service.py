import os
import time
import logging
import requests

logger = logging.getLogger("spotify_service")

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:8001/auth/callback")

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE = "https://api.spotify.com/v1"

SCOPES = " ".join([
    "user-read-email",
    "user-read-playback-state",
    "user-modify-playback-state",
    "playlist-read-private",
    "playlist-modify-private",
    "playlist-modify-public",
])


class SpotifyRateLimitError(Exception):
    pass


def _handle_rate_limit(response: requests.Response) -> None:
    if response.status_code == 429:
        retry_after = int(response.headers.get("Retry-After", 1))
        logger.warning(f"Rate limited by Spotify. Retrying after {retry_after}s")
        time.sleep(retry_after)
        raise SpotifyRateLimitError()


def _request_with_retry(method: str, url: str, **kwargs) -> requests.Response:
    response = requests.request(method, url, **kwargs)
    try:
        _handle_rate_limit(response)
    except SpotifyRateLimitError:
        response = requests.request(method, url, **kwargs)
        if response.status_code == 429:
            logger.error(f"Still rate limited after retry: {url}")
    return response


def get_auth_url() -> str:
    from urllib.parse import urlencode
    params = {
        "client_id": SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": SPOTIFY_REDIRECT_URI,
        "scope": SCOPES,
        "show_dialog": "true",
    }
    return f"{SPOTIFY_AUTH_URL}?{urlencode(params)}"


def exchange_code(code: str) -> dict:
    response = requests.post(SPOTIFY_TOKEN_URL, data={
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": SPOTIFY_REDIRECT_URI,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    })
    response.raise_for_status()
    return response.json()


def refresh_access_token(refresh_token: str) -> dict:
    response = requests.post(SPOTIFY_TOKEN_URL, data={
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    })
    response.raise_for_status()
    return response.json()


def get_current_user(access_token: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    response = _request_with_retry("GET", f"{SPOTIFY_API_BASE}/me", headers=headers)
    response.raise_for_status()
    return response.json()


def get_playlist(access_token: str, playlist_id: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    response = _request_with_retry("GET", f"{SPOTIFY_API_BASE}/playlists/{playlist_id}", headers=headers)
    response.raise_for_status()
    return response.json()


def get_current_playback(access_token: str) -> dict | None:
    headers = {"Authorization": f"Bearer {access_token}"}
    response = _request_with_retry("GET", f"{SPOTIFY_API_BASE}/me/player", headers=headers)
    if response.status_code == 204:
        return None
    response.raise_for_status()
    return response.json()


def get_devices(access_token: str) -> list:
    headers = {"Authorization": f"Bearer {access_token}"}
    response = _request_with_retry("GET", f"{SPOTIFY_API_BASE}/me/player/devices", headers=headers)
    response.raise_for_status()
    return response.json().get("devices", [])


def get_playlist_duration(access_token: str, playlist_id: str) -> int:
    """Get total duration of a playlist in seconds by summing all track durations."""
    headers = {"Authorization": f"Bearer {access_token}"}
    total_ms = 0
    url = f"{SPOTIFY_API_BASE}/playlists/{playlist_id}/tracks?fields=items(track(duration_ms)),next&limit=100"
    while url:
        response = _request_with_retry("GET", url, headers=headers)
        if not response.ok:
            logger.warning(f"Failed to get playlist tracks: {response.status_code}")
            return 0
        data = response.json()
        for item in data.get("items", []):
            track = item.get("track")
            if track and track.get("duration_ms"):
                total_ms += track["duration_ms"]
        url = data.get("next")
    return total_ms // 1000


def start_playback(access_token: str, playlist_uri: str, device_id: str = None) -> None:
    headers = {"Authorization": f"Bearer {access_token}"}

    if not device_id:
        devices = get_devices(access_token)
        logger.info(f"Available devices: {devices}")
        active = [d for d in devices if d.get("is_active")]
        if active:
            device_id = active[0]["id"]
        elif devices:
            device_id = devices[0]["id"]
        else:
            raise Exception("No Spotify devices found. Open Spotify on your phone or desktop first.")

    params = f"?device_id={device_id}" if device_id else ""
    response = _request_with_retry(
        "PUT",
        f"{SPOTIFY_API_BASE}/me/player/play{params}",
        headers=headers,
        json={"context_uri": playlist_uri},
    )
    if not response.ok:
        logger.error(f"Spotify play error {response.status_code}: {response.text}")
    response.raise_for_status()
