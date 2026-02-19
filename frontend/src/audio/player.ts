import * as Tone from 'tone';
import { Section, Tune, PlaybackState, SectionMode } from '../types/tune';
import { createSynth, getSynth, createMetronomeSynth, getMetronomeSynth, SynthType, MetronomeType } from './synth';
import { convertPitch } from './pitch';

type PlaybackCallback = (state: PlaybackState) => void;
type ProgressCallback = (progress: number) => void;

class TunePlayer {
  private tune: Tune | null = null;
  private sectionMode: SectionMode = 'full';
  private bpm: number = 120;
  private isLooping: boolean = false;
  private repeatCount: number = 2;
  private currentRepeat: number = 0;
  private scheduledEvents: number[] = [];
  private playbackState: PlaybackState = 'stopped';
  private onStateChange: PlaybackCallback | null = null;
  private onProgress: ProgressCallback | null = null;
  private progressInterval: number | null = null;
  private totalDurationSecs: number = 0;
  private synthType: SynthType = 'fiddle';
  private transpose: number = 0;
  private octaveShift: number = 0;
  private metronomeEnabled: boolean = false;
  private metronomeType: MetronomeType = 'click1';
  private beatsPerMeasure: number = 4;

  async initialize(): Promise<void> {
    await Tone.start();
    createSynth(this.synthType);
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
    this.bpm = tune.default_tempo;
    Tone.getTransport().bpm.value = this.bpm;
    // Parse time signature for metronome
    const timeParts = tune.time_signature.split('/');
    this.beatsPerMeasure = parseInt(timeParts[0]) || 4;
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

  setBpm(bpm: number): void {
    this.bpm = Math.max(30, Math.min(160, bpm));
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

  setOnProgress(callback: ProgressCallback): void {
    this.onProgress = callback;
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

  private scheduleNotes(): void {
    const synth = getSynth();
    if (!synth || !this.tune) return;

    this.clearScheduledEvents();

    const sections = this.getSectionsToPlay();
    if (sections.length === 0) return;

    let sectionOffsetBeats = 0;
    const transport = Tone.getTransport();

    sections.forEach((section) => {
      // Use the section's repeat count from the parsed data (default to 1 if not specified)
      const repeatCount = section.repeat || 1;

      // Calculate section duration and detect pickup notes
      const sectionBeats = section.notes.length > 0
        ? Math.max(...section.notes.map(n => n.start_time + n.duration))
        : 4;

      // Detect pickup: if total duration is not a multiple of 4 beats (one bar in 4/4)
      // the section likely has a pickup. Calculate pickup duration.
      const barsFloat = sectionBeats / this.beatsPerMeasure;
      const fullBars = Math.floor(barsFloat);
      const pickupBeats = sectionBeats - (fullBars * this.beatsPerMeasure);
      const hasPickup = pickupBeats > 0 && pickupBeats < this.beatsPerMeasure;

      // Play the section repeatCount times
      for (let rep = 0; rep < repeatCount; rep++) {
        // On repeat (rep > 0), skip pickup notes - they're replaced by the ending
        const skipBeats = (rep > 0 && hasPickup) ? pickupBeats : 0;

        section.notes.forEach((note) => {
          // Skip pickup notes on repeat
          if (note.start_time < skipBeats) {
            return;
          }

          // Adjust timing: subtract pickup on repeats so section starts at offset
          const adjustedStartTime = note.start_time - skipBeats;
          const noteTimeBeats = sectionOffsetBeats + adjustedStartTime;
          const durationBeats = note.duration;

          // Convert to seconds
          const noteTimeSecs = this.beatsToSeconds(noteTimeBeats);
          const durationSecs = Math.max(0.1, this.beatsToSeconds(durationBeats));

          const eventId = transport.schedule((time) => {
            // Convert ABC pitch notation to Tone.js format
            const pitch = this.convertPitchWithTranspose(note.pitch);
            synth.triggerAttackRelease(pitch, durationSecs, time);
          }, noteTimeSecs);

          this.scheduledEvents.push(eventId);
        });

        // Add section duration to offset (minus pickup on repeat since we skipped it)
        const repeatDuration = (rep === 0) ? sectionBeats : (sectionBeats - skipBeats);
        sectionOffsetBeats += repeatDuration;
      }
    });

    // Store total duration for progress calculation
    this.totalDurationSecs = this.beatsToSeconds(sectionOffsetBeats);

    // Schedule metronome clicks if enabled
    if (this.metronomeEnabled) {
      const metronome = getMetronomeSynth();
      if (metronome) {
        // Schedule a click on each beat - single tone
        const totalBeats = sectionOffsetBeats;
        const clickPitch = 'C5'; // Single consistent pitch
        for (let beat = 0; beat < totalBeats; beat++) {
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
        // Reset and continue
        transport.stop();
        transport.position = 0;
        this.scheduleNotes();
        transport.start();
      } else {
        this.stop();
      }
    }, this.totalDurationSecs);

    this.scheduledEvents.push(endEventId);
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

  private startProgressUpdates(): void {
    this.stopProgressUpdates();
    this.progressInterval = window.setInterval(() => {
      if (this.totalDurationSecs > 0 && this.onProgress) {
        const currentTime = Tone.getTransport().seconds;
        const progress = Math.min(1, currentTime / this.totalDurationSecs);
        this.onProgress(progress);
      }
    }, 50); // Update ~20 times per second for smooth highlight
  }

  private stopProgressUpdates(): void {
    if (this.progressInterval !== null) {
      window.clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  async play(): Promise<void> {
    if (!this.tune) return;

    await Tone.start();
    createSynth(this.synthType);
    if (this.metronomeEnabled) {
      createMetronomeSynth(this.metronomeType);
    }

    if (this.playbackState === 'paused') {
      Tone.getTransport().start();
    } else {
      this.currentRepeat = 0;
      this.scheduleNotes();
      Tone.getTransport().start();
    }

    this.startProgressUpdates();
    this.playbackState = 'playing';
    this.onStateChange?.('playing');
  }

  pause(): void {
    if (this.playbackState === 'playing') {
      Tone.getTransport().pause();
      this.stopProgressUpdates();
      this.playbackState = 'paused';
      this.onStateChange?.('paused');
    }
  }

  stop(): void {
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    this.clearScheduledEvents();
    this.stopProgressUpdates();
    this.playbackState = 'stopped';
    this.onProgress?.(0);
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
