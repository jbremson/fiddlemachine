"""Sets (playlists) API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .auth import require_user
from .database import (
    SetRecord,
    UserRecord,
    delete_set,
    delete_set_item,
    get_set,
    get_set_item_count,
    get_set_items,
    get_user_sets,
    insert_set,
    insert_set_item,
    reorder_set_items,
    update_set,
    update_set_item,
)

sets_router = APIRouter(prefix="/api")


class SetCreate(BaseModel):
    name: str


class SetUpdate(BaseModel):
    name: str


class SetItemCreate(BaseModel):
    tune_source: str
    tune_ref: str
    tune_title: str
    bpm: int | None = None
    transpose: int | None = None
    octave_shift: int | None = None
    synth_type: str | None = None
    metronome_enabled: bool | None = None
    count_off_enabled: bool | None = None


class SetItemUpdate(BaseModel):
    bpm: int | None = None
    transpose: int | None = None
    octave_shift: int | None = None
    synth_type: str | None = None
    metronome_enabled: bool | None = None
    count_off_enabled: bool | None = None


class ReorderRequest(BaseModel):
    item_ids: list[int]


def _set_to_dict(s: SetRecord, item_count: int | None = None) -> dict:
    d = {
        "id": s.id,
        "name": s.name,
        "created_at": s.created_at.isoformat(),
        "updated_at": s.updated_at.isoformat(),
    }
    if item_count is not None:
        d["item_count"] = item_count
    return d


def _item_to_dict(item) -> dict:
    return {
        "id": item.id,
        "position": item.position,
        "tune_source": item.tune_source,
        "tune_ref": item.tune_ref,
        "tune_title": item.tune_title,
        "bpm": item.bpm,
        "transpose": item.transpose,
        "octave_shift": item.octave_shift,
        "synth_type": item.synth_type,
        "metronome_enabled": item.metronome_enabled,
        "count_off_enabled": item.count_off_enabled,
    }


@sets_router.get("/sets")
async def list_sets(user: UserRecord = Depends(require_user)):
    sets = get_user_sets(user.id)
    result = []
    for s in sets:
        count = get_set_item_count(s.id)
        result.append(_set_to_dict(s, item_count=count))
    return result


@sets_router.post("/sets", status_code=201)
async def create_set(body: SetCreate, user: UserRecord = Depends(require_user)):
    try:
        s = insert_set(user.id, body.name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _set_to_dict(s, item_count=0)


@sets_router.get("/sets/{set_id}")
async def get_set_detail(set_id: int, user: UserRecord = Depends(require_user)):
    s = get_set(set_id, user.id)
    if not s:
        raise HTTPException(status_code=404, detail="Set not found")
    items = get_set_items(set_id)
    d = _set_to_dict(s)
    d["items"] = [_item_to_dict(item) for item in items]
    return d


@sets_router.put("/sets/{set_id}")
async def rename_set(set_id: int, body: SetUpdate, user: UserRecord = Depends(require_user)):
    s = update_set(set_id, user.id, body.name)
    if not s:
        raise HTTPException(status_code=404, detail="Set not found")
    return _set_to_dict(s)


@sets_router.delete("/sets/{set_id}")
async def remove_set(set_id: int, user: UserRecord = Depends(require_user)):
    deleted = delete_set(set_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Set not found")
    return {"ok": True}


@sets_router.post("/sets/{set_id}/items", status_code=201)
async def add_item(set_id: int, body: SetItemCreate, user: UserRecord = Depends(require_user)):
    s = get_set(set_id, user.id)
    if not s:
        raise HTTPException(status_code=404, detail="Set not found")
    count = get_set_item_count(set_id)
    if count >= 99:
        raise HTTPException(status_code=400, detail="Set is full (max 99 items)")
    try:
        item = insert_set_item(
            set_id,
            tune_source=body.tune_source,
            tune_ref=body.tune_ref,
            tune_title=body.tune_title,
            bpm=body.bpm,
            transpose=body.transpose,
            octave_shift=body.octave_shift,
            synth_type=body.synth_type,
            metronome_enabled=body.metronome_enabled,
            count_off_enabled=body.count_off_enabled,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _item_to_dict(item)


@sets_router.put("/sets/{set_id}/items/{item_id}")
async def update_item(set_id: int, item_id: int, body: SetItemUpdate, user: UserRecord = Depends(require_user)):
    s = get_set(set_id, user.id)
    if not s:
        raise HTTPException(status_code=404, detail="Set not found")
    item = update_set_item(
        item_id, set_id,
        bpm=body.bpm,
        transpose=body.transpose,
        octave_shift=body.octave_shift,
        synth_type=body.synth_type,
        metronome_enabled=body.metronome_enabled,
        count_off_enabled=body.count_off_enabled,
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return _item_to_dict(item)


@sets_router.delete("/sets/{set_id}/items/{item_id}")
async def remove_item(set_id: int, item_id: int, user: UserRecord = Depends(require_user)):
    s = get_set(set_id, user.id)
    if not s:
        raise HTTPException(status_code=404, detail="Set not found")
    deleted = delete_set_item(item_id, set_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"ok": True}


@sets_router.put("/sets/{set_id}/reorder")
async def reorder_items(set_id: int, body: ReorderRequest, user: UserRecord = Depends(require_user)):
    s = get_set(set_id, user.id)
    if not s:
        raise HTTPException(status_code=404, detail="Set not found")
    items = reorder_set_items(set_id, body.item_ids)
    return [_item_to_dict(item) for item in items]
