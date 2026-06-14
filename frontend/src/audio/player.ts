import * as Tone from 'tone';
import { Section, Tune, PlaybackState, SectionMode } from '../types/tune';
import { createSynth, createMetronomeSynth, getMetronomeSynth, SynthType, MetronomeType, PlaybackEngine, setPlaybackEngine, getActiveInstrument, ensureActiveInstrument } from './synth';
import { convertPitch } from './pitch';
import { MidiData, fetchMidiData, fetchMidiDataFromAbc } from './midi-cache';

type ToneTransport = ReturnType<typeof Tone.getTransport>;

type PlaybackCallback = (state: PlaybackState) => void;

class TunePlayer {
  private tune: Tune | null = null;
  private sectionMode: SectionMode = 'full';
  private bpm: number = 72;
  private isLooping: boolean = false;
  private repeatCount: number = 2;
  private currentRepeat: number = 0;
  private scheduledEvents: number[] = [];
  private playbackState: PlaybackState = 'stopped';
  private onStateChange: PlaybackCallback | null = null;
  private totalDurationSecs: number = 0;
  private synthType: SynthType = 'fiddle';
  private transpose: number = 0;
  private octaveShift: number = 0;
  private metronomeEnabled: boolean = false;
  private metronomeType: MetronomeType = 'click1';
  private countOffEnabled: boolean = true;
  private countOffBeats: number = 4;  // Beats per bar (4 for 4/4, 3 for 3/4)
  private pickupBeats: number = 0;  // Duration of pickup notes in beats
  private engine: PlaybackEngine = 'synth';
  private soundfontLoading: boolean = false;
  private midiData: MidiData | null = null;
  private useMidi: boolean = false;
  private speedUpEnabled: boolean = false;
  private speedUpStartBpm: number = 72;
  private speedUpIncrement: number = 5;
  private speedUpMaxBpm: number = 120;
  private speedUpStepsPerIncrease: number = 1;
  private onBpmChange: ((bpm: number) => void) | null = null;

  async initialize(): Promise<void> {
    await Tone.start();
    createSynth(this.synthType);
  }

  setPlaybackEngine(engine: PlaybackEngine): void {
    this.engine = engine;
    this.useMidi = (engine === 'soundfont');
    setPlaybackEngine(engine);
  }

  getPlaybackEngine(): PlaybackEngine {
    return this.engine;
  }

  isSoundfontLoading(): boolean {
    return this.soundfontLoading;
  }

  setSynthType(type: SynthType): void {
    this.synthType = type;
    createSynth(type);
  }

  setTranspose(semitones: number): void {
    this.transpose = semitones;
  }

  setOctaveShift(octaves: number): void {
    this.octaveShift = octaves;
  }

  getOctaveShift(): number {
    return this.octaveShift;
  }

  setTune(tune: Tune): void {
    this.stop();
    this.tune = tune;
    this.midiData = null;
    // Don't override user's BPM setting when loading a tune
    Tone.getTransport().bpm.value = this.bpm;
    // Parse time signature for count-off
    const timeParts = tune.time_signature.split('/');
    const numerator = parseInt(timeParts[0]) || 4;
    // Use 3 clicks for 3/4, 6/8, 9/8; otherwise 4 clicks
    this.countOffBeats = (numerator === 3 || numerator === 6 || numerator === 9) ? 3 : 4;
    // Store pickup beats for lead-in calculation
    this.pickupBeats = tune.pickup_beats;
  }

  setMetronome(enabled: boolean): void {
    const wasEnabled = this.metronomeEnabled;
    this.metronomeEnabled = enabled;

    // Create metronome synth if enabling
    if (enabled && !wasEnabled) {
      createMetronomeSynth(this.metronomeType);
    }

    // If playback is active and metronome state changed, reschedule
    if (this.playbackState === 'playing' && wasEnabled !== enabled) {
      // Save current progress
      const currentProgress = Tone.getTransport().seconds / this.totalDurationSecs;

      // Stop and clear
      Tone.getTransport().stop();
      this.clearScheduledEvents();

      // Reschedule everything
      this.scheduleNotes();

      // Resume from same position
      const newPosition = currentProgress * this.totalDurationSecs;
      Tone.getTransport().seconds = newPosition;
      Tone.getTransport().start();
    }
  }

