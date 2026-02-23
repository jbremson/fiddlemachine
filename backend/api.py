"""FastAPI routes for tune data."""

from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .abc_parser import parse_abc
from .tune import Tune
from . import database as db

router = APIRouter(prefix="/api")


class TuneInfo(BaseModel):
    """Extended tune info including database metadata."""
    id: str
    title: str
    key: str
    source: str | None = None
    source_url: str | None = None
    quality: str | None = None
    rating: float | None = None
    rating_count: int = 0
    owner: str | None = None
    version: int | None = None


def _record_to_tune_info(record: db.TuneRecord) -> TuneInfo:
    """Convert a TuneRecord to a TuneInfo, parsing ABC for key."""
    try:
        tune = parse_abc(record.abc_content, record.tune_id)
        key = tune.key
    except Exception:
        key = "?"

    return TuneInfo(
        id=record.tune_id,
        title=record.title,
        key=key,
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
    """List all available tunes from the database."""
    db.init_db()
    records = db.get_all_tunes()
    return [_record_to_tune_info(r) for r in records]


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


@router.post("/tunes", response_model=TuneInfo)
async def create_tune(request: TuneCreateRequest):
    """Create a new tune in the database."""
    db.init_db()

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

    return _record_to_tune_info(record)


class TuneMetadataUpdate(BaseModel):
    """Request body for updating tune metadata."""
    source: str | None = None
    source_url: str | None = None
    quality: str | None = None  # "high", "medium", or "low"
    owner: str | None = None


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
        source_url=update.source_url,
        quality=quality,
        owner=update.owner,
        increment_version=False  # Don't increment version for metadata-only changes
    )

    return _record_to_tune_info(updated)


class RatingRequest(BaseModel):
    """Request body for rating a tune."""
    value: float


@router.post("/tunes/{tune_id}/rate", response_model=TuneInfo)
async def rate_tune(tune_id: str, request: RatingRequest):
    """Rate a tune. Value must be between 0.0 and 5.0."""
    db.init_db()

    try:
        updated = db.add_rating(tune_id, request.value)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not updated:
        raise HTTPException(status_code=404, detail="Tune not found")

    return _record_to_tune_info(updated)


@router.post("/tunes/sync")
async def sync_tunes():
    """Sync database from ABC files in resources/tunes. One-time import tool."""
    results = db.sync_from_files()
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
async def fetch_tune_from_url(request: FetchUrlRequest):
    """Fetch ABC content from a URL, save to database, and return parsed tune."""
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

    # Save to database
    db.init_db()
    try:
        db.upsert_tune(
            tune_id=tune_id,
            title=tune.title,
            abc_content=abc_content,
            source=parsed.netloc,
            source_url=url
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return tune
