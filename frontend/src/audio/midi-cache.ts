import { Midi } from '@tonejs/midi';

export interface SectionBounds {
  name: string;
  start_beat: number;
  end_beat: number;
}

export interface MidiData {
  midi: Midi;
  sections: SectionBounds[];
  pickup_beats: number;
  default_tempo: number;
}

interface MidiDataResponse {
  midi_base64: string;
  sections: SectionBounds[];
  pickup_beats: number;
  default_tempo: number;
}

const cache = new Map<string, MidiData>();

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function parseResponse(data: MidiDataResponse): MidiData {
  const arrayBuffer = base64ToArrayBuffer(data.midi_base64);
  const midi = new Midi(arrayBuffer);
  return {
    midi,
    sections: data.sections,
    pickup_beats: data.pickup_beats,
    default_tempo: data.default_tempo,
  };
}

export async function fetchMidiData(tuneId: string): Promise<MidiData> {
  const cached = cache.get(tuneId);
  if (cached) return cached;

  const response = await fetch(`/api/tunes/${encodeURIComponent(tuneId)}/midi-data`);
  if (!response.ok) {
    throw new Error(`Failed to fetch MIDI data: ${response.status}`);
  }
  const data: MidiDataResponse = await response.json();
  const midiData = parseResponse(data);
  cache.set(tuneId, midiData);
  return midiData;
}

export async function fetchMidiDataFromAbc(abc: string, id: string): Promise<MidiData> {
  const cached = cache.get(id);
  if (cached) return cached;

  const response = await fetch('/api/tunes/midi-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ abc, id }),
  });
  if (!response.ok) {
    throw new Error(`Failed to generate MIDI data: ${response.status}`);
  }
  const data: MidiDataResponse = await response.json();
  const midiData = parseResponse(data);
  cache.set(id, midiData);
  return midiData;
}

export function invalidateMidiCache(tuneId?: string): void {
  if (tuneId) {
    cache.delete(tuneId);
  } else {
    cache.clear();
  }
}
