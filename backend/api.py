"""FastAPI routes for tune data."""

import base64
import io
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from music21 import converter
from pydantic import BaseModel

from .abc_parser import parse_abc, get_section_beat_boundaries
from .auth import get_current_user, require_admin, require_user
from .database import UserRecord
from .tune import Tune
from . import database as db

router = APIRouter(prefix="/api")

# Cached tune list - populated at startup, updated when tunes change
_tune_list_cache: list["TuneInfo"] | None = None


def _invalidate_tune_cache():
    """Invalidate the tune list cache."""
    global _tune_list_cache
    _tune_list_cache = None


def _get_cached_tune_list() -> list["TuneInfo"]:
    """Get the cached tune list, populating it if necessary."""
    global _tune_list_cache
    if _tune_list_cache is None:
        db.init_db()
        records = db.get_all_tunes()
        _tune_list_cache = [_record_to_tune_info(r) for r in records]
    return _tune_list_cache


class TuneInfo(BaseModel):
    """Extended tune info including database metadata."""
    id: str
    title: str
    source: str | None = None
    source_url: str | None = None
    quality: str | None = None
    rating: float | None = None
    rating_count: int = 0
    owner: str | None = None
    version: int | None = None


def _record_to_tune_info(record: db.TuneRecord) -> TuneInfo:
    """Convert a TuneRecord to a TuneInfo."""
    return TuneInfo(
        id=record.tune_id,
        title=record.title,
        source=record.source,
        source_url=record.source_url,
        quality=record.quality.value,
        rating=record.rating,
        rating_count=record.rating_count,
        owner=record.owner,
        version=record.version
    )


@router.get("/tunes", response_model=list[TuneInfo])
async def list_tunes():
    """List all available tunes (cached for performance)."""
    return _get_cached_tune_list()


@router.get("/tunes/{tune_id}", response_model=Tune)
async def get_tune(tune_id: str):
    """Get a specific tune by ID."""
    db.init_db()
    record = db.get_tune(tune_id)
    if not record:
        raise HTTPException(status_code=404, detail="Tune not found")

    try:
        tune = parse_abc(record.abc_content, record.tune_id)
        return tune
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse tune ABC: {str(e)}")


