import { useEffect, useRef, useState } from 'react';
import * as abcjs from 'abcjs';
import { Tune } from '../types/tune';

interface NotationViewProps {
  tune: Tune | null;
  transpose: number;
  progress: number;
  isPlaying: boolean;
  highlightOffset?: number;
}

// Transpose functions
function transposeAbc(abc: string, semitones: number): string {
  if (semitones === 0) return abc;
  const lines = abc.split('\n');
  const result: string[] = [];
  for (const line of lines) {
    if (/^[A-Za-z]:/.test(line.trim())) {
      if (line.trim().startsWith('K:')) result.push(transposeKeyLine(line, semitones));
      else result.push(line);
    } else {
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
    if (accidental === '#') index = keyNotes.indexOf(keyNote + '#');
    else if (accidental === 'b') index = keyFlats.indexOf(keyNote + 'b');
    else index = keyNotes.indexOf(keyNote);
    if (index === -1) return match;
    const newIndex = ((index + semitones) % 12 + 12) % 12;
    return prefix + (semitones < 0 ? keyFlats[newIndex] : keyNotes[newIndex]) + suffix;
  });
}

function transposeMusicLine(line: string, semitones: number): string {
  const sharpNotes = ['C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B'];
  const flatNotes = ['C', '_D', 'D', '_E', 'E', 'F', '_G', 'G', '_A', 'A', '_B', 'B'];
  const noteArray = semitones < 0 ? flatNotes : sharpNotes;
  return line.replace(/(\^{1,2}|_{1,2}|=)?([A-Ga-g])([,']*)/g, (match, accidental, note, octaveMarkers, offset, fullStr) => {
    const beforeMatch = fullStr.substring(0, offset);
    if ((beforeMatch.match(/"/g) || []).length % 2 === 1) return match;
    const isLower = note === note.toLowerCase();
    const baseNote = note.toUpperCase();
    const noteToSemitone: Record<string, number> = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
    const baseSemitone = noteToSemitone[baseNote];
    if (baseSemitone === undefined) return match;
    let semitoneValue = baseSemitone;
    if (accidental === '^') semitoneValue += 1;
    else if (accidental === '^^') semitoneValue += 2;
    else if (accidental === '_') semitoneValue -= 1;
    else if (accidental === '__') semitoneValue -= 2;
    semitoneValue += semitones;
    let octaveShift = 0;
    while (semitoneValue >= 12) { semitoneValue -= 12; octaveShift += 1; }
    while (semitoneValue < 0) { semitoneValue += 12; octaveShift -= 1; }
    const newNoteWithAcc = noteArray[semitoneValue];
    let newAccidental = '';
    let newNoteLetter = newNoteWithAcc;
    if (newNoteWithAcc.startsWith('^')) { newAccidental = '^'; newNoteLetter = newNoteWithAcc.substring(1); }
    else if (newNoteWithAcc.startsWith('_')) { newAccidental = '_'; newNoteLetter = newNoteWithAcc.substring(1); }
    let finalNote = isLower ? newNoteLetter.toLowerCase() : newNoteLetter.toUpperCase();
    let finalOctave = octaveMarkers || '';
    if (octaveShift > 0) {
      if (isLower) finalOctave = "'".repeat(octaveShift) + finalOctave;
      else { finalNote = finalNote.toLowerCase(); finalOctave = "'".repeat(octaveShift - 1) + finalOctave; }
    } else if (octaveShift < 0) {
      if (!isLower) finalOctave = ",".repeat(-octaveShift) + finalOctave;
      else { finalNote = finalNote.toUpperCase(); finalOctave = ",".repeat(-octaveShift - 1) + finalOctave; }
    }
    if (accidental === '=') newAccidental = '=';
    return newAccidental + finalNote + finalOctave;
  });
}

type HighlightVersion = 'off' | 'v1' | 'v2' | 'v3';

interface ZoomLevel {
  label: string;
  staffwidth: number;
}

// V1: Simple direct mapping - no tie handling, just map progress to note index proportionally
function highlightV1(
  _tune: Tune,
  progress: number,
  noteEls: NodeListOf<Element>,
  highlightOffset: number
): number {
  if (noteEls.length === 0) return -1;

  // Simple: map progress directly to SVG element index
  const elementIndex = Math.floor(progress * noteEls.length - highlightOffset);
  return Math.max(0, Math.min(elementIndex, noteEls.length - 1));
}

// V2: Beat-based mapping without tie adjustment - simpler timing calculation
function highlightV2(
  tune: Tune,
  progress: number,
  noteEls: NodeListOf<Element>,
  highlightOffset: number
): number {
  // Flatten all notes with absolute timing
  const allNotes: { start: number; end: number; sectionIdx: number; noteIdx: number }[] = [];
  let timeOffset = 0;

  tune.sections.forEach((section, secIdx) => {
    section.notes.forEach((note, noteIdx) => {
      allNotes.push({
        start: timeOffset + note.start_time,
        end: timeOffset + note.start_time + note.duration,
        sectionIdx: secIdx,
        noteIdx
      });
    });
    // Add section duration (repeat count from section data)
    const sectionDur = section.notes.length > 0
      ? Math.max(...section.notes.map(n => n.start_time + n.duration))
      : 0;
    const repeatCount = section.repeat || 1;
    timeOffset += sectionDur * repeatCount;
  });

  if (allNotes.length === 0) return -1;

  const totalDuration = timeOffset;
  const currentTime = Math.max(0, progress * totalDuration - highlightOffset);

  // Find note at current time
  for (let i = 0; i < allNotes.length; i++) {
    if (currentTime >= allNotes[i].start && currentTime < allNotes[i].end) {
      return Math.min(i, noteEls.length - 1);
    }
  }

  // Fallback: find last note that started
  for (let i = allNotes.length - 1; i >= 0; i--) {
    if (allNotes[i].start <= currentTime) {
      return Math.min(i, noteEls.length - 1);
    }
  }

  return 0;
}

// V3: Beat-based mapping that handles ties correctly
// Maps current beat position to SVG element index, accounting for tied notes
function highlightV3(
  tune: Tune,
  progress: number,
  noteEls: NodeListOf<Element>,
  highlightOffset: number,
  beatsPerMeasure: number = 4
): number {
  // Calculate total duration across all sections, matching player.ts logic
  // The player skips pickup notes on repeat passes, so we must account for that
  let totalBeats = 0;
  const sectionInfos = tune.sections.map(section => {
    const sectionBeats = section.notes.length > 0
      ? Math.max(...section.notes.map(n => n.start_time + n.duration))
      : 0;
    const repeatCount = section.repeat || 1;

    // Detect pickup: if section duration is not a multiple of beatsPerMeasure
    const barsFloat = sectionBeats / beatsPerMeasure;
    const fullBars = Math.floor(barsFloat);
    const pickupBeats = sectionBeats - (fullBars * beatsPerMeasure);
    const hasPickup = pickupBeats > 0 && pickupBeats < beatsPerMeasure;

    // First pass: full section. Subsequent passes: skip pickup
    // Total = sectionBeats + (repeatCount - 1) * (sectionBeats - pickupBeats)
    const repeatDuration = hasPickup ? (sectionBeats - pickupBeats) : sectionBeats;
    const sectionTotalBeats = sectionBeats + (repeatCount - 1) * repeatDuration;
    totalBeats += sectionTotalBeats;

    return { sectionBeats, repeatCount, pickupBeats, hasPickup };
  });

  if (totalBeats === 0) return -1;

  const currentBeat = Math.max(0, progress * totalBeats - highlightOffset);

  // Build a flat list of "visual notes" - notes that correspond to SVG elements
  // Tied notes (consecutive same pitch) are merged into single visual notes
  const visualNotes: { start: number; end: number; svgIndex: number }[] = [];
  let beatOffset = 0;
  let svgIndex = 0;

  for (let secIdx = 0; secIdx < tune.sections.length; secIdx++) {
    const section = tune.sections[secIdx];
    const info = sectionInfos[secIdx];

    for (let pass = 0; pass < info.repeatCount; pass++) {
      // On repeat passes (pass > 0), skip pickup notes to match player.ts
      const skipBeats = (pass > 0 && info.hasPickup) ? info.pickupBeats : 0;

      let i = 0;
      while (i < section.notes.length) {
        const note = section.notes[i];

        // Skip pickup notes on repeat passes
        if (note.start_time < skipBeats) {
          i++;
          continue;
        }

        // Adjust timing: subtract pickup on repeats so section aligns with beat offset
        const adjustedStartTime = note.start_time - skipBeats;
        const noteStart = beatOffset + adjustedStartTime;
        let noteEnd = noteStart + note.duration;

        // Check if this note ties into following notes (same pitch, consecutive timing)
        // Extend the duration to include all tied notes
        let j = i + 1;
        while (j < section.notes.length) {
          const nextNote = section.notes[j];
          const prevNote = section.notes[j - 1];
          // Check if next note is tied from previous (same pitch, starts when previous ends)
          if (nextNote.pitch === prevNote.pitch &&
              Math.abs(prevNote.start_time + prevNote.duration - nextNote.start_time) < 0.01) {
            // Extend the end time (also adjusted for skip)
            const adjustedNextEnd = nextNote.start_time - skipBeats + nextNote.duration;
            noteEnd = beatOffset + adjustedNextEnd;
            j++;
          } else {
            break;
          }
        }

        visualNotes.push({ start: noteStart, end: noteEnd, svgIndex });
        svgIndex++;

        // Skip to the note after the tie chain
        i = j;
      }

      // Add section duration (minus pickup on repeat since we skipped it)
      const repeatDuration = (pass === 0) ? info.sectionBeats : (info.sectionBeats - skipBeats);
      beatOffset += repeatDuration;
    }
  }

  // Find which visual note is active at currentBeat
  for (const vn of visualNotes) {
    if (currentBeat >= vn.start && currentBeat < vn.end) {
      return Math.min(vn.svgIndex, noteEls.length - 1);
    }
  }

  // Fallback: find the last visual note that started before currentBeat
  for (let i = visualNotes.length - 1; i >= 0; i--) {
    if (visualNotes[i].start <= currentBeat) {
      return Math.min(visualNotes[i].svgIndex, noteEls.length - 1);
    }
  }

  return 0;
}

const ZOOM_LEVELS: ZoomLevel[] = [
  { label: '50%', staffwidth: 350 },
  { label: '75%', staffwidth: 525 },
  { label: '100%', staffwidth: 700 },
  { label: '125%', staffwidth: 875 },
  { label: '150%', staffwidth: 1050 },
];

export function NotationView({ tune, transpose, progress, isPlaying, highlightOffset = 0 }: NotationViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastHighlightedRef = useRef<Element | null>(null);
  const [highlightVersion, setHighlightVersion] = useState<HighlightVersion>('v3');
  const [zoomIndex, setZoomIndex] = useState(2); // Default to 100%

  // Render ABC
  useEffect(() => {
    if (!containerRef.current || !tune) return;
    const transposedAbc = transposeAbc(tune.abc, transpose);
    const currentZoom = ZOOM_LEVELS[zoomIndex];
    abcjs.renderAbc(containerRef.current, transposedAbc, {
      responsive: 'resize',
      add_classes: true,
      staffwidth: currentZoom.staffwidth,
    });

    // Debug: log note counts and timing
    const svg = containerRef.current.querySelector('svg');
    if (svg) {
      const noteEls = svg.querySelectorAll('.abcjs-note');
      const dataNotes = tune.sections.reduce((sum, s) => sum + s.notes.length, 0);

      // Count visual notes (accounting for ties)
      let visualCount = 0;
      tune.sections.forEach(section => {
        for (let i = 0; i < section.notes.length; i++) {
          if (i === 0) {
            visualCount++;
          } else {
            const prev = section.notes[i - 1];
            const curr = section.notes[i];
            const isTied = prev.pitch === curr.pitch &&
              Math.abs(prev.start_time + prev.duration - curr.start_time) < 0.01;
            if (!isTied) visualCount++;
          }
        }
      });

      console.log(`${tune.title}: ${noteEls.length} SVG elements, ${dataNotes} data notes, ${visualCount} visual (tie-adjusted), diff=${noteEls.length - visualCount}`);

      // Log section timing info
      tune.sections.forEach((section) => {
        const sectionBeats = section.notes.length > 0
          ? Math.max(...section.notes.map(n => n.start_time + n.duration))
          : 0;
        console.log(`  Section ${section.name}: ${section.notes.length} notes, ${sectionBeats} beats, repeat=${section.repeat || 1}`);
      });
    }
  }, [tune, transpose, zoomIndex]);

  // Update highlighting
  useEffect(() => {
    if (!containerRef.current || !tune) return;
    if (highlightVersion === 'off') {
      if (lastHighlightedRef.current) {
        lastHighlightedRef.current.classList.remove('abcjs-note-playing');
        lastHighlightedRef.current = null;
      }
      return;
    }

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const noteEls = svg.querySelectorAll('.abcjs-note');
    if (noteEls.length === 0) return;

    // Parse beats per measure from time signature (e.g., "3/4" -> 3, "4/4" -> 4)
    const timeParts = tune.time_signature.split('/');
    const beatsPerMeasure = parseInt(timeParts[0]) || 4;

    // Get element index based on selected version
    let elementIndex = -1;
    switch (highlightVersion) {
      case 'v1':
        elementIndex = highlightV1(tune, progress, noteEls, highlightOffset);
        break;
      case 'v2':
        elementIndex = highlightV2(tune, progress, noteEls, highlightOffset);
        break;
      case 'v3':
        elementIndex = highlightV3(tune, progress, noteEls, highlightOffset, beatsPerMeasure);
        break;
    }

    // Update DOM
    if (lastHighlightedRef.current) {
      lastHighlightedRef.current.classList.remove('abcjs-note-playing');
    }

    if (elementIndex >= 0 && elementIndex < noteEls.length) {
      const newEl = noteEls[elementIndex];
      newEl.classList.add('abcjs-note-playing');
      lastHighlightedRef.current = newEl;
    } else {
      lastHighlightedRef.current = null;
    }
  }, [tune, progress, highlightOffset, highlightVersion]);

  // Clear on stop
  useEffect(() => {
    if (!isPlaying && progress === 0 && lastHighlightedRef.current) {
      lastHighlightedRef.current.classList.remove('abcjs-note-playing');
      lastHighlightedRef.current = null;
    }
  }, [isPlaying, progress]);

  if (!tune) {
    return (<div className="notation-view empty"><p>Select a tune to view notation</p></div>);
  }

  const displayKey = transpose !== 0 ? `(transposed ${transpose > 0 ? '+' : ''}${transpose})` : '';

  return (
    <div className="notation-view">
      <h2>{tune.title}</h2>
      <p className="tune-info">
        Key: {tune.key} {displayKey} | Time: {tune.time_signature} | Tempo: {tune.default_tempo} BPM
      </p>
      <div className="notation-controls">
        <div className="zoom-control">
          <label>Zoom: </label>
          <button
            onClick={() => setZoomIndex(Math.max(0, zoomIndex - 1))}
            disabled={zoomIndex === 0}
          >
            -
          </button>
          <span className="zoom-level">{ZOOM_LEVELS[zoomIndex].label}</span>
          <button
            onClick={() => setZoomIndex(Math.min(ZOOM_LEVELS.length - 1, zoomIndex + 1))}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
          >
            +
          </button>
        </div>
        <div className="highlight-controls">
          <label>Highlight: </label>
          <select
            value={highlightVersion}
            onChange={(e) => setHighlightVersion(e.target.value as HighlightVersion)}
          >
            <option value="off">Off</option>
            <option value="v1">V1 (Simple)</option>
            <option value="v2">V2 (Beat-based)</option>
            <option value="v3">V3 (Full timing)</option>
          </select>
        </div>
      </div>
      <div className="notation-wrapper">
        <div ref={containerRef} className="notation-container" />
      </div>
    </div>
  );
}
