from datetime import datetime


def should_rotate(settings: dict) -> bool:
    if not settings.get("enabled"):
        return False

    last_switch = settings.get("last_switch_at")
    interval = settings.get("interval_minutes", 30)
    if last_switch:
        if isinstance(last_switch, str):
            last_switch = datetime.fromisoformat(last_switch)
        elapsed = (datetime.utcnow() - last_switch).total_seconds() / 60
        return elapsed >= interval
    return False