@router.get("/tunes/{tune_id}/midi")
async def get_tune_midi(tune_id: str, transpose: int = Query(0, ge=-12, le=12)):
    """Export a tune as a MIDI file.

    Optional transpose parameter shifts pitch by N semitones.
    """
    db.init_db()
    record = db.get_tune(tune_id)
    if not record:
        raise HTTPException(status_code=404, detail="Tune not found")

    try:
        score = converter.parse(record.abc_content, format='abc')
        if transpose != 0:
            score = score.transpose(transpose)
        midi_buffer = io.BytesIO()
        score.write('midi', fp=midi_buffer)
        midi_buffer.seek(0)
        filename = f"{tune_id}.mid"
        return StreamingResponse(
            midi_buffer,
            media_type="audio/midi",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate MIDI: {str(e)}")


class MidiDataResponse(BaseModel):
    """MIDI data with section boundaries for playback."""
    midi_base64: str
    sections: list[dict]
    pickup_beats: float
    default_tempo: int


def _generate_midi_data(abc_content: str, tune_id: str) -> MidiDataResponse:
    """Generate MIDI data response from ABC content."""
    tune, score = parse_abc(abc_content, tune_id, return_score=True)
    midi_buffer = io.BytesIO()
    score.write('midi', fp=midi_buffer)
    midi_bytes = midi_buffer.getvalue()
    midi_b64 = base64.b64encode(midi_bytes).decode('ascii')
    sections = get_section_beat_boundaries(tune)
    return MidiDataResponse(
        midi_base64=midi_b64,
        sections=sections,
        pickup_beats=tune.pickup_beats,
        default_tempo=tune.default_tempo,
    )


@router.get("/tunes/{tune_id}/midi-data", response_model=MidiDataResponse)
async def get_tune_midi_data(tune_id: str):
    """Get MIDI data with section boundaries for in-browser playback."""
    db.init_db()
    record = db.get_tune(tune_id)
    if not record:
        raise HTTPException(status_code=404, detail="Tune not found")
    try:
        return _generate_midi_data(record.abc_content, tune_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate MIDI data: {str(e)}")


class MidiDataRequest(BaseModel):
    """Request body for generating MIDI data from ABC content."""
    abc: str
    id: str | None = None


@router.post("/tunes/midi-data", response_model=MidiDataResponse)
async def generate_midi_data(request: MidiDataRequest):
    """Generate MIDI data from posted ABC content."""
    tune_id = request.id or "pasted"
    try:
        return _generate_midi_data(request.abc, tune_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate MIDI data: {str(e)}")


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


class TuneCreateRequest(BaseModel):
    """Request body for creating a new tune."""
    tune_id: str
    title: str
    abc_content: str
    source: str = "local"
    source_url: str | None = None
    owner: str | None = None
    auto_version: bool = False  # If true, auto-add V2, V3, etc. for duplicates


@router.post("/tunes", response_model=TuneInfo)
async def create_tune(request: TuneCreateRequest, _admin: UserRecord = Depends(require_admin)):
    """Create a new tune in the database.

    If auto_version is True, automatically appends V2, V3, etc. to the title
    and _v2, _v3, etc. to the tune_id if duplicates exist.
    """
    db.init_db()

    if request.auto_version:
        # Use auto-versioning
        try:
            record = db.insert_tune_auto_version(
                tune_id=request.tune_id,
                title=request.title,
                abc_content=request.abc_content,
                source=request.source,
                source_url=request.source_url,
                owner=request.owner
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        # Check if tune already exists
        existing = db.get_tune(request.tune_id)
        if existing:
            raise HTTPException(status_code=409, detail=f"Tune '{request.tune_id}' already exists")

        try:
            record = db.insert_tune(
                tune_id=request.tune_id,
                title=request.title,
                abc_content=request.abc_content,
                source=request.source,
                source_url=request.source_url,
                owner=request.owner
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    _invalidate_tune_cache()
    return _record_to_tune_info(record)


class TuneMetadataUpdate(BaseModel):
    """Request body for updating tune metadata."""
    source: str | None = None
    source_url: str | None = None
    quality: str | None = None  # "high", "medium", or "low"
    owner: str | None = None


@router.patch("/tunes/{tune_id}/metadata", response_model=TuneInfo)
async def update_tune_metadata(tune_id: str, update: TuneMetadataUpdate, _admin: UserRecord = Depends(require_admin)):
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
        source_url=update.source_url,
        quality=quality,
        owner=update.owner,
        increment_version=False  # Don't increment version for metadata-only changes
    )

    _invalidate_tune_cache()
    return _record_to_tune_info(updated)


class RatingRequest(BaseModel):
    """Request body for rating a tune."""
    value: float


@router.post("/tunes/{tune_id}/rate", response_model=TuneInfo)
async def rate_tune(tune_id: str, request: RatingRequest, _user: UserRecord = Depends(require_user)):
    """Rate a tune. Value must be between 0.0 and 5.0."""
    db.init_db()

    try:
        updated = db.add_rating(tune_id, request.value)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not updated:
        raise HTTPException(status_code=404, detail="Tune not found")

    _invalidate_tune_cache()
    return _record_to_tune_info(updated)


@router.delete("/tunes/{tune_id}")
async def delete_tune(tune_id: str, _admin: UserRecord = Depends(require_admin)):
    """Delete a tune from the database."""
    db.init_db()
    deleted = db.delete_tune(tune_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Tune not found")
    _invalidate_tune_cache()
    return {"ok": True}


class TuneUpdate(BaseModel):
    title: str | None = None
    abc_content: str | None = None
    source: str | None = None
    source_url: str | None = None


@router.put("/tunes/{tune_id}", response_model=TuneInfo)
async def update_tune(tune_id: str, update: TuneUpdate, _admin: UserRecord = Depends(require_admin)):
    """Update a tune's title, ABC content, or source info."""
    db.init_db()
    updated = db.update_tune(
        tune_id,
        title=update.title,
        abc_content=update.abc_content,
        source=update.source,
        source_url=update.source_url,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Tune not found")
    _invalidate_tune_cache()
    return _record_to_tune_info(updated)


@router.post("/tunes/sync")
async def sync_tunes(_admin: UserRecord = Depends(require_admin)):
    """Sync database from ABC files in resources/tunes. One-time import tool."""
    results = db.sync_from_files()
    _invalidate_tune_cache()
    return {
        "synced": len(results),
        "inserted": sum(1 for r in results.values() if r == 'inserted'),
        "updated": sum(1 for r in results.values() if r == 'updated'),
        "unchanged": sum(1 for r in results.values() if r == 'unchanged'),
        "details": results
    }


class FetchUrlRequest(BaseModel):
    """Request body for fetching ABC from URL."""
    url: str


@router.post("/tunes/fetch-url", response_model=Tune)
async def fetch_tune_from_url(request: FetchUrlRequest, _user: UserRecord | None = Depends(get_current_user)):
    """Fetch ABC content from a URL, save to database, and return parsed tune.

    Open to everyone — no login required.
    """
    url = request.url.strip()

    # Validate URL
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ('http', 'https'):
            raise HTTPException(status_code=400, detail="URL must use http or https")
        if not parsed.netloc:
            raise HTTPException(status_code=400, detail="Invalid URL")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid URL: {str(e)}")

    # Fetch the ABC content
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()
            abc_content = response.text
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Request timed out")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Failed to fetch URL: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch URL: {str(e)}")

    # Generate an ID from the URL filename or use a default
    filename = parsed.path.split('/')[-1] if parsed.path else 'url-tune'
    tune_id = filename.replace('.abc', '').replace(' ', '_').lower() or 'url-tune'

    # Parse the ABC content
    try:
        tune = parse_abc(abc_content, tune_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse ABC content: {str(e)}")

    # Save to database with auto-versioning
    db.init_db()
    try:
        # Check if exact tune_id already exists
        existing = db.get_tune(tune_id)
        if existing:
            # If same URL, update existing; otherwise create new version
            if existing.source_url == url:
                db.update_tune(
                    tune_id=tune_id,
                    title=tune.title,
                    abc_content=abc_content,
                    source=parsed.netloc,
                    source_url=url
                )
            else:
                # Different source, create new version
                record = db.insert_tune_auto_version(
                    tune_id=tune_id,
                    title=tune.title,
                    abc_content=abc_content,
                    source=parsed.netloc,
                    source_url=url
                )
                # Update tune object with versioned info
                tune = parse_abc(abc_content, record.tune_id)
        else:
            db.insert_tune(
                tune_id=tune_id,
                title=tune.title,
                abc_content=abc_content,
                source=parsed.netloc,
                source_url=url
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    _invalidate_tune_cache()
    return tune
