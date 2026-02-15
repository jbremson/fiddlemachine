"""ABC notation parser using music21."""

import re
from music21 import converter, meter, key, tempo, note, stream

from .tune import Tune, Section, Note
from .section import detect_sections


def parse_abc(abc_content: str, tune_id: str) -> Tune:
    """
    Parse ABC notation and return structured tune data.

    Args:
        abc_content: ABC notation string
        tune_id: Unique identifier for the tune

    Returns:
        Tune object with parsed note data
    """
    # Parse with music21
    score = converter.parse(abc_content, format='abc')

    # Extract metadata
    title = _extract_title(abc_content)
    key_sig = _extract_key(score, abc_content)
    time_sig = _extract_time_signature(score, abc_content)
    default_tempo = _extract_tempo(score, abc_content)

    # Get all notes from the score
    all_notes = _extract_notes(score, time_sig)

    # Detect sections
    section_info = detect_sections(abc_content)

    # Assign notes to sections
    sections = _assign_notes_to_sections(all_notes, section_info, time_sig)

    return Tune(
        id=tune_id,
        title=title,
        key=key_sig,
        time_signature=time_sig,
        default_tempo=default_tempo,
        abc=abc_content,
        sections=sections
    )


def _extract_title(abc: str) -> str:
    """Extract title from T: field."""
    match = re.search(r'^T:\s*(.+)$', abc, re.MULTILINE)
    return match.group(1).strip() if match else "Untitled"


def _extract_key(score: stream.Score, abc: str) -> str:
    """Extract key signature."""
    # Try from music21
    for element in score.recurse():
        if isinstance(element, key.KeySignature):
            return element.asKey().tonic.name + (" minor" if element.mode == 'minor' else "")
        if isinstance(element, key.Key):
            mode_str = " minor" if element.mode == 'minor' else ""
            return element.tonic.name + mode_str

    # Fallback to ABC header
    match = re.search(r'^K:\s*(\w+)', abc, re.MULTILINE)
    return match.group(1) if match else "C"


def _extract_time_signature(score: stream.Score, abc: str) -> str:
    """Extract time signature."""
    for element in score.recurse():
        if isinstance(element, meter.TimeSignature):
            return element.ratioString

    # Fallback to ABC header
    match = re.search(r'^M:\s*(\S+)', abc, re.MULTILINE)
    return match.group(1) if match else "4/4"


def _extract_tempo(score: stream.Score, abc: str) -> int:
    """Extract tempo in BPM."""
    for element in score.recurse():
        if isinstance(element, tempo.MetronomeMark):
            return int(element.number)

    # Fallback to ABC header Q: field
    match = re.search(r'^Q:\s*.*?(\d+)', abc, re.MULTILINE)
    if match:
        return int(match.group(1))

    # Default tempo for fiddle tunes
    return 120


def _extract_notes(score: stream.Score, time_sig: str) -> list[dict]:
    """Extract all notes with timing information."""
    notes = []
    beats_per_measure = _get_beats_per_measure(time_sig)

    for element in score.recurse().notes:
        if isinstance(element, note.Note):
            # Get pitch with octave
            pitch_name = element.pitch.name
            octave = element.pitch.octave
            pitch_str = f"{pitch_name}{octave}"

            # Duration in quarter notes
            duration = element.quarterLength

            # Get absolute start time in quarter notes from beginning
            start_time = element.getOffsetInHierarchy(score)

            # Calculate measure number
            measure_num = int(start_time / beats_per_measure) + 1

            notes.append({
                'pitch': pitch_str,
                'duration': duration,
                'start_time': start_time,
                'measure': measure_num
            })

    return notes


def _get_beats_per_measure(time_sig: str) -> float:
    """Get beats per measure from time signature."""
    try:
        parts = time_sig.split('/')
        numerator = int(parts[0])
        denominator = int(parts[1])
        # Return in quarter notes
        return numerator * (4 / denominator)
    except (ValueError, IndexError):
        return 4.0


def _assign_notes_to_sections(
    all_notes: list[dict],
    section_info: list[dict],
    time_sig: str
) -> list[Section]:
    """Assign notes to their respective sections."""
    if not section_info:
        # Single section with all notes
        return [Section(
            name="Full",
            start_measure=1,
            end_measure=max(n['measure'] for n in all_notes) if all_notes else 1,
            notes=[Note(
                pitch=n['pitch'],
                duration=n['duration'],
                start_time=n['start_time']
            ) for n in all_notes]
        )]

    sections = []
    beats_per_measure = _get_beats_per_measure(time_sig)

    for info in section_info:
        section_notes = []
        section_start_time = (info['start_measure'] - 1) * beats_per_measure

        for n in all_notes:
            if info['start_measure'] <= n['measure'] <= info['end_measure']:
                # Adjust start time relative to section start
                relative_start = n['start_time'] - section_start_time
                section_notes.append(Note(
                    pitch=n['pitch'],
                    duration=n['duration'],
                    start_time=relative_start
                ))

        sections.append(Section(
            name=info['name'],
            start_measure=info['start_measure'],
            end_measure=info['end_measure'],
            notes=section_notes,
            repeat=info.get('repeat', 1)
        ))

    return sections


def parse_abc_file(filepath: str) -> Tune:
    """Parse an ABC file and return a Tune object."""
    import os
    tune_id = os.path.splitext(os.path.basename(filepath))[0]

    with open(filepath, 'r') as f:
        abc_content = f.read()

    return parse_abc(abc_content, tune_id)
