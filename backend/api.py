"""FastAPI routes for tune data."""

import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .abc_parser import parse_abc, parse_abc_file
from .tune import Tune, TuneSummary

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


@router.get("/tunes", response_model=list[TuneSummary])
async def list_tunes():
    """List all available tunes."""
    tunes = load_all_tunes()
    return [
        TuneSummary(id=t.id, title=t.title, key=t.key)
        for t in tunes.values()
    ]


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
