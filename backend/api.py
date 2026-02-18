"""FastAPI routes for tune data."""

import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .abc_parser import parse_abc, parse_abc_file
from .tune import Tune, TuneSummary
from . import database as db

router = APIRouter(prefix="/api")

def get_tunes_dir() -> Path:
    """Get the tunes directory path."""
    return Path(__file__).parent.parent / "resources" / "tunes"


def load_all_tunes() -> dict[str, Tune]:
    """Load all tunes from the resources directory."""
    tunes = {}
    tunes_dir = get_tunes_dir()
    if not tunes_dir.exists():
        return tunes

    for abc_file in tunes_dir.glob("*.abc"):
        try:
            tune = parse_abc_file(str(abc_file))
            tunes[tune.id] = tune
        except Exception as e:
            print(f"Error loading {abc_file}: {e}")

    return tunes


class TuneInfo(BaseModel):
    """Extended tune info including database metadata."""
    id: str
    title: str
    key: str
    source: str | None = None
    url: str | None = None
    quality: str | None = None
    version: int | None = None


@router.get("/tunes", response_model=list[TuneInfo])
async def list_tunes():
    """List all available tunes with metadata from database."""
    tunes = load_all_tunes()
    db.init_db()

    result = []
    for t in tunes.values():
        info = TuneInfo(id=t.id, title=t.title, key=t.key)
        # Enrich with database metadata if available
        record = db.get_tune(t.id)
        if record:
            info.source = record.source
            info.url = record.url
            info.quality = record.quality.value
            info.version = record.version
        result.append(info)

    return result


@router.get("/tunes/{tune_id}", response_model=Tune)
async def get_tune(tune_id: str):
    """Get a specific tune by ID."""
    tunes = load_all_tunes()

    if tune_id not in tunes:
        raise HTTPException(status_code=404, detail="Tune not found")

    return tunes[tune_id]


class ParseRequest(BaseModel):
    """Request body for parsing ABC content."""
    abc: str
    id: str | None = None


@router.post("/tunes/parse", response_model=Tune)
async def parse_tune(request: ParseRequest):
    """Parse uploaded ABC content."""
    tune_id = request.id or "uploaded"
    try:
        tune = parse_abc(request.abc, tune_id)
        return tune
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse ABC: {str(e)}")


class TuneMetadataUpdate(BaseModel):
    """Request body for updating tune metadata."""
    source: str | None = None
    url: str | None = None
    quality: str | None = None  # "high", "medium", or "low"


@router.patch("/tunes/{tune_id}/metadata", response_model=TuneInfo)
async def update_tune_metadata(tune_id: str, update: TuneMetadataUpdate):
    """Update metadata for a tune in the database."""
    db.init_db()

    record = db.get_tune(tune_id)
    if not record:
        raise HTTPException(status_code=404, detail="Tune not found in database")

    # Map quality string to enum
    quality = None
    if update.quality:
        try:
            quality = db.QualityRating(update.quality)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid quality: {update.quality}. Must be 'high', 'medium', or 'low'"
            )

    updated = db.update_tune(
        tune_id,
        source=update.source,
        url=update.url,
        quality=quality,
        increment_version=False  # Don't increment version for metadata-only changes
    )

    # Load tune data for key
    tunes = load_all_tunes()
    tune = tunes.get(tune_id)

    return TuneInfo(
        id=updated.tune_id,
        title=updated.title,
        key=tune.key if tune else "?",
        source=updated.source,
        url=updated.url,
        quality=updated.quality.value,
        version=updated.version
    )


@router.post("/tunes/sync")
async def sync_tunes():
    """Sync database from ABC files in resources/tunes."""
    results = db.sync_from_files()
    return {
        "synced": len(results),
        "inserted": sum(1 for r in results.values() if r == 'inserted'),
        "updated": sum(1 for r in results.values() if r == 'updated'),
        "unchanged": sum(1 for r in results.values() if r == 'unchanged'),
        "details": results
    }
