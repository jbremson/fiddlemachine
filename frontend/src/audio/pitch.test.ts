import { describe, it, expect } from 'vitest';
import { convertPitch, beatsToSeconds } from './pitch';

describe('convertPitch', () => {
  describe('without transposition', () => {
    it('returns the pitch unchanged for natural notes', () => {
      expect(convertPitch('C4')).toBe('C4');
      expect(convertPitch('D5')).toBe('D5');
      expect(convertPitch('G3')).toBe('G3');
    });

    it('returns the pitch unchanged for sharps', () => {
      expect(convertPitch('F#4')).toBe('F#4');
      expect(convertPitch('C#5')).toBe('C#5');
    });

    it('returns the pitch unchanged for flats', () => {
      expect(convertPitch('Bb4')).toBe('Bb4');
      expect(convertPitch('Eb3')).toBe('Eb3');
    });

    it('converts ABC-style flat notation (dash) to b', () => {
      expect(convertPitch('B-4')).toBe('Bb4');
      expect(convertPitch('E-3')).toBe('Eb3');
    });
  });

  describe('with transposition', () => {
    it('transposes up by semitones', () => {
      expect(convertPitch('C4', 1)).toBe('C#4');
      expect(convertPitch('C4', 2)).toBe('D4');
      expect(convertPitch('C4', 12)).toBe('C5');
    });

    it('transposes down by semitones', () => {
      expect(convertPitch('C4', -1)).toBe('B3');
      expect(convertPitch('C4', -2)).toBe('A#3');
      expect(convertPitch('C4', -12)).toBe('C3');
    });

    it('handles sharps when transposing', () => {
      expect(convertPitch('F#4', 1)).toBe('G4');
      expect(convertPitch('F#4', -1)).toBe('F4');
    });

    it('handles flats when transposing', () => {
      expect(convertPitch('Bb4', 1)).toBe('B4');
      expect(convertPitch('Bb4', -1)).toBe('A4');
    });

    it('wraps around octaves correctly', () => {
      expect(convertPitch('B4', 1)).toBe('C5');
      expect(convertPitch('C4', -1)).toBe('B3');
    });
  });

  describe('with octave shift', () => {
    it('shifts up by octaves', () => {
      expect(convertPitch('C4', 0, 1)).toBe('C5');
      expect(convertPitch('C4', 0, 2)).toBe('C6');
      expect(convertPitch('F#3', 0, 1)).toBe('F#4');
    });

    it('shifts down by octaves', () => {
      expect(convertPitch('C4', 0, -1)).toBe('C3');
      expect(convertPitch('C4', 0, -2)).toBe('C2');
      expect(convertPitch('Bb5', 0, -1)).toBe('A#4');
    });
  });

  describe('with combined transpose and octave shift', () => {
    it('applies both transpose and octave shift', () => {
      expect(convertPitch('C4', 2, 1)).toBe('D5');
      expect(convertPitch('C4', -2, -1)).toBe('A#2');
    });

    it('handles edge cases', () => {
      expect(convertPitch('B4', 1, 1)).toBe('C6');
      expect(convertPitch('C4', -1, -1)).toBe('B2');
    });
  });

  describe('invalid input', () => {
    it('returns the input unchanged for invalid pitch format', () => {
      expect(convertPitch('invalid')).toBe('invalid');
      expect(convertPitch('X4')).toBe('X4');
      expect(convertPitch('C')).toBe('C');
    });
  });
});

describe('beatsToSeconds', () => {
  it('converts beats to seconds at 60 BPM', () => {
    expect(beatsToSeconds(1, 60)).toBe(1);
    expect(beatsToSeconds(2, 60)).toBe(2);
    expect(beatsToSeconds(0.5, 60)).toBe(0.5);
  });

  it('converts beats to seconds at 120 BPM', () => {
    expect(beatsToSeconds(1, 120)).toBe(0.5);
    expect(beatsToSeconds(2, 120)).toBe(1);
    expect(beatsToSeconds(4, 120)).toBe(2);
  });

  it('converts beats to seconds at various BPMs', () => {
    expect(beatsToSeconds(1, 90)).toBeCloseTo(0.667, 2);
    expect(beatsToSeconds(3, 180)).toBe(1);
  });

  it('handles zero beats', () => {
    expect(beatsToSeconds(0, 120)).toBe(0);
  });
});
