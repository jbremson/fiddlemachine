export interface Note {
  pitch: string;
  duration: number;
  start_time: number;
}

export interface Section {
  name: string;
  start_measure: number;
  end_measure: number;
  notes: Note[];
  repeat: number;  // Number of times to play this section (1 = no repeat, 2 = repeat once)
}

export interface Tune {
  id: string;
  title: string;
  key: string;
  time_signature: string;
  default_tempo: number;
  abc: string;
  sections: Section[];
}

export interface TuneSummary {
  id: string;
  title: string;
  key: string;
}

export type PlaybackState = 'stopped' | 'playing' | 'paused';

export type SectionMode = 'full' | 'A' | 'B';