  getMetronome(): boolean {
    return this.metronomeEnabled;
  }

  setMetronomeType(type: MetronomeType): void {
    this.metronomeType = type;
    if (this.metronomeEnabled) {
      createMetronomeSynth(type);
    }
  }

  getMetronomeType(): MetronomeType {
    return this.metronomeType;
  }

  setCountOff(enabled: boolean): void {
    this.countOffEnabled = enabled;
  }

  getCountOff(): boolean {
    return this.countOffEnabled;
  }

  setBpm(bpm: number): void {
    this.bpm = Math.max(30, Math.min(200, bpm));
    Tone.getTransport().bpm.value = this.bpm;
  }

  getBpm(): number {
    return this.bpm;
  }

  setSectionMode(mode: SectionMode): void {
    const wasPlaying = this.playbackState === 'playing';
    if (wasPlaying) {
      this.stop();
    }
    this.sectionMode = mode;
    if (wasPlaying) {
      this.play();
    }
  }

  setLooping(loop: boolean): void {
    this.isLooping = loop;
  }

  setRepeatCount(count: number): void {
    this.repeatCount = Math.max(1, count);
  }

  getRepeatCount(): number {
    return this.repeatCount;
  }

  setOnStateChange(callback: PlaybackCallback): void {
    this.onStateChange = callback;
  }

  setOnBpmChange(callback: (bpm: number) => void): void {
    this.onBpmChange = callback;
  }

  configureSpeedUp(config: {
    enabled: boolean;
    startBpm: number;
    increment: number;
    maxBpm: number;
    stepsPerIncrease: number;
  }): void {
    this.speedUpEnabled = config.enabled;
    this.speedUpStartBpm = Math.max(30, Math.min(200, config.startBpm));
    this.speedUpIncrement = Math.max(1, config.increment);
    this.speedUpMaxBpm = Math.max(30, Math.min(200, config.maxBpm));
    this.speedUpStepsPerIncrease = Math.max(1, config.stepsPerIncrease);
  }

  private getSectionsToPlay(): Section[] {
    if (!this.tune) return [];

    switch (this.sectionMode) {
      case 'A':
        return this.tune.sections.filter(s => s.name === 'A');
      case 'B':
        return this.tune.sections.filter(s => s.name === 'B');
      case 'full':
      default:
        return this.tune.sections;
    }
  }

  private beatsToSeconds(beats: number): number {
    // Convert beats to seconds based on current BPM
    const bpm = Tone.getTransport().bpm.value;
    return (beats / bpm) * 60;
  }

