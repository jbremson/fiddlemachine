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
  playback_notes?: Note[];  // Expanded notes for playback (repeats unrolled)
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

export interface TuneInfo extends TuneSummary {
  source?: string;
  source_url?: string;
  quality?: string;
  rating?: number | null;
  rating_count: number;
  owner?: string;
  version?: number;
}

export type PlaybackState = 'stopped' | 'playing' | 'paused';

export type SectionMode = 'full' | 'A' | 'B';
