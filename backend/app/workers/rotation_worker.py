import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from app.services import supabase_service
from app.controllers.rotation_controller import should_rotate

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rotation_worker")

scheduler = BackgroundScheduler()


def rotation_tick():
    """Check all enabled users and advance their playlist index when the interval has elapsed."""
    try:
        enabled_settings = supabase_service.get_all_enabled_users()
        print(f"[rotation_tick] {datetime.utcnow().isoformat()} - found {len(enabled_settings)} enabled user(s)")
        for settings in enabled_settings:
            user_id = settings.get("user_id")
            rotate = should_rotate(settings)
            last = settings.get("last_switch_at")
            interval = settings.get("interval_minutes", 30)
            print(f"[rotation_tick] user={user_id} should_rotate={rotate} last_switch={last} interval={interval}min")

            mode = settings.get("rotation_mode", "playlist_end")
            if rotate and mode == "interval":
                playlists = supabase_service.get_playlists(user_id)
                if not playlists:
                    continue
                current_index = settings.get("current_playlist_index", 0)
                next_index = (current_index + 1) % len(playlists)
                supabase_service.upsert_settings(user_id, {"current_playlist_index": next_index})
                supabase_service.update_last_switch(user_id)
                name = playlists[next_index].get("name", playlists[next_index]["playlist_id"])
                print(f"[rotation_tick] AUTO-ROTATED user {user_id} to: {name}")
    except Exception as e:
        print(f"[rotation_tick] ERROR: {e}")


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(rotation_tick, "interval", seconds=30, id="rotation_tick", replace_existing=True)
        scheduler.start()
        print("[rotation_worker] Scheduler STARTED")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print("[rotation_worker] Scheduler STOPPED")
