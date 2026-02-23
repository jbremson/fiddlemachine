"""Pydantic models for tune data."""

from pydantic import BaseModel


class Note(BaseModel):
    """A single note with pitch, duration, and timing."""
    pitch: str  # e.g., "D4", "F#4"
    duration: float  # in beats
    start_time: float  # in beats from section start


class Section(BaseModel):
    """A section of a tune (e.g., A part, B part)."""
    name: str  # e.g., "A", "B"
    start_measure: int
    end_measure: int
    notes: list[Note]
    repeat: int = 1  # Number of times to play this section (1 = no repeat, 2 = repeat once)
    playback_notes: list[Note] | None = None  # Expanded notes for playback (repeats unrolled)


class Tune(BaseModel):
    """Complete tune data."""
    id: str
    title: str
    key: str
    time_signature: str
    default_tempo: int
    abc: str
    sections: list[Section]


class TuneSummary(BaseModel):
    """Summary info for tune list."""
    id: str
    title: str
    key: str
