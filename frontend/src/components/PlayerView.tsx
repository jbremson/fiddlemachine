import { useState } from 'react';
import { NotationView } from './NotationView';
import { TransportControls } from './TransportControls';
import { OctaveControl } from './OctaveControl';
import { KeySelector } from './KeySelector';
import { MetronomeSelector } from './MetronomeSelector';
import { CountOffButton } from './CountOffButton';
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
  synthType: SynthType;
  transpose: number;
  octaveShift: number;
  metronomeEnabled: boolean;
  countOffEnabled: boolean;
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
  onCountOffToggle: (enabled: boolean) => void;
  onDismissError: () => void;
  onReloadAbc: (abc: string) => void;
}

export function PlayerView({
  tune,
  playbackState,
  bpm,
  repeatCount,
  loopForever,
  synthType,
  transpose,
  octaveShift,
  metronomeEnabled,
  countOffEnabled,
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
  onCountOffToggle,
  onDismissError,
  onReloadAbc,
}: PlayerViewProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showAbcEditor, setShowAbcEditor] = useState(false);
  const [abcText, setAbcText] = useState(tune.abc);

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

            <CountOffButton
              enabled={countOffEnabled}
              onToggle={onCountOffToggle}
            />

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

            <button
              className="settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
              aria-label="Settings"
              aria-expanded={showSettings}
            >
              ⚙
            </button>
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
        />

        <div className="edit-abc-section">
          <button
            className="edit-abc-link"
            onClick={() => {
              setAbcText(tune.abc);
              setShowAbcEditor(!showAbcEditor);
            }}
          >
            {showAbcEditor ? 'Hide ABC' : 'Edit ABC'}
          </button>

          {showAbcEditor && (
            <div className="abc-editor">
              <textarea
                value={abcText}
                onChange={(e) => setAbcText(e.target.value)}
                rows={12}
                spellCheck={false}
              />
              <button
                className="reload-abc-btn"
                onClick={() => onReloadAbc(abcText)}
              >
                Reload
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
