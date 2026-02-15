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

// Minimal approach - no useState, direct DOM manipulation in single useEffect
export function NotationView({ tune, transpose, progress, isPlaying, highlightOffset = 0 }: NotationViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastHighlightedRef = useRef<Element | null>(null);

  // Render ABC
  useEffect(() => {
    if (!containerRef.current || !tune) return;
    const transposedAbc = transposeAbc(tune.abc, transpose);
    abcjs.renderAbc(containerRef.current, transposedAbc, {
      responsive: 'resize',
      add_classes: true,
      staffwidth: 700,
    });
  }, [tune, transpose]);

  // Update highlighting - runs on every progress change
  useEffect(() => {
    if (!containerRef.current || !tune) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const noteEls = svg.querySelectorAll('.abcjs-note');
    if (noteEls.length === 0) return;

    // Build mapping of note elements to sections
    let totalNoteCount = 0;
    tune.sections.forEach(section => {
      totalNoteCount += section.notes.length;
    });

    if (totalNoteCount === 0 || noteEls.length === 0) return;

    // Calculate total duration (each section plays twice)
    let totalBeats = 0;
    tune.sections.forEach(section => {
      const sectionBeats = section.notes.length > 0
        ? Math.max(...section.notes.map(n => n.start_time + n.duration))
        : 0;
      totalBeats += sectionBeats * 2;
    });

    if (totalBeats === 0) return;

    // Current beat
    const currentBeat = Math.max(0, progress * totalBeats - highlightOffset);

    // Find which note to highlight
    let noteIdx = -1;
    let beatOffset = 0;
    let noteOffset = 0;

    outer:
    for (const section of tune.sections) {
      const sectionBeats = section.notes.length > 0
        ? Math.max(...section.notes.map(n => n.start_time + n.duration))
        : 0;

      for (let pass = 0; pass < 2; pass++) {
        if (currentBeat >= beatOffset && currentBeat < beatOffset + sectionBeats) {
          const beatInSection = currentBeat - beatOffset;

          // Find note at this beat
          for (let i = 0; i < section.notes.length; i++) {
            const note = section.notes[i];
            if (beatInSection >= note.start_time && beatInSection < note.start_time + note.duration) {
              noteIdx = noteOffset + i;
              break outer;
            }
          }

          // Fallback: last note that started before current beat
          for (let i = section.notes.length - 1; i >= 0; i--) {
            if (section.notes[i].start_time <= beatInSection) {
              noteIdx = noteOffset + i;
              break outer;
            }
          }
        }
        beatOffset += sectionBeats;
      }
      noteOffset += section.notes.length;
    }

    // Update DOM directly
    if (lastHighlightedRef.current) {
      lastHighlightedRef.current.classList.remove('abcjs-note-playing');
    }

    if (noteIdx >= 0 && noteIdx < noteEls.length) {
      const newEl = noteEls[noteIdx];
      newEl.classList.add('abcjs-note-playing');
      lastHighlightedRef.current = newEl;
    } else {
      lastHighlightedRef.current = null;
    }
  }, [tune, progress, highlightOffset]);

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
      <div className="notation-wrapper">
        <div ref={containerRef} className="notation-container" />
      </div>
    </div>
  );
}
