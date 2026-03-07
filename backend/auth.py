"""Google OAuth authentication and user song endpoints."""

import os
from datetime import datetime, timedelta, timezone

import jwt
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel

from .database import (
    UserRecord,
    delete_user_song,
    get_user_by_google_id,
    get_user_song,
    get_user_songs,
    insert_user_song,
    update_user_song,
    upsert_user,
)

auth_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ.get("JWT_SECRET", "")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7
COOKIE_NAME = "fm_auth"

oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.environ.get("GOOGLE_CLIENT_ID", ""),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET", ""),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


def _create_jwt(google_id: str) -> str:
    payload = {
        "sub": google_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(request: Request) -> UserRecord | None:
    """Extract user from JWT cookie. Returns None if not authenticated."""
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        google_id = payload.get("sub")
        if not google_id:
            return None
        return get_user_by_google_id(google_id)
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def require_user(user: UserRecord | None = Depends(get_current_user)) -> UserRecord:
    """Dependency that requires authentication."""
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


# --- OAuth endpoints ---

@auth_router.get("/auth/login")
async def login(request: Request):
    redirect_uri = os.environ.get("OAUTH_REDIRECT_URI")
    if not redirect_uri:
        redirect_uri = str(request.url_for("auth_callback"))
    return await oauth.google.authorize_redirect(request, redirect_uri)


@auth_router.get("/auth/callback", name="auth_callback")
async def auth_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo")
    if not userinfo:
        raise HTTPException(status_code=400, detail="Failed to get user info from Google")

    user = upsert_user(
        google_id=userinfo["sub"],
        email=userinfo["email"],
        name=userinfo.get("name"),
        picture_url=userinfo.get("picture"),
    )

    jwt_token = _create_jwt(user.google_id)
    response = RedirectResponse(url="/")
    response.set_cookie(
        key=COOKIE_NAME,
        value=jwt_token,
        httponly=True,
        samesite="lax",
        max_age=JWT_EXPIRY_DAYS * 86400,
        secure=False,  # Set to True in production with HTTPS
    )
    return response


@auth_router.get("/auth/me")
async def me(request: Request):
    user = get_current_user(request)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture_url": user.picture_url,
    }


@auth_router.post("/auth/logout")
async def logout():
    response = JSONResponse(content={"ok": True})
    response.delete_cookie(key=COOKIE_NAME)
    return response


# --- Song CRUD endpoints ---

class SongCreate(BaseModel):
    title: str
    notes: str | None = None
    abc_content: str


class SongUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    abc_content: str | None = None


def _song_to_dict(song):
    return {
        "id": song.id,
        "user_id": song.user_id,
        "title": song.title,
        "notes": song.notes,
        "abc_content": song.abc_content,
        "created_at": song.created_at.isoformat(),
        "updated_at": song.updated_at.isoformat(),
    }


@auth_router.get("/songs")
async def list_songs(user: UserRecord = Depends(require_user)):
    songs = get_user_songs(user.id)
    return [_song_to_dict(s) for s in songs]


@auth_router.post("/songs", status_code=201)
async def create_song(body: SongCreate, user: UserRecord = Depends(require_user)):
    try:
        song = insert_user_song(user.id, body.title, body.notes, body.abc_content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _song_to_dict(song)


@auth_router.get("/songs/{song_id}")
async def get_song(song_id: int, user: UserRecord = Depends(require_user)):
    song = get_user_song(song_id, user.id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return _song_to_dict(song)


@auth_router.put("/songs/{song_id}")
async def update_song(song_id: int, body: SongUpdate, user: UserRecord = Depends(require_user)):
    try:
        song = update_user_song(
            song_id, user.id,
            title=body.title, notes=body.notes, abc_content=body.abc_content
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    return _song_to_dict(song)


@auth_router.delete("/songs/{song_id}")
async def delete_song(song_id: int, user: UserRecord = Depends(require_user)):
    deleted = delete_user_song(song_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Song not found")
    return {"ok": True}