  private scheduleNotes(isFirstPlay: boolean = true): void {
    const synth = getActiveInstrument();
    if (!synth || !this.tune) return;

    this.clearScheduledEvents();

    const sections = this.getSectionsToPlay();
    if (sections.length === 0) return;

    const transport = Tone.getTransport();

    // Calculate lead-in beats (only on first play, not loops)
    // Formula: beatsPerBar + (beatsPerBar - pickupBeats)
    // This gives 2 full bars when there's a pickup, or just 1 bar when first bar is full
    // If pickupBeats equals beatsPerBar, there's no pickup and lead-in = beatsPerBar (1 bar)
    // If pickupBeats < beatsPerBar, lead-in extends to give the player time before the pickup
    const beatsPerBar = this.countOffBeats;
    const leadInBeats = beatsPerBar + (beatsPerBar - this.pickupBeats);
    const leadInOffset = (this.countOffEnabled && isFirstPlay) ? leadInBeats : 0;
    let sectionOffsetBeats = leadInOffset;

    // Schedule lead-in clicks only on first play (not on loops/repeats)
    if (this.countOffEnabled && isFirstPlay) {
      createMetronomeSynth(this.metronomeType);
      const metronome = getMetronomeSynth();
      if (metronome) {
        const clickPitch = 'C5';
        // Schedule clicks for the entire lead-in period
        const totalLeadInClicks = Math.ceil(leadInBeats);
        for (let beat = 0; beat < totalLeadInClicks; beat++) {
          const beatTimeSecs = this.beatsToSeconds(beat);
          const eventId = transport.schedule((time) => {
            if (metronome instanceof Tone.NoiseSynth) {
              metronome.triggerAttackRelease('32n', time);
            } else {
              (metronome as Tone.Synth).triggerAttackRelease(clickPitch, '32n', time);
            }
          }, beatTimeSecs);
          this.scheduledEvents.push(eventId);
        }
      }
    }

    // TEMP DEBUG: Log scheduling source comparison
    if (this.useMidi && this.midiData) {
      const bounds = this.getActiveSectionBounds();
      const midiTrack = this.midiData.midi.tracks.find(t => t.notes.length > 0);
      const ppq = this.midiData.midi.header.ppq;
      const allMidiNotes = midiTrack ? midiTrack.notes.length : 0;
      const midiActualEnd = midiTrack
        ? Math.max(...midiTrack.notes.map(n => (n.ticks + n.durationTicks) / ppq))
        : 0;
      const customNoteCount = sections.reduce(
        (sum, s) => sum + (s.playback_notes || s.notes).length, 0
      );
      const customTotalBeats = sections.reduce(
        (sum, s) => sum + Math.max(...(s.playback_notes || s.notes).map(n => n.start_time + n.duration)), 0
      );
      console.log('[MIDI debug]', {
        tune: this.tune?.title,
        sectionMode: this.sectionMode,
        isFirstPlay,
        pickupBeats: this.pickupBeats,
        leadInOffset,
        midiBounds: bounds,
        midiActualEnd,
        allMidiNotes,
        customTotalBeats,
        customNoteCount,
        customSections: sections.map(s => ({
          name: s.name,
          noteCount: (s.playback_notes || s.notes).length,
          duration: Math.max(...(s.playback_notes || s.notes).map(n => n.start_time + n.duration)),
          repeat: s.repeat,
        })),
        midiTracks: this.midiData.midi.tracks.map(t => ({ name: t.name, notes: t.notes.length })),
        durationDiff: `midi=${midiActualEnd.toFixed(1)} vs custom=${customTotalBeats.toFixed(1)}, diff=${Math.abs(midiActualEnd - customTotalBeats).toFixed(1)}`,
      });
      sectionOffsetBeats = this.scheduleMidiNotes(synth, transport, leadInOffset);
    } else {
      sectionOffsetBeats = this.scheduleCustomNotes(synth, transport, sectionOffsetBeats, sections);
    }

    // Store total duration for progress calculation (includes count-off)
    this.totalDurationSecs = this.beatsToSeconds(sectionOffsetBeats);

    // Schedule metronome clicks if enabled (starting after lead-in)
    if (this.metronomeEnabled) {
      const metronome = getMetronomeSynth();
      if (metronome) {
        // Schedule a click on each beat - single tone
        const totalBeats = sectionOffsetBeats;
        const clickPitch = 'C5'; // Single consistent pitch
        // Start metronome clicks after lead-in
        for (let beat = leadInOffset; beat < totalBeats; beat++) {
          const beatTimeSecs = this.beatsToSeconds(beat);

          const eventId = transport.schedule((time) => {
            // NoiseSynth doesn't take a pitch
            if ('triggerAttackRelease' in metronome) {
              if (metronome instanceof Tone.NoiseSynth) {
                metronome.triggerAttackRelease('32n', time);
              } else {
                (metronome as Tone.Synth).triggerAttackRelease(clickPitch, '32n', time);
              }
            }
          }, beatTimeSecs);

          this.scheduledEvents.push(eventId);
        }
      }
    }

    // Schedule end of tune
    const endEventId = transport.schedule(() => {
      this.currentRepeat++;
      if (this.isLooping || this.currentRepeat < this.repeatCount) {
        // Reset and continue (no count-off on loops/repeats)
        transport.stop();
        transport.position = 0;
        // Incremental speed-up: step the tempo up at each level boundary
        if (this.speedUpEnabled && this.currentRepeat % this.speedUpStepsPerIncrease === 0) {
          const next = Math.min(this.speedUpMaxBpm, this.bpm + this.speedUpIncrement);
          if (next !== this.bpm) {
            this.setBpm(next);
            this.onBpmChange?.(this.bpm);
          }
        }
        this.scheduleNotes(false);
        transport.start();
      } else {
        this.stop();
      }
    }, this.totalDurationSecs);

    this.scheduledEvents.push(endEventId);
  }

