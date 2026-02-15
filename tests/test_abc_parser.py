"""Tests for ABC parser."""

import pytest
from backend.abc_parser import parse_abc
from backend.section import detect_sections


SAMPLE_ABC = """X:1
T:Test Tune
M:4/4
L:1/8
K:D
Q:1/4=120
|:D2F2 A2d2|F2A2 d2e2:|
|:f2f2 f2e2|d2B2 A2D2:|
"""


def test_parse_abc_extracts_title():
    tune = parse_abc(SAMPLE_ABC, "test")
    assert tune.title == "Test Tune"


def test_parse_abc_extracts_key():
    tune = parse_abc(SAMPLE_ABC, "test")
    assert tune.key == "D"


def test_parse_abc_extracts_time_signature():
    tune = parse_abc(SAMPLE_ABC, "test")
    assert tune.time_signature == "4/4"


def test_parse_abc_extracts_tempo():
    tune = parse_abc(SAMPLE_ABC, "test")
    assert tune.default_tempo == 120


def test_parse_abc_creates_sections():
    tune = parse_abc(SAMPLE_ABC, "test")
    assert len(tune.sections) >= 1


def test_parse_abc_extracts_notes():
    tune = parse_abc(SAMPLE_ABC, "test")
    all_notes = [note for section in tune.sections for note in section.notes]
    assert len(all_notes) > 0


def test_detect_sections_with_repeats():
    abc = "|:ABCD:|:EFGH:|"
    sections = detect_sections(abc)
    assert len(sections) == 2
    assert sections[0]['name'] == 'A'
    assert sections[1]['name'] == 'B'


def test_detect_sections_fallback():
    abc = "ABCDEFGH"
    sections = detect_sections(abc)
    assert len(sections) == 2
