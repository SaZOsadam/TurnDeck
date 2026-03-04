import re

SPOTIFY_PLAYLIST_REGEX = r"playlist[/:]([a-zA-Z0-9]+)"


def extract_playlist_id(url: str) -> str | None:
    match = re.search(SPOTIFY_PLAYLIST_REGEX, url)
    return match.group(1) if match else None
