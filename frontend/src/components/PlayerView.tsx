import { useState, useRef, useEffect } from 'react';
import { NotationView } from './NotationView';
import { TransportControls } from './TransportControls';
import { OctaveControl } from './OctaveControl';
import { KeySelector } from './KeySelector';
import { MetronomeSelector } from './MetronomeSelector';
import { CountOffButton } from './CountOffButton';
import { RepeatSelector } from './RepeatSelector';
import { LoopButton } from './LoopButton';
import { SettingsPanel } from './SettingsPanel';
import { Tune, TuneInfo, PlaybackState } from '../types/tune';
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
  const [showAbout, setShowAbout] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showTuneInfo, setShowTuneInfo] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [tuneMetadata, setTuneMetadata] = useState<TuneInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [abcText, setAbcText] = useState(tune.abc);
  const abcEditorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAbcEditor && abcEditorRef.current) {
      abcEditorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [showAbcEditor]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTuneMetadata = async () => {
    try {
      const response = await fetch(`/api/tunes`);
      if (response.ok) {
        const tunes: TuneInfo[] = await response.json();
        const info = tunes.find(t => t.id === tune.id);
        setTuneMetadata(info || null);
      }
    } catch (err) {
      console.error('Failed to fetch tune metadata:', err);
    }
    setShowTuneInfo(true);
  };

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
        <div className="header-menu" ref={menuRef}>
          <button
            className="menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span className="menu-icon">☰</span>
            <span className="menu-label">Menu</span>
          </button>
          {menuOpen && (
            <div className="menu-dropdown menu-dropdown-right">
              <button
                className="menu-item"
                onClick={() => {
                  setShowChangelog(true);
                  setMenuOpen(false);
                }}
              >
                Changelog
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  setShowAbout(true);
                  setMenuOpen(false);
                }}
              >
                About
              </button>
            </div>
          )}
        </div>
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
              className="info-btn"
              onClick={fetchTuneMetadata}
              title="Tune Info"
              aria-label="Tune Info"
            >
              ℹ
            </button>

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
            <div className="abc-editor" ref={abcEditorRef}>
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

        <div className="debug-section">
          <button
            className="debug-link"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Hide Debug' : 'Debug'}
          </button>
        </div>
      </main>

      {showAbout && (
        <div className="about-overlay" onClick={() => setShowAbout(false)}>
          <div className="about-popup" onClick={(e) => e.stopPropagation()}>
            <button
              className="about-close"
              onClick={() => setShowAbout(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2>About FiddleMachine</h2>
            <p>
              FiddleMachine is a web application for learning fiddle tunes by ear.
              Load tunes from URLs, paste ABC notation, or browse the built-in library
              of public domain traditional tunes.
            </p>
            <p>
              Features include adjustable tempo, octave shifting, key transposition,
              metronome, count-off, and looping.
            </p>
            <div className="about-contact">
              <p>Built and maintained by <strong>Joel Bremson</strong></p>
              <p>
                <a href="mailto:info@fiddlemachine.com">info@fiddlemachine.com</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {showChangelog && (
        <div className="about-overlay" onClick={() => setShowChangelog(false)}>
          <div className="about-popup changelog-popup" onClick={(e) => e.stopPropagation()}>
            <button
              className="about-close"
              onClick={() => setShowChangelog(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2>Changelog</h2>
            <div className="changelog-content">
              <h3>February 2026</h3>
              <ul>
                <li>Updated playback logic to reduce pickup bar tracking errors</li>
                <li>New golden brown color scheme</li>
                <li>Edit ABC feature with live reload</li>
                <li>Improved zoom controls</li>
                <li>Print button for notation</li>
                <li>Scrollable notation view</li>
              </ul>
              <h3>January 2026</h3>
              <ul>
                <li>Initial release</li>
                <li>ABC notation playback</li>
                <li>Tempo control</li>
                <li>Key transposition</li>
                <li>Metronome and count-off</li>
                <li>Loop and repeat controls</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {showTuneInfo && (
        <div className="about-overlay" onClick={() => setShowTuneInfo(false)}>
          <div className="about-popup tune-info-popup" onClick={(e) => e.stopPropagation()}>
            <button
              className="about-close"
              onClick={() => setShowTuneInfo(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2>Tune Info</h2>
            <div className="tune-info-content">
              <div className="tune-info-row">
                <span className="tune-info-label">Title:</span>
                <span className="tune-info-value">{tune.title}</span>
              </div>
              <div className="tune-info-row">
                <span className="tune-info-label">Key:</span>
                <span className="tune-info-value">{tune.key}</span>
              </div>
              <div className="tune-info-row">
                <span className="tune-info-label">Time:</span>
                <span className="tune-info-value">{tune.time_signature}</span>
              </div>
              <div className="tune-info-row">
                <span className="tune-info-label">Default Tempo:</span>
                <span className="tune-info-value">{tune.default_tempo} BPM</span>
              </div>
              {tuneMetadata && (
                <>
                  <div className="tune-info-row">
                    <span className="tune-info-label">Source:</span>
                    <span className="tune-info-value">{tuneMetadata.source || 'Unknown'}</span>
                  </div>
                  {tuneMetadata.source_url && (
                    <div className="tune-info-row">
                      <span className="tune-info-label">URL:</span>
                      <span className="tune-info-value">
                        <a href={tuneMetadata.source_url} target="_blank" rel="noopener noreferrer">
                          {tuneMetadata.source_url}
                        </a>
                      </span>
                    </div>
                  )}
                  {tuneMetadata.rating !== null && tuneMetadata.rating !== undefined && (
                    <div className="tune-info-row">
                      <span className="tune-info-label">Rating:</span>
                      <span className="tune-info-value">
                        {tuneMetadata.rating.toFixed(1)} ({tuneMetadata.rating_count} ratings)
                      </span>
                    </div>
                  )}
                  {tuneMetadata.owner && (
                    <div className="tune-info-row">
                      <span className="tune-info-label">Owner:</span>
                      <span className="tune-info-value">{tuneMetadata.owner}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showDebug && (
        <div className="about-overlay" onClick={() => setShowDebug(false)}>
          <div className="about-popup debug-popup" onClick={(e) => e.stopPropagation()}>
            <button
              className="about-close"
              onClick={() => setShowDebug(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2>Debug Info</h2>
            <div className="debug-content">
              <h3>Stored ABC</h3>
              <pre className="debug-abc">{tune.abc}</pre>

              <h3>Sections</h3>
              {tune.sections.map((section, i) => (
                <div key={i} className="debug-section-info">
                  <h4>Section {section.name} (repeat: {section.repeat})</h4>
                  <p>Notes: {section.notes.length} | Playback notes: {section.playback_notes?.length || 0}</p>
                  <details>
                    <summary>Original notes</summary>
                    <pre className="debug-notes">
                      {section.notes.map(n => `${n.pitch} @ ${n.start_time.toFixed(2)} (dur: ${n.duration})`).join('\n')}
                    </pre>
                  </details>
                  <details>
                    <summary>Expanded playback notes</summary>
                    <pre className="debug-notes">
                      {section.playback_notes?.map(n => `${n.pitch} @ ${n.start_time.toFixed(2)} (dur: ${n.duration})`).join('\n') || 'None'}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
