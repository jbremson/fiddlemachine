import { useEffect, useRef } from 'react';
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

// V1: Simple approach - use refs to store elements, direct DOM manipulation
export function NotationViewV1({ tune, transpose, progress, isPlaying, highlightOffset: _highlightOffset = 0 }: NotationViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const noteElementsRef = useRef<Element[]>([]);
  const lastHighlightedRef = useRef<number>(-1);

  // Render ABC and capture note elements
  useEffect(() => {
    if (!containerRef.current || !tune) {
      noteElementsRef.current = [];
      return;
    }
    const transposedAbc = transposeAbc(tune.abc, transpose);
    abcjs.renderAbc(containerRef.current, transposedAbc, {
      responsive: 'resize',
      add_classes: true,
      staffwidth: 700,
    });

    // Get note elements after render
    requestAnimationFrame(() => {
      const svg = containerRef.current?.querySelector('svg');
      if (svg) {
        noteElementsRef.current = Array.from(svg.querySelectorAll('.abcjs-note'));
      }
    });
  }, [tune, transpose]);

  // Update highlighting based on progress
  useEffect(() => {
    if (!tune || noteElementsRef.current.length === 0) return;

    // Calculate total notes
    let totalNotes = 0;
    tune.sections.forEach(section => {
      totalNotes += section.notes.length;
    });

    if (totalNotes === 0) return;

    // Simple: map progress directly to note index (each section plays twice)
    // Total "note plays" = totalNotes * 2 (AABB form)
    const totalPlays = totalNotes * 2;
    const adjustedProgress = Math.max(0, Math.min(1, progress));
    const playIndex = Math.floor(adjustedProgress * totalPlays);

    // Map play index to actual note element (modulo totalNotes)
    const noteIdx = playIndex % totalNotes;

    // Update highlighting
    if (noteIdx !== lastHighlightedRef.current) {
      // Remove old highlight
      if (lastHighlightedRef.current >= 0 && lastHighlightedRef.current < noteElementsRef.current.length) {
        noteElementsRef.current[lastHighlightedRef.current].classList.remove('abcjs-note-playing');
      }
      // Add new highlight
      if (noteIdx >= 0 && noteIdx < noteElementsRef.current.length) {
        noteElementsRef.current[noteIdx].classList.add('abcjs-note-playing');
      }
      lastHighlightedRef.current = noteIdx;
    }
  }, [tune, progress]);

  // Clear highlights when stopped
  useEffect(() => {
    if (!isPlaying && progress === 0) {
      noteElementsRef.current.forEach(el => el.classList.remove('abcjs-note-playing'));
      lastHighlightedRef.current = -1;
    }
  }, [isPlaying, progress]);

  if (!tune) {
    return (<div className="notation-view empty"><p>Select a tune to view notation</p></div>);
  }

  const displayKey = transpose !== 0 ? `(transposed ${transpose > 0 ? '+' : ''}${transpose})` : '';

  return (
    <div className="notation-view notation-view-v1">
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
