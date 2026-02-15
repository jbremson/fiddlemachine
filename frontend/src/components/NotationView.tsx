import { useEffect, useRef, useState, useCallback } from 'react';
import * as abcjs from 'abcjs';
import { Tune } from '../types/tune';

interface NotationViewProps {
  tune: Tune | null;
  transpose: number;
  progress: number;
  isPlaying: boolean;
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

// Note-level highlighting
// Highlights individual notes as they play using exact timing from tune data
export function NotationView({ tune, transpose, progress, isPlaying }: NotationViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [noteElements, setNoteElements] = useState<NoteElement[]>([]);
  const [totalBeats, setTotalBeats] = useState(0);
  const [currentNoteIdx, setCurrentNoteIdx] = useState(-1);

  const getBeatsPerBar = useCallback((): number => {
    if (!tune) return 4;
    const parts = tune.time_signature.split('/');
    if (parts.length !== 2) return 4;
    const numerator = parseInt(parts[0]) || 4;
    const denominator = parseInt(parts[1]) || 4;
    return numerator * (4 / denominator);
  }, [tune]);

  // Get section info matching player.ts logic
  const getSectionInfo = useCallback(() => {
    if (!tune) return [];
    const beatsPerBar = getBeatsPerBar();
    return tune.sections.map(section => {
      const sectionBeats = section.notes.length > 0
        ? Math.max(...section.notes.map(n => n.start_time + n.duration))
        : 0;
      const barsFloat = sectionBeats / beatsPerBar;
      const fullBars = Math.floor(barsFloat);
      const pickupBeats = sectionBeats - (fullBars * beatsPerBar);
      const hasPickup = pickupBeats > 0 && pickupBeats < beatsPerBar;
      return {
        sectionBeats,
        pickupBeats: hasPickup ? pickupBeats : 0,
        hasPickup
      };
    });
  }, [tune, getBeatsPerBar]);

  // Build playback timeline for notes (matching player.ts exactly)
  const buildNoteTimeline = useCallback(() => {
    if (!tune) return { timeline: [], totalBeats: 0 };

    const sections = getSectionInfo();
    const timeline: { startTime: number; endTime: number; sectionIdx: number; noteIdx: number }[] = [];
    let playbackBeat = 0;

    tune.sections.forEach((section, secIdx) => {
      const info = sections[secIdx];

      // First pass: all notes
      section.notes.forEach((note, noteIdx) => {
        timeline.push({
          startTime: playbackBeat + note.start_time,
          endTime: playbackBeat + note.start_time + note.duration,
          sectionIdx: secIdx,
          noteIdx
        });
      });
      playbackBeat += info.sectionBeats;

      // Second pass: skip pickup notes
      const skipBeats = info.hasPickup ? info.pickupBeats : 0;
      section.notes.forEach((note, noteIdx) => {
        if (note.start_time < skipBeats) return; // Skip pickup notes on repeat

        const adjustedStart = note.start_time - skipBeats;
        timeline.push({
          startTime: playbackBeat + adjustedStart,
          endTime: playbackBeat + adjustedStart + note.duration,
          sectionIdx: secIdx,
          noteIdx
        });
      });
      playbackBeat += info.sectionBeats - skipBeats;
    });

    // Sort by start time
    timeline.sort((a, b) => a.startTime - b.startTime);

    return { timeline, totalBeats: playbackBeat };
  }, [tune, getSectionInfo]);

  // Map SVG note elements to their timing
  const mapNoteElements = useCallback(() => {
    if (!containerRef.current || !tune) return [];

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return [];

    // Get all note elements from SVG
    const noteEls = svg.querySelectorAll('.abcjs-note');
    const elements: NoteElement[] = [];

    // Build flat list of notes with timing from tune data
    const allNotes: { startTime: number; duration: number }[] = [];
    tune.sections.forEach(section => {
      section.notes.forEach(note => {
        allNotes.push({ startTime: note.start_time, duration: note.duration });
      });
    });

    // Sort by start time to match visual order
    allNotes.sort((a, b) => a.startTime - b.startTime);

    // Map each SVG element to its corresponding note timing
    noteEls.forEach((el, idx) => {
      if (idx < allNotes.length) {
        elements.push({
          element: el,
          startTime: allNotes[idx].startTime,
          endTime: allNotes[idx].startTime + allNotes[idx].duration
        });
      }
    });

    return elements;
  }, [tune]);

  useEffect(() => {
    if (!containerRef.current || !tune) {
      setNoteElements([]);
      setTotalBeats(0);
      return;
    }

    const transposedAbc = transposeAbc(tune.abc, transpose);
    abcjs.renderAbc(containerRef.current, transposedAbc, {
      responsive: 'resize',
      add_classes: true,
      staffwidth: 700,
    });

    // Build timeline and map elements
    const { totalBeats: total } = buildNoteTimeline();
    setTotalBeats(total);

    requestAnimationFrame(() => {
      setNoteElements(mapNoteElements());
    });
  }, [tune, transpose, buildNoteTimeline, mapNoteElements]);

  // Find current note based on progress
  const getCurrentNoteIndex = useCallback((): number => {
    if (!tune || noteElements.length === 0 || totalBeats === 0) return -1;

    const sections = getSectionInfo();
    const currentBeat = progress * totalBeats;

    // Determine which section/pass we're in
    let playbackOffset = 0;
    let targetSection = -1;
    let beatInSection = 0;

    for (let secIdx = 0; secIdx < sections.length; secIdx++) {
      const info = sections[secIdx];

      // First pass
      if (currentBeat < playbackOffset + info.sectionBeats) {
        targetSection = secIdx;
        beatInSection = currentBeat - playbackOffset;
        break;
      }
      playbackOffset += info.sectionBeats;

      // Second pass
      const secondPassBeats = info.sectionBeats - info.pickupBeats;
      if (currentBeat < playbackOffset + secondPassBeats) {
        targetSection = secIdx;
        beatInSection = (currentBeat - playbackOffset) + info.pickupBeats;
        break;
      }
      playbackOffset += secondPassBeats;
    }

    if (targetSection < 0) return -1;

    // Find note element for this beat
    // Calculate offset into noteElements for this section
    let noteOffset = 0;
    for (let i = 0; i < targetSection; i++) {
      noteOffset += tune.sections[i].notes.length;
    }

    // Find note in section that contains this beat
    const sectionNotes = tune.sections[targetSection].notes;
    for (let i = 0; i < sectionNotes.length; i++) {
      const note = sectionNotes[i];
      if (beatInSection >= note.start_time && beatInSection < note.start_time + note.duration) {
        return noteOffset + i;
      }
    }

    // If between notes, find the closest upcoming note
    for (let i = 0; i < sectionNotes.length; i++) {
      const note = sectionNotes[i];
      if (note.start_time > beatInSection) {
        return noteOffset + Math.max(0, i - 1);
      }
    }

    return noteOffset + sectionNotes.length - 1;
  }, [tune, noteElements, totalBeats, progress, getSectionInfo]);

  // Update highlighting
  useEffect(() => {
    const newIdx = getCurrentNoteIndex();
    if (newIdx !== currentNoteIdx) {
      // Remove old highlight
      if (currentNoteIdx >= 0 && currentNoteIdx < noteElements.length) {
        noteElements[currentNoteIdx].element.classList.remove('abcjs-note-playing');
      }
      // Add new highlight
      if (newIdx >= 0 && newIdx < noteElements.length) {
        noteElements[newIdx].element.classList.add('abcjs-note-playing');
      }
      setCurrentNoteIdx(newIdx);
    }
  }, [getCurrentNoteIndex, currentNoteIdx, noteElements]);

  // Clean up highlights when not playing
  useEffect(() => {
    if (!isPlaying && progress === 0) {
      noteElements.forEach(ne => {
        ne.element.classList.remove('abcjs-note-playing');
      });
      setCurrentNoteIdx(-1);
    }
  }, [isPlaying, progress, noteElements]);

  if (!tune) {
    return (<div className="notation-view empty"><p>Select a tune to view notation</p></div>);
  }

  const displayKey = transpose !== 0 ? `(transposed ${transpose > 0 ? '+' : ''}${transpose})` : '';

  return (
    <div className="notation-view notation-view-v3">
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
