import * as Tone from 'tone';

export type SynthType = 'fiddle' | 'piano' | 'clarinet' | 'whistle' | 'pluck';

let synth: Tone.PolySynth | null = null;
let reverb: Tone.Reverb | null = null;
let currentSynthType: SynthType = 'fiddle';
let metronomeSynth: Tone.MembraneSynth | null = null;

const SYNTH_CONFIGS: Record<SynthType, { name: string; config: () => Tone.PolySynth }> = {
  fiddle: {
    name: 'Fiddle',
    config: () => new Tone.PolySynth(Tone.FMSynth, {
      volume: -6,
      harmonicity: 3,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.3 },
      modulation: { type: 'triangle' },
      modulationEnvelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.3 },
    }),
  },
  piano: {
    name: 'Piano',
    config: () => new Tone.PolySynth(Tone.Synth, {
      volume: -6,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.8 },
    }),
  },
  clarinet: {
    name: 'Clarinet',
    config: () => new Tone.PolySynth(Tone.FMSynth, {
      volume: -8,
      harmonicity: 2,
      modulationIndex: 5,
      oscillator: { type: 'square' },
      envelope: { attack: 0.1, decay: 0.1, sustain: 0.9, release: 0.2 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.2, decay: 0.1, sustain: 0.8, release: 0.2 },
    }),
  },
  whistle: {
    name: 'Tin Whistle',
    config: () => new Tone.PolySynth(Tone.Synth, {
      volume: -10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.9, release: 0.1 },
    }),
  },
  pluck: {
    name: 'Plucked String',
    config: () => new Tone.PolySynth(Tone.Synth, {
      volume: -4,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.002, decay: 0.4, sustain: 0, release: 0.4 },
    }),
  },
};

export function getSynthTypes(): { value: SynthType; name: string }[] {
  return Object.entries(SYNTH_CONFIGS).map(([value, { name }]) => ({
    value: value as SynthType,
    name,
  }));
}

export function getCurrentSynthType(): SynthType {
  return currentSynthType;
}

export function createSynth(type: SynthType = 'fiddle'): Tone.PolySynth {
  // Dispose existing synth if changing type
  if (synth && type !== currentSynthType) {
    synth.disconnect();
    synth.dispose();
    synth = null;
  }

  if (synth) {
    return synth;
  }

  currentSynthType = type;
  synth = SYNTH_CONFIGS[type].config().toDestination();

  // Add reverb
  if (!reverb) {
    reverb = new Tone.Reverb({
      decay: 1.5,
      wet: 0.2,
    }).toDestination();
  }

  synth.connect(reverb);

  return synth;
}

export function setSynthType(type: SynthType): void {
  createSynth(type);
}

export function getSynth(): Tone.PolySynth | null {
  return synth;
}

export function disposeSynth(): void {
  if (synth) {
    synth.dispose();
    synth = null;
  }
  if (reverb) {
    reverb.dispose();
    reverb = null;
  }
  if (metronomeSynth) {
    metronomeSynth.dispose();
    metronomeSynth = null;
  }
}

export function createMetronomeSynth(): Tone.MembraneSynth {
  if (metronomeSynth) {
    return metronomeSynth;
  }

  metronomeSynth = new Tone.MembraneSynth({
    volume: -6,
    pitchDecay: 0.01,
    octaves: 4,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
  }).toDestination();

  return metronomeSynth;
}

export function getMetronomeSynth(): Tone.MembraneSynth | null {
  return metronomeSynth;
}