  private scheduleCustomNotes(
    synth: Tone.PolySynth | Tone.Sampler,
    transport: ToneTransport,
    sectionOffsetBeats: number,
    sections: Section[],
  ): number {
    sections.forEach((section) => {
      const notesToPlay = section.playback_notes || section.notes;
      const sectionBeats = notesToPlay.length > 0
        ? Math.max(...notesToPlay.map(n => n.start_time + n.duration))
        : 4;

      notesToPlay.forEach((note) => {
        const noteTimeBeats = sectionOffsetBeats + note.start_time;
        const durationBeats = note.duration;
        const noteTimeSecs = this.beatsToSeconds(noteTimeBeats);
        const durationSecs = Math.max(0.1, this.beatsToSeconds(durationBeats));

        const eventId = transport.schedule((time) => {
          const pitch = this.convertPitchWithTranspose(note.pitch);
          synth.triggerAttackRelease(pitch, durationSecs, time);
        }, noteTimeSecs);
        this.scheduledEvents.push(eventId);
      });

      sectionOffsetBeats += sectionBeats;
    });
    return sectionOffsetBeats;
  }

  private scheduleMidiNotes(
    synth: Tone.PolySynth | Tone.Sampler,
    transport: ToneTransport,
    leadInOffset: number,
  ): number {
    if (!this.midiData) return leadInOffset;

    const midi = this.midiData.midi;
    const ppq = midi.header.ppq;

    // Find first track with notes
    const track = midi.tracks.find(t => t.notes.length > 0);
    if (!track) return leadInOffset;

    // Get active section bounds
    const bounds = this.getActiveSectionBounds();
    if (!bounds) return leadInOffset;

    const { startBeat, endBeat } = bounds;
    const isFullMode = this.sectionMode === 'full';

    let maxEndBeat = 0;

    track.notes.forEach((midiNote) => {
      // Convert tick timing to beats
      const noteBeat = midiNote.ticks / ppq;
      const durationBeats = midiNote.durationTicks / ppq;

      // In full mode, play all MIDI notes (avoid custom/MIDI boundary mismatch).
      // In section mode, filter by bounds.
      if (!isFullMode && (noteBeat < startBeat || noteBeat >= endBeat)) return;

      // Shift note to start from 0 relative to section start
      const offsetBeat = isFullMode ? 0 : startBeat;
      const relativeBeat = noteBeat - offsetBeat;
      const noteTimeBeats = leadInOffset + relativeBeat;
      const noteTimeSecs = this.beatsToSeconds(noteTimeBeats);
      const durationSecs = Math.max(0.05, this.beatsToSeconds(durationBeats));

      // Track actual end for accurate total duration
      const noteEndBeat = relativeBeat + durationBeats;
      if (noteEndBeat > maxEndBeat) maxEndBeat = noteEndBeat;

      // Apply transpose/octave shift
      const transposedMidi = midiNote.midi + this.transpose + (this.octaveShift * 12);
      const pitch = Tone.Frequency(transposedMidi, 'midi').toNote();

      const eventId = transport.schedule((time) => {
        synth.triggerAttackRelease(pitch, durationSecs, time, midiNote.velocity);
      }, noteTimeSecs);
      this.scheduledEvents.push(eventId);
    });

    // Use actual note content duration, not theoretical section bounds
    return leadInOffset + maxEndBeat;
  }

