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

    # Generate expanded playback notes (repeats unrolled)
    sections = _expand_playback_notes(sections)

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

            # Use music21's measure number (handles pickups correctly)
            # Keep measure 0 for pickups, don't convert to 1
            measure_num = element.measureNumber if element.measureNumber is not None else 0

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

    # Sort notes by start time
    sorted_notes = sorted(all_notes, key=lambda n: n['start_time'])

    if not sorted_notes:
        return [Section(name=info['name'], start_measure=info['start_measure'],
                       end_measure=info['end_measure'], notes=[], repeat=info.get('repeat', 1))
                for info in section_info]

    # music21 parses with repeats expanded, giving us more measures than section_info describes.
    # For a tune with sections A (measures 1-17) and B (measures 18-34), music21 gives
    # measures 0-37 (0=pickup, then repeats expanded: 1-17, 1-17, 18-34, 18-34).
    #
    # Strategy: Use the measure numbers from music21 to assign notes to sections.
    # - Measure 0 (pickup) goes to the first section
    # - Notes are assigned based on which section's measure range they fall into
    # - For expanded repeats, we take the first occurrence of each section

    # Calculate total measures per section
    total_section_measures = sum(info['end_measure'] - info['start_measure'] + 1 for info in section_info)

    # Find the measure offset where music21 starts repeating
    # After playing through once (measures 0 to end_of_last_section), it repeats
    last_section_end = section_info[-1]['end_measure']

    # Find beat boundaries for each section by looking at measure numbers
    # Section A ends where its last measure ends, Section B starts at the first note
    # of the next section's start measure
    #
    # Strategy: For each section boundary, find the beat position where the sections divide

    # Build a map of measure -> first note beat position
    measure_start_beats = {}
    for n in sorted_notes:
        m = n['measure']
        if m not in measure_start_beats or n['start_time'] < measure_start_beats[m]:
            measure_start_beats[m] = n['start_time']

    # Calculate split points between sections
    # For section i, its end is just before section i+1's start
    total_beats = max(n['start_time'] + n['duration'] for n in sorted_notes)
    num_sections = len(section_info)

    # Find beat boundaries for each section
    section_beat_ranges = []
    for i, info in enumerate(section_info):
        if i == 0:
            # First section starts at beat 0
            start_beat = 0
        else:
            # Section starts where previous section ended
            start_beat = section_beat_ranges[-1][1]

        if i == num_sections - 1:
            # Last section ends at total_beats
            end_beat = total_beats
        else:
            # Find where this section ends based on next section's start measure
            next_start_measure = section_info[i + 1]['start_measure']

            # Detect if tune has a pickup bar by checking measure 0 duration
            # If measure 0 has less than a full bar's worth of beats before measure 1,
            # it's a pickup and music21's measure numbers match section detection
            has_pickup = False
            if 0 in measure_start_beats and 1 in measure_start_beats:
                measure_0_duration = measure_start_beats[1] - measure_start_beats[0]
                beats_per_measure = _get_beats_per_measure(time_sig)
                has_pickup = measure_0_duration < beats_per_measure

            # Check if the next section has a pickup (notes between :| and |: or :|:)
            # If so, the pickup notes belong to the next section, not this one
            # We need to find where the pickup starts
            next_has_pickup = info.get('next_has_pickup', False)

            # Look for the first note in the next section's start measure
            # - If has_pickup (tune starts with pickup), music21's measure numbers match section detection
            # - If no pickup, measure 0 = bar 1, so we need measure - 1
            end_beat = None

            # Calculate the measure offset for music21's numbering
            # If tune has pickup, music21 measure N = section measure N
            # If no pickup, music21 measure N-1 = section measure N
            m21_offset = 0 if has_pickup else -1

            # The next section's pickup (if any) should belong to that section
            # So we end this section where the next section's pickup starts
            if next_has_pickup:
                # Next section has pickup - the pickup measure in m21 is one before next section's first full bar
                # Section measure 9 -> m21 measure 8 (with offset -1)
                # The pickup is in m21 measure 8, so we end at beat where m21 measure 8 starts
                pickup_m21_measure = next_start_measure + m21_offset
                check_order = [pickup_m21_measure, pickup_m21_measure - 1, pickup_m21_measure + 1]
            else:
                # No pickup - end at the next section's start measure
                target_measure = next_start_measure + m21_offset
                check_order = [target_measure, target_measure - 1, target_measure + 1]

            for check_measure in check_order:
                if check_measure in measure_start_beats:
                    end_beat = measure_start_beats[check_measure]
                    break
            if end_beat is None:
                # Fallback: divide evenly
                end_beat = total_beats * (i + 1) / num_sections

        section_beat_ranges.append((start_beat, end_beat))

    sections = []
    for i, info in enumerate(section_info):
        start_beat, end_beat = section_beat_ranges[i]

        notes_in_section = []
        for n in sorted_notes:
            note_start = n['start_time']
            if start_beat <= note_start < end_beat:
                notes_in_section.append(n)

        section_notes = []
        if notes_in_section:
            # Find the earliest start time in this section to use as offset
            section_start_time = min(n['start_time'] for n in notes_in_section)

            for n in notes_in_section:
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


