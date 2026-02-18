#!/usr/bin/env python3
"""
Highlight Risk Assessment Tool

Analyzes ABC files and assigns risk levels for highlight synchronization failures.
"""

import os
import re
import sys
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

from .abc_parser import parse_abc_file
from .section import detect_sections


class RiskLevel(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


@dataclass
class RiskFactor:
    name: str
    level: RiskLevel
    description: str


@dataclass
class RiskAssessment:
    file_path: str
    title: str
    overall_risk: RiskLevel
    factors: list[RiskFactor]
    svg_note_diff: int | None = None  # Estimated SVG vs visual note difference


def assess_abc_file(file_path: str) -> RiskAssessment:
    """Analyze an ABC file and return a risk assessment."""
    with open(file_path, 'r') as f:
        abc_content = f.read()

    factors: list[RiskFactor] = []

    # Extract basic metadata
    title_match = re.search(r'^T:\s*(.+)$', abc_content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else os.path.basename(file_path)

    time_match = re.search(r'^M:\s*(\S+)', abc_content, re.MULTILINE)
    time_sig = time_match.group(1) if time_match else "4/4"

    # Factor 1: Time signature
    if time_sig == "4/4" or time_sig == "C":
        factors.append(RiskFactor(
            name="Time Signature",
            level=RiskLevel.LOW,
            description=f"{time_sig} - standard reel time"
        ))
    elif time_sig == "3/4":
        factors.append(RiskFactor(
            name="Time Signature",
            level=RiskLevel.MEDIUM,
            description=f"{time_sig} - waltz time, pickup detection may differ"
        ))
    else:
        factors.append(RiskFactor(
            name="Time Signature",
            level=RiskLevel.HIGH,
            description=f"{time_sig} - non-standard, pickup logic may fail"
        ))

    # Factor 2: Repeat markers
    has_repeat_start = '|:' in abc_content
    has_repeat_end = ':|' in abc_content

    if has_repeat_start and has_repeat_end:
        factors.append(RiskFactor(
            name="Repeat Markers",
            level=RiskLevel.LOW,
            description="Standard |: :| repeat markers present"
        ))
    elif has_repeat_start or has_repeat_end:
        factors.append(RiskFactor(
            name="Repeat Markers",
            level=RiskLevel.MEDIUM,
            description="Partial repeat markers - may cause section detection issues"
        ))
    else:
        factors.append(RiskFactor(
            name="Repeat Markers",
            level=RiskLevel.HIGH,
            description="No repeat markers - falls back to half-split heuristic"
        ))

    # Factor 3: Section detection method
    section_info = detect_sections(abc_content)
    if section_info:
        section_names = [s['name'] for s in section_info]
        repeats = [s.get('repeat', 1) for s in section_info]
        if all(r == 1 for r in repeats):
            factors.append(RiskFactor(
                name="Section Detection",
                level=RiskLevel.MEDIUM,
                description=f"Sections {section_names} with repeat=1 (half-split fallback)"
            ))
        else:
            factors.append(RiskFactor(
                name="Section Detection",
                level=RiskLevel.LOW,
                description=f"Sections {section_names} with repeats {repeats}"
            ))
    else:
        factors.append(RiskFactor(
            name="Section Detection",
            level=RiskLevel.HIGH,
            description="No sections detected"
        ))

    # Factor 4: Pickup notes
    # Look at music lines to detect if tune starts with partial bar
    music_lines = []
    for line in abc_content.split('\n'):
        stripped = line.strip()
        if stripped and not re.match(r'^[A-Z]:', stripped):
            music_lines.append(stripped)
    music = ' '.join(music_lines)

    # Detect pickup by looking for notes between |: and the next |
    # Pattern like "|:AA|" means AA are pickup notes
    # Pattern like "|:AFDF AFDF|" means starting on a full bar
    # Also check for notes before any barline (e.g., "D>E|F2...")

    has_pickup = False
    pickup_description = ""

    # Check pattern 1: notes before any barline (no repeat marker)
    first_any_bar = re.search(r'\|', music)
    if first_any_bar:
        before_first_bar = music[:first_any_bar.start()].strip()
        # Remove chord symbols like "D" that appear in quotes
        before_first_bar = re.sub(r'"[^"]*"', '', before_first_bar)
        if re.search(r'[A-Ga-gz]', before_first_bar):
            has_pickup = True
            pickup_description = f"Pickup before first bar: {before_first_bar[:20]}..."

    # Check pattern 2: notes between |: and next | (short pickup after repeat marker)
    if not has_pickup:
        repeat_start = re.search(r'\|:([^|]*)\|', music)
        if repeat_start:
            between_bars = repeat_start.group(1).strip()
            # Remove chord symbols
            between_bars = re.sub(r'"[^"]*"', '', between_bars)
            # Count notes - pickups are typically short (1-4 notes)
            notes_in_first_bar = len(re.findall(r'[A-Ga-gz]', between_bars))
            # Get beats per measure from time sig for comparison
            try:
                time_parts = time_sig.split('/')
                num = int(time_parts[0])
                denom = int(time_parts[1])
                # In 4/4 with L:1/8, a full bar is 8 notes; pickup would be less
                expected_notes_per_bar = num * (8 // denom) if denom <= 8 else num
                if notes_in_first_bar < expected_notes_per_bar * 0.5:
                    has_pickup = True
                    pickup_description = f"Pickup after |: ({notes_in_first_bar} notes)"
            except (ValueError, IndexError):
                pass

    if has_pickup:
        factors.append(RiskFactor(
            name="Pickup Notes",
            level=RiskLevel.MEDIUM,
            description=pickup_description
        ))
    elif first_any_bar:
        factors.append(RiskFactor(
            name="Pickup Notes",
            level=RiskLevel.LOW,
            description="Starts on full bar - no pickup timing issues"
        ))
    else:
        factors.append(RiskFactor(
            name="Pickup Notes",
            level=RiskLevel.HIGH,
            description="Cannot detect bar structure"
        ))

    # Factor 5: Complex notation (ties, dotted rhythms, triplets)
    has_ties = '-' in music or '(' in music  # ties like E6- or slurs
    has_dotted = '>' in music or '<' in music  # dotted rhythms
    has_triplets = re.search(r'\(\d', music)  # triplet notation like (3

    complexity_issues = []
    if has_ties:
        complexity_issues.append("ties/slurs")
    if has_dotted:
        complexity_issues.append("dotted rhythms")
    if has_triplets:
        complexity_issues.append("triplets")

    if complexity_issues:
        level = RiskLevel.MEDIUM if len(complexity_issues) == 1 else RiskLevel.HIGH
        factors.append(RiskFactor(
            name="Note Complexity",
            level=level,
            description=f"Contains: {', '.join(complexity_issues)}"
        ))
    else:
        factors.append(RiskFactor(
            name="Note Complexity",
            level=RiskLevel.LOW,
            description="Simple note durations"
        ))

    # Factor 6: Chords (notes in brackets)
    has_chords = bool(re.search(r'\[[A-Ga-g].*[A-Ga-g]\]', music))
    if has_chords:
        factors.append(RiskFactor(
            name="Chords",
            level=RiskLevel.HIGH,
            description="Contains chords - SVG count may mismatch"
        ))

    # Factor 7: Grace notes
    has_grace = bool(re.search(r'\{[A-Ga-g]+\}', music))
    if has_grace:
        factors.append(RiskFactor(
            name="Grace Notes",
            level=RiskLevel.MEDIUM,
            description="Contains grace notes - may affect SVG count"
        ))

    # Try parsing to get actual note counts
    svg_diff = None
    try:
        tune = parse_abc_file(file_path)
        total_notes = sum(len(s.notes) for s in tune.sections)

        # Estimate visual notes (accounting for ties)
        visual_count = 0
        for section in tune.sections:
            for i, note in enumerate(section.notes):
                if i == 0:
                    visual_count += 1
                else:
                    prev = section.notes[i - 1]
                    is_tied = (prev.pitch == note.pitch and
                               abs(prev.start_time + prev.duration - note.start_time) < 0.01)
                    if not is_tied:
                        visual_count += 1

        # We can't know exact SVG count without rendering, but we can flag potential issues
        if total_notes != visual_count:
            svg_diff = total_notes - visual_count
            factors.append(RiskFactor(
                name="Tie Adjustment",
                level=RiskLevel.LOW,
                description=f"{total_notes} parsed notes, {visual_count} after tie merging"
            ))
    except Exception as e:
        factors.append(RiskFactor(
            name="Parse Error",
            level=RiskLevel.HIGH,
            description=f"Failed to parse: {str(e)}"
        ))

    # Calculate overall risk
    high_count = sum(1 for f in factors if f.level == RiskLevel.HIGH)
    medium_count = sum(1 for f in factors if f.level == RiskLevel.MEDIUM)

    if high_count >= 2:
        overall = RiskLevel.HIGH
    elif high_count == 1 or medium_count >= 3:
        overall = RiskLevel.MEDIUM
    else:
        overall = RiskLevel.LOW

    return RiskAssessment(
        file_path=file_path,
        title=title,
        overall_risk=overall,
        factors=factors,
        svg_note_diff=svg_diff
    )


def assess_directory(directory: str) -> list[RiskAssessment]:
    """Assess all ABC files in a directory."""
    assessments = []
    path = Path(directory)

    for abc_file in sorted(path.glob('*.abc')):
        assessment = assess_abc_file(str(abc_file))
        assessments.append(assessment)

    return assessments


def print_assessment(assessment: RiskAssessment, verbose: bool = False) -> None:
    """Print a formatted risk assessment."""
    # Color codes for terminal
    colors = {
        RiskLevel.LOW: '\033[92m',     # Green
        RiskLevel.MEDIUM: '\033[93m',  # Yellow
        RiskLevel.HIGH: '\033[91m',    # Red
    }
    reset = '\033[0m'

    color = colors[assessment.overall_risk]
    print(f"\n{assessment.title}")
    print(f"  File: {os.path.basename(assessment.file_path)}")
    print(f"  Overall Risk: {color}{assessment.overall_risk.value}{reset}")

    if verbose:
        print("  Factors:")
        for factor in assessment.factors:
            factor_color = colors[factor.level]
            print(f"    - {factor.name}: {factor_color}{factor.level.value}{reset}")
            print(f"      {factor.description}")


def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description='Assess ABC files for highlight synchronization risk')
    parser.add_argument('path', nargs='?', default='resources/tunes',
                        help='ABC file or directory to assess')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='Show detailed factor breakdown')
    parser.add_argument('--summary', action='store_true',
                        help='Show summary only')

    args = parser.parse_args()

    path = Path(args.path)
    if not path.exists():
        print(f"Error: {path} does not exist")
        sys.exit(1)

    if path.is_file():
        assessments = [assess_abc_file(str(path))]
    else:
        assessments = assess_directory(str(path))

    if not assessments:
        print("No ABC files found")
        sys.exit(1)

    # Sort by risk level (HIGH first)
    risk_order = {RiskLevel.HIGH: 0, RiskLevel.MEDIUM: 1, RiskLevel.LOW: 2}
    assessments.sort(key=lambda a: risk_order[a.overall_risk])

    if args.summary:
        print("\nHighlight Risk Summary")
        print("=" * 50)
        for a in assessments:
            colors = {RiskLevel.LOW: '\033[92m', RiskLevel.MEDIUM: '\033[93m', RiskLevel.HIGH: '\033[91m'}
            reset = '\033[0m'
            print(f"  {colors[a.overall_risk]}{a.overall_risk.value:6}{reset}  {a.title}")
    else:
        print("\nHighlight Risk Assessment")
        print("=" * 50)
        for assessment in assessments:
            print_assessment(assessment, verbose=args.verbose)

    # Print counts
    print("\n" + "=" * 50)
    high = sum(1 for a in assessments if a.overall_risk == RiskLevel.HIGH)
    medium = sum(1 for a in assessments if a.overall_risk == RiskLevel.MEDIUM)
    low = sum(1 for a in assessments if a.overall_risk == RiskLevel.LOW)
    print(f"Total: {len(assessments)} files  |  HIGH: {high}  MEDIUM: {medium}  LOW: {low}")


if __name__ == '__main__':
    main()
