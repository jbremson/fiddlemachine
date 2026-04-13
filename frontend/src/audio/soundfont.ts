import * as Tone from 'tone';
import { SynthType } from './synth';

const SOUNDFONT_BASE_URL = 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite';

const SYNTH_TO_SOUNDFONT: Record<SynthType, string> = {
  fiddle: 'violin',
  piano: 'acoustic_grand_piano',
  clarinet: 'clarinet',
  whistle: 'flute',
  pluck: 'acoustic_guitar_nylon',
};

// Sparse note set: every 3 semitones from C2 to C6 (~18 samples)
// Tone.Sampler pitch-shifts for intermediate notes
const SAMPLE_NOTES = [
  'C2', 'Eb2', 'Gb2', 'A2',
  'C3', 'Eb3', 'Gb3', 'A3',
  'C4', 'Eb4', 'Gb4', 'A4',
  'C5', 'Eb5', 'Gb5', 'A5',
  'C6',
];

// Cache loaded samplers by synth type
const samplerCache = new Map<SynthType, Tone.Sampler>();

let soundfontReverb: Tone.Reverb | null = null;

function getSoundfontReverb(): Tone.Reverb {
  if (!soundfontReverb) {
    soundfontReverb = new Tone.Reverb({
      decay: 1.5,
      wet: 0.2,
    }).toDestination();
  }
  return soundfontReverb;
}

export function loadSoundFontSampler(type: SynthType): Promise<Tone.Sampler> {
  const cached = samplerCache.get(type);
  if (cached) {
    return Promise.resolve(cached);
  }

  const instrument = SYNTH_TO_SOUNDFONT[type];

  return new Promise((resolve, reject) => {
    const urls: Record<string, string> = {};
    for (const note of SAMPLE_NOTES) {
      // MusyngKite format: note name with sharp as %23, e.g. "C4" -> "C4.ogg"
      // Flats need converting to sharps for URL: Eb -> Ds, Gb -> Fs
      const urlNote = note
        .replace('Eb', 'Ds')
        .replace('Gb', 'Fs');
      urls[note] = `${urlNote}.ogg`;
    }

    const sampler = new Tone.Sampler({
      urls,
      baseUrl: `${SOUNDFONT_BASE_URL}/${instrument}-ogg/`,
      volume: -6,
      onload: () => {
        sampler.connect(getSoundfontReverb());
        samplerCache.set(type, sampler);
        resolve(sampler);
      },
      onerror: (err) => {
        reject(err);
      },
    }).toDestination();
  });
}

export function getCachedSampler(type: SynthType): Tone.Sampler | null {
  return samplerCache.get(type) || null;
}

export function isSamplerLoaded(type: SynthType): boolean {
  return samplerCache.has(type);
}

export function disposeSoundFontSamplers(): void {
  for (const sampler of samplerCache.values()) {
    sampler.dispose();
  }
  samplerCache.clear();
  if (soundfontReverb) {
    soundfontReverb.dispose();
    soundfontReverb = null;
  }
}
