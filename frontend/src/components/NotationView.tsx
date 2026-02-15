import { useEffect, useRef } from 'react';
import * as abcjs from 'abcjs';
import { Tune } from '../types/tune';

interface NotationViewProps {
  tune: Tune | null;
  transpose: number;
  progress: number;
  isPlaying: boolean;
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
  const cursorRef = useRef<HTMLDivElement>(null);
  const noteElementsRef = useRef<Element[]>([]);

  // Render ABC notation
  useEffect(() => {
    if (!containerRef.current || !tune) {
      return;
    }

    // Transpose and render
    const transposedAbc = transposeAbc(tune.abc, transpose);
    abcjs.renderAbc(containerRef.current, transposedAbc, {
      responsive: 'resize',
      add_classes: true,
      staffwidth: 700,
    });

    // Collect all note elements in order
    const svg = containerRef.current.querySelector('svg');
    if (svg) {
      const notes: Element[] = [];
      let i = 0;
      while (true) {
        const noteEl = svg.querySelector(`.abcjs-n${i}`);
        if (!noteEl) break;
        notes.push(noteEl);
        i++;
      }
      noteElementsRef.current = notes;

      // Position cursor at start
      if (notes.length > 0) {
        positionCursorAtNote(0);
      }
    }
  }, [tune, transpose]);

  const positionCursorAtNote = (noteIndex: number) => {
    if (!cursorRef.current || !containerRef.current) return;

    const notes = noteElementsRef.current;
    const svg = containerRef.current.querySelector('svg');
    if (!svg || notes.length === 0) return;

    const targetIndex = Math.min(Math.max(0, noteIndex), notes.length - 1);
    const noteEl = notes[targetIndex];
    if (!noteEl) return;

    const svgRect = svg.getBoundingClientRect();
    const noteRect = noteEl.getBoundingClientRect();

    // Find the staff this note belongs to by checking vertical position
    const staffLines = svg.querySelectorAll('.abcjs-staff');
    let staffTop = noteRect.top - svgRect.top - 20;
    let staffHeight = 60;

    for (const staff of staffLines) {
      const staffRect = staff.getBoundingClientRect();
      // Check if note is within or near this staff
      if (noteRect.top >= staffRect.top - 20 && noteRect.bottom <= staffRect.bottom + 20) {
        staffTop = staffRect.top - svgRect.top;
        staffHeight = staffRect.height;
        break;
      }
    }

    cursorRef.current.style.left = `${noteRect.left - svgRect.left}px`;
    cursorRef.current.style.top = `${staffTop}px`;
    cursorRef.current.style.height = `${staffHeight}px`;
  };

  // Update cursor position based on progress
  useEffect(() => {
    if (!cursorRef.current) return;

    const notes = noteElementsRef.current;
    if (notes.length === 0) {
      cursorRef.current.style.opacity = '0';
      return;
    }

    // Calculate which note we're on based on progress
    const noteIndex = Math.floor(progress * notes.length);
    positionCursorAtNote(noteIndex);

    cursorRef.current.style.opacity = isPlaying || progress > 0 ? '1' : '0.5';
  }, [progress, isPlaying]);

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
        <div ref={cursorRef} className="playback-cursor" />
      </div>
    </div>
  );
}
