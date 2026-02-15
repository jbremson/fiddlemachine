import { useEffect, useRef, useState, useCallback } from 'react';
import * as abcjs from 'abcjs';
import { Tune } from '../types/tune';

interface NotationViewProps {
  tune: Tune | null;
  transpose: number;
  progress: number;
  isPlaying: boolean;
  highlightOffset?: number;
}

interface NoteElement {
  element: Element;
  startTime: number;
  endTime: number;
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

// Use note index directly based on progress ratio
// Maps progress to note index, matching player.ts pickup handling
export function NotationView({ tune, transpose, progress, isPlaying, highlightOffset = 0 }: NotationViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [noteElements, setNoteElements] = useState<NoteElement[]>([]);
  const [currentNoteIdx, setCurrentNoteIdx] = useState(-1);

  // Get beats per measure from time signature (matching player.ts)
  const getBeatsPerMeasure = useCallback((): number => {
    if (!tune) return 4;
    const timeParts = tune.time_signature.split('/');
    return parseInt(timeParts[0]) || 4;
  }, [tune]);

  const mapNoteElements = useCallback(() => {
    if (!containerRef.current || !tune) return [];
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return [];
    const noteEls = svg.querySelectorAll('.abcjs-note');
    const elements: NoteElement[] = [];
    tune.sections.forEach(section => {
      section.notes.forEach(note => {
        const idx = elements.length;
        if (idx < noteEls.length) {
          elements.push({
            element: noteEls[idx],
            startTime: note.start_time,
            endTime: note.start_time + note.duration
          });
        }
      });
    });
    return elements;
  }, [tune]);

  useEffect(() => {
    if (!containerRef.current || !tune) {
      setNoteElements([]);
      return;
    }
    const transposedAbc = transposeAbc(tune.abc, transpose);
    abcjs.renderAbc(containerRef.current, transposedAbc, {
      responsive: 'resize',
      add_classes: true,
      staffwidth: 700,
    });
    requestAnimationFrame(() => {
      setNoteElements(mapNoteElements());
    });
  }, [tune, transpose, mapNoteElements]);

  // Build a flat timeline matching player.ts logic exactly
  const getCurrentNoteIndex = useCallback((): number => {
    if (!tune || noteElements.length === 0) return -1;

    const beatsPerMeasure = getBeatsPerMeasure();
    const timeline: { noteIdx: number; progressStart: number; progressEnd: number }[] = [];

    // First pass: calculate total duration matching player.ts
    let totalDuration = 0;
    tune.sections.forEach(section => {
      const sectionBeats = section.notes.length > 0
        ? Math.max(...section.notes.map(n => n.start_time + n.duration))
        : 4;

      // Detect pickup (matching player.ts logic)
      const barsFloat = sectionBeats / beatsPerMeasure;
      const fullBars = Math.floor(barsFloat);
      const pickupBeats = sectionBeats - (fullBars * beatsPerMeasure);
      const hasPickup = pickupBeats > 0 && pickupBeats < beatsPerMeasure;

      // First pass: full section
      totalDuration += sectionBeats;
      // Second pass: section minus pickup (if any)
      totalDuration += hasPickup ? (sectionBeats - pickupBeats) : sectionBeats;
    });

    if (totalDuration === 0) return -1;

    // Second pass: build timeline
    let currentTime = 0;
    let noteOffset = 0;

    tune.sections.forEach(section => {
      const sectionBeats = section.notes.length > 0
        ? Math.max(...section.notes.map(n => n.start_time + n.duration))
        : 4;

      // Detect pickup (matching player.ts logic)
      const barsFloat = sectionBeats / beatsPerMeasure;
      const fullBars = Math.floor(barsFloat);
      const pickupBeats = sectionBeats - (fullBars * beatsPerMeasure);
      const hasPickup = pickupBeats > 0 && pickupBeats < beatsPerMeasure;

      // First pass: all notes
      section.notes.forEach((note, idx) => {
        const startProgress = (currentTime + note.start_time) / totalDuration;
        const endProgress = (currentTime + note.start_time + note.duration) / totalDuration;
        timeline.push({
          noteIdx: noteOffset + idx,
          progressStart: startProgress,
          progressEnd: endProgress
        });
      });
      currentTime += sectionBeats;

      // Second pass: skip pickup notes on repeat (matching player.ts)
      const skipBeats = hasPickup ? pickupBeats : 0;
      section.notes.forEach((note, idx) => {
        // Skip pickup notes on repeat
        if (note.start_time < skipBeats) {
          return;
        }
        const adjustedStart = note.start_time - skipBeats;
        const startProgress = (currentTime + adjustedStart) / totalDuration;
        const endProgress = (currentTime + adjustedStart + note.duration) / totalDuration;
        timeline.push({
          noteIdx: noteOffset + idx,
          progressStart: startProgress,
          progressEnd: endProgress
        });
      });
      currentTime += hasPickup ? (sectionBeats - pickupBeats) : sectionBeats;

      noteOffset += section.notes.length;
    });

    // Apply highlight offset (convert beats to progress)
    const offsetProgress = (highlightOffset / totalDuration);
    const adjustedProgress = Math.max(0, Math.min(1, progress - offsetProgress));

    // Find the note that contains this progress
    for (const entry of timeline) {
      if (adjustedProgress >= entry.progressStart && adjustedProgress < entry.progressEnd) {
        return entry.noteIdx;
      }
    }

    // Find the last note that started before current progress
    let lastIdx = -1;
    for (const entry of timeline) {
      if (entry.progressStart <= adjustedProgress) {
        lastIdx = entry.noteIdx;
      }
    }

    return lastIdx >= 0 ? lastIdx : 0;
  }, [tune, noteElements, progress, highlightOffset, getBeatsPerMeasure]);

  useEffect(() => {
    const newIdx = getCurrentNoteIndex();
    if (newIdx !== currentNoteIdx) {
      if (currentNoteIdx >= 0 && currentNoteIdx < noteElements.length) {
        noteElements[currentNoteIdx].element.classList.remove('abcjs-note-playing');
      }
      if (newIdx >= 0 && newIdx < noteElements.length) {
        noteElements[newIdx].element.classList.add('abcjs-note-playing');
      }
      setCurrentNoteIdx(newIdx);
    }
  }, [getCurrentNoteIndex, currentNoteIdx, noteElements]);

  useEffect(() => {
    if (!isPlaying && progress === 0) {
      noteElements.forEach(ne => ne.element.classList.remove('abcjs-note-playing'));
      setCurrentNoteIdx(-1);
    }
  }, [isPlaying, progress, noteElements]);

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
      <div className="notation-wrapper">
        <div ref={containerRef} className="notation-container" />
      </div>
    </div>
  );
}
