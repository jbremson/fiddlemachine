"""Section detection logic for ABC tunes."""

import re


def detect_sections(abc: str) -> list[dict]:
    """
    Detect sections in ABC notation.

    Looks for:
    1. P:A and P:B part headers
    2. |: and :| repeat markers
    3. Fallback: split tune in half

    Returns list of section dicts with name, measure range, and repeat count.
    """
    lines = abc.split('\n')
    music_lines = []

    # Extract music lines (not headers)
    for line in lines:
        stripped = line.strip()
        if stripped and not re.match(r'^[A-Z]:', stripped):
            music_lines.append(stripped)

    music = ' '.join(music_lines)

    # Check for explicit part markers (P:A, P:B)
    part_matches = list(re.finditer(r'\[P:([AB])\]', abc))
    if len(part_matches) >= 2:
        # Has explicit part markers
        return _sections_from_part_markers(abc, part_matches)

    # Check for repeat structures
    sections = _sections_from_repeats(music)
    if sections:
        return sections

    # Fallback: split in half by measures
    return _sections_from_half_split(music)


def _sections_from_part_markers(abc: str, matches: list) -> list[dict]:
    """Extract sections from P:A/P:B markers."""
    sections = []
    for i, match in enumerate(matches):
        name = match.group(1)
        start = 1 if i == 0 else sections[-1]['end_measure'] + 1
        # Count measures until next section or end
        end = start + 3  # Default 4 measures
        sections.append({
            'name': name,
            'start_measure': start,
            'end_measure': end,
            'repeat': 2  # Assume parts repeat
        })
    return sections


def _sections_from_repeats(music: str) -> list[dict]:
    """Extract sections from repeat markers |: and :|"""
    # Find all repeat sections by matching |: ... :|

    sections = []
    current_measure = 1
    section_start_measure = 1
    section_count = 0

    # Split by barlines but keep the markers
    # Match: |: (start repeat), :| (end repeat), :||: (end and start), || (double bar), | (single bar)
    tokens = re.split(r'(\:\|\|?\:|\|\:|\:\||\|\||\|)', music)

    just_ended_section = False
    # Track if next section has a pickup (notes between :|: and the next |)
    next_section_has_pickup = False

    for i, token in enumerate(tokens):
        token = token.strip()
        if not token:
            continue

        if token == '|:':
            # Start of repeat section - mark where this section begins
            # But only if we didn't just end a section (which already set the next start)
            if not just_ended_section:
                section_start_measure = current_measure
            just_ended_section = False
        elif token == ':|' or token == ':||:' or token == ':|:':
            # End of repeat section
            section_count += 1
            name = 'A' if section_count == 1 else 'B' if section_count == 2 else f'C{section_count-2}'

            # Check if next section has a pickup by looking at content between this marker and next |
            next_section_has_pickup = False
            if token in (':||:', ':|:'):
                # Look ahead for content before next barline
                for j in range(i + 1, len(tokens)):
                    next_token = tokens[j].strip()
                    if not next_token:
                        continue
                    if next_token in ('|', '||', '|:', ':|', ':||:', ':|:'):
                        break
                    # There's musical content before the next barline - it's a pickup
                    next_section_has_pickup = True
                    break

            sections.append({
                'name': name,
                'start_measure': section_start_measure,
                'end_measure': current_measure,  # Include the current measure (last bar before :|)
                'repeat': 2,  # Repeat sections play twice
                'next_has_pickup': next_section_has_pickup  # Signal to parser
            })
            # Next section starts at next measure, and we move past this bar
            current_measure += 1
            section_start_measure = current_measure
            just_ended_section = True
        elif token in ('|', '||'):
            # Regular barline - increment measure
            current_measure += 1
        # else: it's music content, ignore for section detection

    # If we found sections, return them
    if sections:
        return sections

    return []


def _sections_from_half_split(music: str) -> list[dict]:
    """Split tune in half as fallback."""
    barlines = re.findall(r'\|', music)
    total_measures = max(len(barlines), 8)
    mid = total_measures // 2

    return [
        {'name': 'A', 'start_measure': 1, 'end_measure': mid, 'repeat': 1},
        {'name': 'B', 'start_measure': mid + 1, 'end_measure': total_measures, 'repeat': 1}
    ]
