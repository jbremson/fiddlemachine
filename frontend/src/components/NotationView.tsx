import { useEffect, useRef, useState } from 'react';
import * as abcjs from 'abcjs';
import { Tune } from '../types/tune';

interface NotationViewProps {
  tune: Tune | null;
  transpose: number;
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

interface ZoomLevel {
  label: string;
  staffwidth: number;
}

const ZOOM_LEVELS: ZoomLevel[] = [
  { label: '50%', staffwidth: 350 },
  { label: '75%', staffwidth: 525 },
  { label: '100%', staffwidth: 700 },
  { label: '125%', staffwidth: 875 },
  { label: '150%', staffwidth: 1050 },
];

export function NotationView({ tune, transpose }: NotationViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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
  }, [tune, transpose, zoomIndex]);

  if (!tune) {
    return (<div className="notation-view empty"><p>Select a tune to view notation</p></div>);
  }

  const handlePrint = () => {
    if (!containerRef.current || !tune) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get the SVG content from the notation container
    const svgElement = containerRef.current.querySelector('svg');
    const svgContent = svgElement ? svgElement.outerHTML : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${tune.title}</title>
          <style>
            body {
              font-family: Georgia, serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
              min-height: 100vh;
              position: relative;
            }
            svg {
              width: 100%;
              height: auto;
            }
            .footer {
              position: fixed;
              bottom: 10px;
              right: 20px;
              font-size: 10px;
              color: #ccc;
            }
            @media print {
              body { padding: 0; }
              .footer {
                position: fixed;
                bottom: 10px;
                right: 20px;
              }
            }
          </style>
        </head>
        <body>
          ${svgContent}
          <div class="footer">Created by fiddlemachine.com.</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="notation-view">
      <div className="notation-controls">
        <div className="zoom-control">
          <label>Zoom: </label>
          <button
            onClick={() => setZoomIndex(Math.min(ZOOM_LEVELS.length - 1, zoomIndex + 1))}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="zoom-level">{ZOOM_LEVELS[zoomIndex].label}</span>
          <button
            onClick={() => setZoomIndex(Math.max(0, zoomIndex - 1))}
            disabled={zoomIndex === 0}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
        <button className="print-btn" onClick={handlePrint} aria-label="Print notation">
          Print
        </button>
      </div>
      <div className="notation-wrapper">
        <div ref={containerRef} className="notation-container" />
      </div>
    </div>
  );
}
