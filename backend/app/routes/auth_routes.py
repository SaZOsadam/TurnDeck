import os
import logging
from fastapi import APIRouter, Response, Request, HTTPException
from fastapi.responses import RedirectResponse
from jose import JWTError

from app.controllers.auth_controller import create_jwt, decode_jwt
from app.services.spotify_service import get_auth_url, exchange_code, get_current_user
from app.services.supabase_service import get_user_by_spotify_id, create_user, update_refresh_token, get_user_by_id

logger = logging.getLogger("auth_routes")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5173")

router = APIRouter()


@router.get("/login")
def login():
    """Redirect to Spotify login."""
    return RedirectResponse(url=get_auth_url())


@router.get("/callback")
def callback(request: Request):
    """Handle OAuth callback from Spotify."""
    code = request.query_params.get("code")
    error = request.query_params.get("error")

    if error or not code:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=access_denied")

    try:
        token_data = exchange_code(code)
    except Exception as e:
        logger.error(f"Token exchange failed: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=token_exchange_failed")

    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")

    if not access_token or not refresh_token:
        logger.error(f"Missing tokens. access_token: {bool(access_token)}, refresh_token: {bool(refresh_token)}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=missing_tokens")

    try:
        spotify_user = get_current_user(access_token)
    except Exception as e:
        logger.error(f"Spotify user fetch failed: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=spotify_user_fetch_failed")

    spotify_user_id = spotify_user.get("id")

    existing_user = get_user_by_spotify_id(spotify_user_id)
    if existing_user:
        user_id = existing_user["id"]
        update_refresh_token(user_id, refresh_token)
    else:
        new_user = create_user(spotify_user_id, refresh_token)
        user_id = new_user["id"]

    jwt_token = create_jwt(str(user_id))

    response = RedirectResponse(url=f"{FRONTEND_URL}/dashboard")
    response.set_cookie(
        key="session",
        value=jwt_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=86400,
    )
    return response


@router.post("/logout")
def logout(response: Response):
    """Destroy JWT session."""
    response.delete_cookie(key="session")
    return {"message": "Logged out"}


@router.get("/me")
def me(request: Request):
    """Get current user info from JWT."""
    token = request.cookies.get("session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = decode_jwt(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {
        "id": user["id"],
        "spotify_user_id": user["spotify_user_id"],
        "created_at": user.get("created_at"),
    }
