/**
 * Convert pitch notation and apply transposition.
 * @param pitch - Pitch in format like "F#4", "Bb3", "C-4" (- means flat)
 * @param transpose - Semitones to transpose (positive = up, negative = down)
 * @param octaveShift - Octaves to shift (positive = up, negative = down)
 * @returns Pitch in Tone.js format (e.g., "F#4", "Bb3")
 */
export function convertPitch(pitch: string, transpose: number = 0, octaveShift: number = 0): string {
  // Convert ABC-style flat notation (C- means Cb) to standard
  let normalized = pitch.replace('-', 'b');

  const totalTranspose = transpose + (octaveShift * 12);

  if (totalTranspose === 0) {
    return normalized;
  }

  // Parse the pitch
  const match = normalized.match(/^([A-G])([#b]?)(\d+)$/);
  if (!match) return normalized;

  const [, note, accidental, octaveStr] = match;
  let octave = parseInt(octaveStr);

  // Convert to semitone number (C4 = 48 in this system, C0 = 0)
  const noteValues: Record<string, number> = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
  };
  let semitone = noteValues[note] + (octave * 12);
  if (accidental === '#') semitone += 1;
  if (accidental === 'b') semitone -= 1;

  // Apply transpose and octave shift
  semitone += totalTranspose;

  // Convert back to note name
  const newOctave = Math.floor(semitone / 12);
  const noteIndex = ((semitone % 12) + 12) % 12;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  return noteNames[noteIndex] + newOctave;
}

/**
 * Convert beats to seconds based on BPM.
 * @param beats - Number of beats
 * @param bpm - Beats per minute
 * @returns Duration in seconds
 */
export function beatsToSeconds(beats: number, bpm: number): number {
  return (beats / bpm) * 60;
}
