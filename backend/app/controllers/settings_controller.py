VALID_ROTATION_MODES = ("interval", "playlist_end")


def validate_settings(data: dict) -> dict | None:
    mode = data.get("rotation_mode")
    if mode and mode not in VALID_ROTATION_MODES:
        return None
    interval = data.get("interval_minutes")
    if interval is not None and (not isinstance(interval, int) or interval < 1):
        return None
    return data
