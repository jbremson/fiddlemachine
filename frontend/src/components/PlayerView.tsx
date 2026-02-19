import { useState } from 'react';
import { NotationView } from './NotationView';
import { TransportControls } from './TransportControls';
import { OctaveControl } from './OctaveControl';
import { KeySelector } from './KeySelector';
import { MetronomeSelector } from './MetronomeSelector';
import { RepeatSelector } from './RepeatSelector';
import { LoopButton } from './LoopButton';
import { SettingsPanel } from './SettingsPanel';
import { Tune, PlaybackState } from '../types/tune';
import { SynthType } from '../audio/synth';

interface PlayerViewProps {
  tune: Tune;
  playbackState: PlaybackState;
  bpm: number;
  repeatCount: number;
  loopForever: boolean;
  progress: number;
  synthType: SynthType;
  transpose: number;
  octaveShift: number;
  metronomeEnabled: boolean;
  error: string | null;
  onBack: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
  onRepeatCountChange: (count: number) => void;
  onLoopForeverChange: (loop: boolean) => void;
  onToneChange: (tone: SynthType) => void;
  onOctaveChange: (shift: number) => void;
  onTransposeChange: (semitones: number) => void;
  onMetronomeToggle: (enabled: boolean) => void;
  onDismissError: () => void;
}

export function PlayerView({
  tune,
  playbackState,
  bpm,
  repeatCount,
  loopForever,
  progress,
  synthType,
  transpose,
  octaveShift,
  metronomeEnabled,
  error,
  onBack,
  onPlay,
  onPause,
  onStop,
  onBpmChange,
  onRepeatCountChange,
  onLoopForeverChange,
  onToneChange,
  onOctaveChange,
  onTransposeChange,
  onMetronomeToggle,
  onDismissError,
}: PlayerViewProps) {
  const [showSettings, setShowSettings] = useState(false);
  const highlightOffset = 0;

  return (
    <div className="app player-page">
      <header className="player-header">
        <button
          className="back-btn"
          onClick={onBack}
          aria-label="Back to tune list"
        >
          ← Back
        </button>
        <h1 className="tune-title">{tune.title}</h1>
        <button
          className="settings-btn"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
          aria-label="Settings"
          aria-expanded={showSettings}
        >
          ⚙
        </button>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={onDismissError} aria-label="Dismiss error">×</button>
        </div>
      )}

      <main className="player-main">
        <div className="controls-bar">
          <div className="controls-row">
            <KeySelector
              currentKey={tune.key}
              transpose={transpose}
              onTransposeChange={onTransposeChange}
            />

            <OctaveControl
              octaveShift={octaveShift}
              onOctaveChange={onOctaveChange}
            />
          </div>

          <div className="controls-row">
            <TransportControls
              playbackState={playbackState}
              onPlay={onPlay}
              onPause={onPause}
              onStop={onStop}
              disabled={false}
            />

            <div className="tempo-control" role="group" aria-label="Tempo control">
              <button
                className="tempo-btn"
                onClick={() => onBpmChange(bpm - 5)}
                aria-label="Decrease tempo"
              >
                −
              </button>
              <span className="tempo-display" aria-live="polite">{bpm} <small>BPM</small></span>
              <button
                className="tempo-btn"
                onClick={() => onBpmChange(bpm + 5)}
                aria-label="Increase tempo"
              >
                +
              </button>
            </div>

            <MetronomeSelector
              enabled={metronomeEnabled}
              onToggle={onMetronomeToggle}
            />

            <RepeatSelector
              repeatCount={repeatCount}
              onRepeatCountChange={onRepeatCountChange}
            />

            <LoopButton
              looping={loopForever}
              onToggle={onLoopForeverChange}
            />
          </div>

          {showSettings && (
            <SettingsPanel
              synthType={synthType}
              onSynthTypeChange={onToneChange}
              onClose={() => setShowSettings(false)}
            />
          )}
        </div>

        <NotationView
          tune={tune}
          transpose={transpose}
          progress={progress}
          isPlaying={playbackState === 'playing'}
          highlightOffset={highlightOffset}
        />
      </main>
    </div>
  );
}
