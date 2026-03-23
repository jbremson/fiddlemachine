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
  pickup_beats: number;  // Duration of pickup notes in beats (0 if no pickup)
}

export interface TuneSummary {
  id: string;
  title: string;
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

export type TuneSource = 'library' | 'user_song';

export interface SetItem {
  id: number;
  position: number;
  tune_source: TuneSource;
  tune_ref: string;
  tune_title: string;
  bpm: number | null;
  transpose: number | null;
  octave_shift: number | null;
  synth_type: string | null;
  metronome_enabled: boolean | null;
  count_off_enabled: boolean | null;
}

export interface SetSummary {
  id: number;
  name: string;
  item_count: number;
  updated_at: string;
}

export interface SetDetail {
  id: number;
  name: string;
  items: SetItem[];
  created_at: string;
  updated_at: string;
}