  private getActiveSectionBounds(): { startBeat: number; endBeat: number } | null {
    if (!this.midiData) return null;
    const sections = this.midiData.sections;
    if (sections.length === 0) return null;

    switch (this.sectionMode) {
      case 'A': {
        const sec = sections.find(s => s.name === 'A');
        return sec ? { startBeat: sec.start_beat, endBeat: sec.end_beat } : null;
      }
      case 'B': {
        const sec = sections.find(s => s.name === 'B');
        return sec ? { startBeat: sec.start_beat, endBeat: sec.end_beat } : null;
      }
      case 'full':
      default:
        return {
          startBeat: sections[0].start_beat,
          endBeat: sections[sections.length - 1].end_beat,
        };
    }
  }

  private convertPitchWithTranspose(pitch: string): string {
    return convertPitch(pitch, this.transpose, this.octaveShift);
  }

  private clearScheduledEvents(): void {
    const transport = Tone.getTransport();
    this.scheduledEvents.forEach(id => {
      transport.clear(id);
    });
    this.scheduledEvents = [];
  }

  async play(): Promise<void> {
    if (!this.tune) return;

    await Tone.start();

    // Load the appropriate instrument
    if (this.engine === 'soundfont') {
      this.soundfontLoading = true;
      this.onStateChange?.('stopped'); // trigger re-render to show loading
      await ensureActiveInstrument();
      this.soundfontLoading = false;
    } else {
      createSynth(this.synthType);
    }

    // Fetch MIDI data if using soundfont engine
    if (this.useMidi && !this.midiData && this.tune) {
      try {
        const tuneId = this.tune.id;
        const isPasted = tuneId === 'pasted' || tuneId === 'uploaded';
        this.midiData = isPasted
          ? await fetchMidiDataFromAbc(this.tune.abc, tuneId)
          : await fetchMidiData(tuneId);
      } catch (e) {
        console.warn('MIDI fetch failed, falling back to custom notes:', e);
        this.midiData = null;
      }
    }

    if (this.metronomeEnabled || this.countOffEnabled) {
      createMetronomeSynth(this.metronomeType);
    }

    if (this.playbackState === 'paused') {
      Tone.getTransport().start();
    } else {
      this.currentRepeat = 0;
      // Incremental speed-up: begin each run at the configured start tempo
      if (this.speedUpEnabled && this.bpm !== this.speedUpStartBpm) {
        this.setBpm(this.speedUpStartBpm);
        this.onBpmChange?.(this.bpm);
      }
      Tone.getTransport().stop();
      Tone.getTransport().position = 0;
      this.scheduleNotes();
      Tone.getTransport().start();
    }

    this.playbackState = 'playing';
    this.onStateChange?.('playing');
  }

  pause(): void {
    if (this.playbackState === 'playing') {
      Tone.getTransport().pause();
      this.playbackState = 'paused';
      this.onStateChange?.('paused');
    }
  }

  stop(): void {
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    this.clearScheduledEvents();
    this.playbackState = 'stopped';
    this.onStateChange?.('stopped');
  }

  getPlaybackState(): PlaybackState {
    return this.playbackState;
  }

  getTotalDuration(): number {
    return this.totalDurationSecs;
  }
}

export const tunePlayer = new TunePlayer();
