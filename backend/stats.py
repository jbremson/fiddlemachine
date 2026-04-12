"""Usage statistics API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .auth import require_user
from .database import (
    UserRecord,
    get_user_play_history,
    get_user_play_stats,
    insert_play_event,
)

stats_router = APIRouter(prefix="/api/stats")


class PlayEventCreate(BaseModel):
    tune_ref: str
    tune_source: str  # 'library' or 'user_song'
    tune_title: str
    bpm: int | None = None
    transpose: int | None = None
    duration_seconds: float | None = None


@stats_router.post("/play")
async def log_play_event(body: PlayEventCreate, user: UserRecord = Depends(require_user)):
    if body.tune_source not in ('library', 'user_song'):
        raise HTTPException(status_code=400, detail="tune_source must be 'library' or 'user_song'")
    event = insert_play_event(
        user_id=user.id,
        tune_ref=body.tune_ref,
        tune_source=body.tune_source,
        tune_title=body.tune_title,
        bpm=body.bpm,
        transpose=body.transpose,
        duration_seconds=body.duration_seconds,
    )
    return {"ok": True, "id": event.id}


@stats_router.get("/summary")
async def get_stats_summary(days: int = 30, user: UserRecord = Depends(require_user)):
    if days < 1 or days > 365:
        raise HTTPException(status_code=400, detail="days must be between 1 and 365")
    return get_user_play_stats(user.id, days=days)


@stats_router.get("/history")
async def get_stats_history(limit: int = 50, user: UserRecord = Depends(require_user)):
    if limit < 1 or limit > 200:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 200")
    return get_user_play_history(user.id, limit=limit)