def _expand_playback_notes(sections: list[Section]) -> list[Section]:
    """
    Expand section notes for playback by unrolling repeats.

    For sections with repeat > 1, duplicate the notes with adjusted timing
    so playback doesn't need to handle repeat logic.
    """
    expanded_sections = []

    for section in sections:
        if section.repeat <= 1 or not section.notes:
            # No repeat, playback_notes same as notes
            expanded_sections.append(Section(
                name=section.name,
                start_measure=section.start_measure,
                end_measure=section.end_measure,
                notes=section.notes,
                repeat=section.repeat,
                playback_notes=section.notes.copy()
            ))
            continue

        # Calculate section duration
        section_duration = max(n.start_time + n.duration for n in section.notes)

        # Detect pickup notes (partial bar at the start)
        # These are notes that occur before the first full beat
        # Pickup is detected if total duration isn't a clean multiple of typical bar length
        # For simplicity, check if any notes start before beat 1
        pickup_notes = [n for n in section.notes if n.start_time < 1.0]
        has_pickup = len(pickup_notes) > 0 and section.notes[0].start_time > 0

        # Actually, better detection: if section doesn't start at 0, no pickup
        # If it starts at 0 but first note is very short, that might be a pickup
        # Let's use a simpler heuristic: section duration mod beats_per_bar

        playback_notes = []
        current_offset = 0.0

        for rep in range(section.repeat):
            # On first play, include all notes
            # On subsequent plays, skip pickup notes (they're replaced by the ending)
            skip_beats = 0.0

            if rep > 0 and has_pickup:
                # Find where the "real" start is (after pickup)
                # Pickup notes are typically the few notes at the very beginning
                # that fill out an incomplete bar
                first_full_beat = min(n.start_time for n in section.notes if n.start_time >= 1.0) if any(n.start_time >= 1.0 for n in section.notes) else 0
                skip_beats = first_full_beat

            for note in section.notes:
                if note.start_time < skip_beats:
                    continue

                playback_notes.append(Note(
                    pitch=note.pitch,
                    duration=note.duration,
                    start_time=current_offset + note.start_time - skip_beats
                ))

            # Advance offset by section duration (minus skipped pickup if applicable)
            if rep == 0:
                current_offset += section_duration
            else:
                current_offset += section_duration - skip_beats

        expanded_sections.append(Section(
            name=section.name,
            start_measure=section.start_measure,
            end_measure=section.end_measure,
            notes=section.notes,
            repeat=section.repeat,
            playback_notes=playback_notes
        ))

    return expanded_sections


def parse_abc_file(filepath: str) -> Tune:
    """Parse an ABC file and return a Tune object."""
    import os
    tune_id = os.path.splitext(os.path.basename(filepath))[0]

    with open(filepath, 'r') as f:
        abc_content = f.read()

    return parse_abc(abc_content, tune_id)
