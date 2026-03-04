import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth_routes import router as auth_router
from app.routes.playlist_routes import router as playlist_router
from app.routes.settings_routes import router as settings_router
from app.routes.rotation_routes import router as rotation_router
from app.workers.rotation_worker import start_scheduler

logger = logging.getLogger("autodj")


@asynccontextmanager
async def lifespan(app):
    # Start the rotation scheduler on app startup
    start_scheduler()
    logger.info("Rotation scheduler auto-started on boot")
    yield


app = FastAPI(title="AutoDJ API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://127.0.0.1:5173"),
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(playlist_router, prefix="/playlists", tags=["Playlists"])
app.include_router(settings_router, prefix="/settings", tags=["Settings"])
app.include_router(rotation_router, prefix="/rotation", tags=["Rotation"])


@app.get("/")
def root():
    return {"status": "AutoDJ API running"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
