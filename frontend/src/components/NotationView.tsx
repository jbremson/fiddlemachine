import { useEffect, useRef, useState, useCallback } from 'react';
import * as abcjs from 'abcjs';
import { Tune } from '../types/tune';

interface NotationViewProps {
  tune: Tune | null;
  transpose: number;
  progress: number;
  isPlaying: boolean;
}

interface BarBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  startBeat: number;  // Beat position where this bar starts
  endBeat: number;    // Beat position where this bar ends
}

// Transpose ABC notation by semitones
function transposeAbc(abc: string, semitones: number): string {
  if (semitones === 0) return abc;

  const lines = abc.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    // Check if this is a header line (starts with letter followed by colon)
    if (/^[A-Za-z]:/.test(line.trim())) {
      // Handle K: (key) line specially
      if (line.trim().startsWith('K:')) {
        result.push(transposeKeyLine(line, semitones));
      } else {
        result.push(line);
      }
    } else {
      // This is a music line - transpose the notes
      result.push(transposeMusicLine(line, semitones));
    }
  }

  return result.join('\n');
}

function transposeKeyLine(line: string, semitones: number): string {
  const keyNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const keyFlats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  return line.replace(/^(K:\s*)([A-G])([#b]?)(.*)$/, (match, prefix, keyNote, accidental, suffix) => {
    let index = -1;
    if (accidental === '#') {
      index = keyNotes.indexOf(keyNote + '#');
    } else if (accidental === 'b') {
      index = keyFlats.indexOf(keyNote + 'b');
    } else {
      index = keyNotes.indexOf(keyNote);
    }
    if (index === -1) return match;

    const newIndex = ((index + semitones) % 12 + 12) % 12;
    const useFlats = semitones < 0;
    const newKey = useFlats ? keyFlats[newIndex] : keyNotes[newIndex];

    return prefix + newKey + suffix;
  });
}

function transposeMusicLine(line: string, semitones: number): string {
  const sharpNotes = ['C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B'];
  const flatNotes = ['C', '_D', 'D', '_E', 'E', 'F', '_G', 'G', '_A', 'A', '_B', 'B'];
  const useFlats = semitones < 0;
  const noteArray = useFlats ? flatNotes : sharpNotes;

  // Match ABC notes: optional accidental + note letter + optional octave modifiers
  // But avoid matching inside quoted strings or chord symbols
  return line.replace(/(\^{1,2}|_{1,2}|=)?([A-Ga-g])([,']*)/g, (match, accidental, note, octaveMarkers, offset, fullStr) => {
    // Check if we're inside a chord symbol (between quotes)
    const beforeMatch = fullStr.substring(0, offset);
    const quoteCount = (beforeMatch.match(/"/g) || []).length;
    if (quoteCount % 2 === 1) {
      return match; // Inside quotes, don't transpose
    }

    const isLower = note === note.toLowerCase();
    const baseNote = note.toUpperCase();

    const noteToSemitone: Record<string, number> = {
      'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
    };

    const baseSemitone = noteToSemitone[baseNote];
    if (baseSemitone === undefined) return match;

    let semitoneValue = baseSemitone;

    // Apply input accidentals
    if (accidental === '^') semitoneValue += 1;
    else if (accidental === '^^') semitoneValue += 2;
    else if (accidental === '_') semitoneValue -= 1;
    else if (accidental === '__') semitoneValue -= 2;

    // Transpose
    semitoneValue += semitones;

    // Calculate octave shift
    let octaveShift = 0;
    while (semitoneValue >= 12) {
      semitoneValue -= 12;
      octaveShift += 1;
    }
    while (semitoneValue < 0) {
      semitoneValue += 12;
      octaveShift -= 1;
    }

    // Get new note with accidental
    const newNoteWithAcc = noteArray[semitoneValue];
    let newAccidental = '';
    let newNoteLetter = newNoteWithAcc;

    if (newNoteWithAcc.startsWith('^')) {
      newAccidental = '^';
      newNoteLetter = newNoteWithAcc.substring(1);
    } else if (newNoteWithAcc.startsWith('_')) {
      newAccidental = '_';
      newNoteLetter = newNoteWithAcc.substring(1);
    }

    // Handle case and octave markers
    let finalNote = isLower ? newNoteLetter.toLowerCase() : newNoteLetter.toUpperCase();
    let finalOctave = octaveMarkers || '';

    // Adjust for octave shifts
    if (octaveShift > 0) {
      if (isLower) {
        finalOctave = "'".repeat(octaveShift) + finalOctave;
      } else {
        finalNote = finalNote.toLowerCase();
        finalOctave = "'".repeat(octaveShift - 1) + finalOctave;
      }
    } else if (octaveShift < 0) {
      if (!isLower) {
        finalOctave = ",".repeat(-octaveShift) + finalOctave;
      } else {
        finalNote = finalNote.toUpperCase();
        finalOctave = ",".repeat(-octaveShift - 1) + finalOctave;
      }
    }

    // Keep natural sign if original had one
    if (accidental === '=') {
      newAccidental = '=';
    }

    return newAccidental + finalNote + finalOctave;
  });
}

export function NotationView({ tune, transpose, progress, isPlaying }: NotationViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<SVGRectElement>(null);
  const [barBounds, setBarBounds] = useState<BarBounds[]>([]);
  const [svgDimensions, setSvgDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Parse time signature to get beats per bar
  const getBeatsPerBar = useCallback((): number => {
    if (!tune) return 4;
    const parts = tune.time_signature.split('/');
    if (parts.length !== 2) return 4;
    const numerator = parseInt(parts[0]) || 4;
    const denominator = parseInt(parts[1]) || 4;
    // Convert to quarter note beats
    return numerator * (4 / denominator);
  }, [tune]);

  // Calculate total beats in the tune (with repeats)
  const getTotalBeats = useCallback((): number => {
    if (!tune) return 0;
    let totalBeats = 0;
    tune.sections.forEach(section => {
      const sectionBeats = section.notes.length > 0
        ? Math.max(...section.notes.map(n => n.start_time + n.duration))
        : 0;
      totalBeats += sectionBeats * 2; // Each section plays twice
    });
    return totalBeats;
  }, [tune]);

  // Calculate pickup beats (anacrusis) from the tune data
  const getPickupBeats = useCallback((): number => {
    if (!tune || tune.sections.length === 0) return 0;

    const beatsPerBar = getBeatsPerBar();
    const firstSection = tune.sections[0];

    if (firstSection.notes.length === 0) return 0;

    // Calculate total beats in the section
    const sectionBeats = Math.max(...firstSection.notes.map(n => n.start_time + n.duration));

    // If sectionBeats is not a multiple of beatsPerBar, there's a pickup
    const remainder = sectionBeats % beatsPerBar;
    if (remainder > 0 && remainder < beatsPerBar) {
      // The pickup is the partial bar at the beginning
      return remainder;
    }

    return 0;
  }, [tune, getBeatsPerBar]);

  // Calculate bar bounding boxes from rendered notation
  const calculateBarBounds = useCallback(() => {
    if (!containerRef.current) return [];

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return [];

    const bounds: BarBounds[] = [];
    const beatsPerBar = getBeatsPerBar();
    const pickupBeats = getPickupBeats();

    // Get all bar lines rendered by abcjs
    const barLines = svg.querySelectorAll('.abcjs-bar');
    if (barLines.length === 0) return [];

    // Get staff lines to determine vertical bounds
    const staffGroups = svg.querySelectorAll('.abcjs-staff');

    // Build array of staff vertical ranges
    const staffRanges: { top: number; bottom: number }[] = [];
    staffGroups.forEach((staff) => {
      const rect = staff.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      staffRanges.push({
        top: rect.top - svgRect.top,
        bottom: rect.bottom - svgRect.top
      });
    });

    // Get bar line x positions
    const barPositions: { x: number; staffIndex: number }[] = [];
    const svgRect = svg.getBoundingClientRect();

    barLines.forEach((barLine) => {
      const rect = barLine.getBoundingClientRect();
      const barX = rect.left - svgRect.left + rect.width / 2;
      const barCenterY = rect.top - svgRect.top + rect.height / 2;

      // Find which staff this bar line belongs to
      let staffIndex = 0;
      for (let i = 0; i < staffRanges.length; i++) {
        if (barCenterY >= staffRanges[i].top - 20 && barCenterY <= staffRanges[i].bottom + 20) {
          staffIndex = i;
          break;
        }
      }

      barPositions.push({ x: barX, staffIndex });
    });

    // Sort bar positions by staff index then x position
    barPositions.sort((a, b) => {
      if (a.staffIndex !== b.staffIndex) return a.staffIndex - b.staffIndex;
      return a.x - b.x;
    });

    // Create bar bounds between consecutive bar lines on the same staff
    let currentStaffIndex = -1;
    let previousX = 0;
    let barIndex = 0;
    let currentBeat = 0;

    for (let i = 0; i < barPositions.length; i++) {
      const { x, staffIndex } = barPositions[i];

      if (staffIndex !== currentStaffIndex) {
        // New staff - start fresh
        currentStaffIndex = staffIndex;
        previousX = 0; // Start from left edge for first bar
      }

      if (staffRanges[staffIndex]) {
        const staffRange = staffRanges[staffIndex];
        const padding = 5;

        // Create a bar from previousX to current bar line
        if (previousX < x) {
          let barBeats: number;

          if (barIndex === 0) {
            // First bar is key signature - no beats
            barBeats = 0;
          } else if (barIndex === 1 && pickupBeats > 0) {
            // Second bar (first music bar) is the pickup bar
            barBeats = pickupBeats;
          } else {
            // Regular full bar
            barBeats = beatsPerBar;
          }

          const startBeat = currentBeat;
          const endBeat = currentBeat + barBeats;

          bounds.push({
            x: previousX,
            y: staffRange.top - padding,
            width: x - previousX,
            height: staffRange.bottom - staffRange.top + padding * 2,
            startBeat,
            endBeat
          });

          currentBeat = endBeat;
          barIndex++;
        }
      }

      previousX = x;
    }

    return bounds;
  }, [getBeatsPerBar, getPickupBeats]);

  // Render ABC notation
  useEffect(() => {
    if (!containerRef.current || !tune) {
      setBarBounds([]);
      return;
    }

    // Transpose and render
    const transposedAbc = transposeAbc(tune.abc, transpose);
    abcjs.renderAbc(containerRef.current, transposedAbc, {
      responsive: 'resize',
      add_classes: true,
      staffwidth: 700,
    });

    // Get SVG dimensions for overlay
    const svg = containerRef.current.querySelector('svg');
    if (svg) {
      const rect = svg.getBoundingClientRect();
      setSvgDimensions({ width: rect.width, height: rect.height });

      // Calculate bar bounds after a small delay to ensure rendering is complete
      requestAnimationFrame(() => {
        const bounds = calculateBarBounds();
        setBarBounds(bounds);
      });
    }
  }, [tune, transpose, calculateBarBounds]);

  // Calculate current bar index based on progress and beats
  const getCurrentBarIndex = useCallback((): number => {
    if (barBounds.length <= 1) return -1;

    const totalBeats = getTotalBeats();
    if (totalBeats === 0) return -1;

    const beatsPerBar = getBeatsPerBar();

    // Current beat position based on progress, with a lookahead
    // so the highlight appears slightly before the audio plays
    // Use 75% of a bar as lookahead for good visual anticipation
    const lookaheadBeats = beatsPerBar * 0.75;
    const currentBeat = progress * totalBeats + lookaheadBeats;

    // The notation shows the tune once (not repeated), so we need to map
    // the current beat (which includes repeats) to the notation position
    const singlePassBeats = totalBeats / 2; // Since each section plays twice
    const beatInNotation = currentBeat % singlePassBeats;

    // Find which bar contains this beat
    for (let i = 1; i < barBounds.length; i++) { // Start at 1 to skip key signature bar
      const bar = barBounds[i];
      if (beatInNotation >= bar.startBeat && beatInNotation < bar.endBeat) {
        return i;
      }
    }

    // If at the very end, return last bar
    return barBounds.length - 1;
  }, [progress, barBounds, getTotalBeats, getBeatsPerBar]);

  const currentBarIndex = getCurrentBarIndex();
  const currentBar = currentBarIndex >= 0 ? barBounds[currentBarIndex] : null;
  const showHighlight = (isPlaying || progress > 0) && currentBar !== null;

  if (!tune) {
    return (
      <div className="notation-view empty">
        <p>Select a tune to view notation</p>
      </div>
    );
  }

  const displayKey = transpose !== 0
    ? `(transposed ${transpose > 0 ? '+' : ''}${transpose})`
    : '';

  return (
    <div className="notation-view">
      <h2>{tune.title}</h2>
      <p className="tune-info">
        Key: {tune.key} {displayKey} | Time: {tune.time_signature} | Tempo: {tune.default_tempo} BPM
      </p>
      <div className="notation-wrapper">
        <div ref={containerRef} className="notation-container" />
        {svgDimensions.width > 0 && svgDimensions.height > 0 && (
          <svg
            className="bar-highlight-overlay"
            width={svgDimensions.width}
            height={svgDimensions.height}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
            }}
          >
            {showHighlight && currentBar && (
              <rect
                ref={highlightRef}
                x={currentBar.x}
                y={currentBar.y}
                width={currentBar.width}
                height={currentBar.height}
                className="bar-highlight"
              />
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
