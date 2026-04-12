import { useState, useRef, useEffect, useCallback } from 'react';
import { NotationView } from './NotationView';
import { TransportControls } from './TransportControls';
import { OctaveControl } from './OctaveControl';
import { KeySelector } from './KeySelector';
import { MetronomeSelector } from './MetronomeSelector';
import { CountOffButton } from './CountOffButton';
import { RepeatSelector } from './RepeatSelector';
import { LoopButton } from './LoopButton';
import { SettingsPanel } from './SettingsPanel';
import { Tune, TuneInfo, PlaybackState, SetDetail, SetSummary } from '../types/tune';
import { SynthType, getSynthTypes } from '../audio/synth';
import { useAuth } from '../context/AuthContext';

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
  activeSet: SetDetail | null;
  activeSetIndex: number;
  onNextTune: () => void;
  onPrevTune: () => void;
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
  activeSet,
  activeSetIndex,
  onNextTune,
  onPrevTune,
}: PlayerViewProps) {
  const { isLoggedIn, logout } = useAuth();
  const playStartTime = useRef<number | null>(null);
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

  // Save state
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveTag, setSaveTag] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add to Set dialog state
  const [showAddToSet, setShowAddToSet] = useState(false);
  const [userSets, setUserSets] = useState<SetSummary[]>([]);
  const [addToSetSuccess, setAddToSetSuccess] = useState<string | null>(null);
  const [addToSetSelectedId, setAddToSetSelectedId] = useState<number | null>(null);
  const [addToSetBpm, setAddToSetBpm] = useState(bpm);
  const [addToSetTranspose, setAddToSetTranspose] = useState(transpose);
  const [addToSetOctave, setAddToSetOctave] = useState(octaveShift);
  const [addToSetSynth, setAddToSetSynth] = useState<SynthType>(synthType);
  const [addToSetMetronome, setAddToSetMetronome] = useState(metronomeEnabled);
  const [addToSetCountOff, setAddToSetCountOff] = useState(countOffEnabled);
  const [addToSetSubmitting, setAddToSetSubmitting] = useState(false);

  // Track play events for stats
  useEffect(() => {
    if (playbackState === 'playing') {
      playStartTime.current = Date.now();
    } else if (playStartTime.current && (playbackState === 'stopped' || playbackState === 'paused')) {
      const durationSeconds = (Date.now() - playStartTime.current) / 1000;
      playStartTime.current = null;
      // Only log if played for at least 3 seconds and user is logged in
      if (isLoggedIn && durationSeconds >= 3) {
        const isLibrary = !tune.id.startsWith('song_') && tune.id !== 'pasted' && tune.id !== 'uploaded';
        fetch('/api/stats/play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tune_ref: isLibrary ? tune.id : tune.id.replace('song_', ''),
            tune_source: isLibrary ? 'library' : 'user_song',
            tune_title: tune.title,
            bpm,
            transpose,
            duration_seconds: Math.round(durationSeconds),
          }),
        }).catch(() => {}); // fire and forget
      }
    }
  }, [playbackState]);

  const fetchNextTag = useCallback(async (name: string) => {
    if (!name.trim()) { setSaveTag('v1'); return; }
    try {
      const res = await fetch(`/api/songs/next-tag?name=${encodeURIComponent(name.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSaveTag(data.tag);
      }
    } catch {
      setSaveTag('v1');
    }
  }, []);

  const handleOpenSaveForm = () => {
    const name = tune.title || '';
    setSaveName(name);
    setSaveNotes('');
    setSaveError(null);
    setSaveSuccess(false);
    setShowSaveForm(true);
    fetchNextTag(name);
  };

  const handleSaveNameChange = (name: string) => {
    setSaveName(name);
    fetchNextTag(name);
  };

  const handleSaveSong = async () => {
    setIsSaving(true);
    setSaveError(null);
    const title = `${saveName.trim()} ${saveTag.trim()}`;
    try {
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, notes: saveNotes || null, abc_content: tune.abc }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setShowSaveForm(false);
      } else {
        const data = await res.json();
        setSaveError(data.detail || 'Failed to save song');
      }
    } catch {
      setSaveError('Failed to save song');
    } finally {
      setIsSaving(false);
    }
  };

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
        <div className="tune-title-area">
          <div className="tune-title-row">
            {activeSet && activeSetIndex > 0 && (
              <button className="set-nav-btn" onClick={onPrevTune} aria-label="Previous tune">←</button>
            )}
            <h1 className="tune-title">{tune.title}</h1>
            {activeSet && activeSetIndex < activeSet.items.length - 1 && (
              <button className="set-nav-btn" onClick={onNextTune} aria-label="Next tune">→</button>
            )}
          </div>
          {activeSet && (
            <div className="set-position-indicator">{activeSetIndex + 1}/{activeSet.items.length}</div>
          )}
        </div>
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
              {isLoggedIn && (
                <button
                  className="menu-item"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                >
                  Sign out
                </button>
              )}
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

        <div className="tune-actions-bar">
          <button
            className="action-btn save-action"
            disabled={!isLoggedIn || showSaveForm}
            title={!isLoggedIn ? 'Login required' : 'Save song'}
            onClick={handleOpenSaveForm}
          >
            Save
          </button>
          <button
            className="action-btn"
            disabled={!isLoggedIn}
            title={!isLoggedIn ? 'Login required' : 'Add to set'}
            onClick={async () => {
              setAddToSetSuccess(null);
              setAddToSetBpm(bpm);
              setAddToSetTranspose(transpose);
              setAddToSetOctave(octaveShift);
              setAddToSetSynth(synthType);
              setAddToSetMetronome(metronomeEnabled);
              setAddToSetCountOff(countOffEnabled);
              setAddToSetSelectedId(null);
              setAddToSetSubmitting(false);
              setShowAddToSet(true);
              const res = await fetch('/api/sets');
              if (res.ok) {
                const sets = await res.json();
                setUserSets(sets);
                if (sets.length > 0) setAddToSetSelectedId(sets[0].id);
              }
            }}
          >
            Add to Set
          </button>
          <button
            className="action-btn"
            onClick={() => {
              setAbcText(tune.abc);
              setShowAbcEditor(!showAbcEditor);
            }}
          >
            {showAbcEditor ? 'Hide ABC' : 'Edit ABC'}
          </button>
        </div>

        {saveSuccess && <div className="save-success" style={{ textAlign: 'center' }}>Song saved!</div>}
        {addToSetSuccess && <div className="save-success" style={{ textAlign: 'center' }}>{addToSetSuccess}</div>}

        <NotationView
          tune={tune}
          transpose={transpose}
        />

        {showSaveForm && (
          <div className="save-form">
            <div className="save-form-row">
              <input
                type="text"
                placeholder="Name"
                value={saveName}
                onChange={(e) => handleSaveNameChange(e.target.value)}
              />
              <input
                type="text"
                placeholder="Tag"
                value={saveTag}
                onChange={(e) => setSaveTag(e.target.value)}
                style={{ maxWidth: '80px' }}
              />
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={saveNotes}
              onChange={(e) => setSaveNotes(e.target.value)}
              rows={2}
            />
            {saveError && <div className="save-error">{saveError}</div>}
            <div className="save-form-actions">
              <button onClick={handleSaveSong} disabled={!saveName.trim() || !saveTag.trim() || isSaving}>
                {isSaving ? 'Saving...' : 'Save Song'}
              </button>
              <button className="cancel-btn" onClick={() => setShowSaveForm(false)}>Cancel</button>
            </div>
          </div>
        )}

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
              <h3>April 2026</h3>
              <ul>
                <li>Practice stats with play tracking and history</li>
                <li>Added hundreds of popular tunes from thesession.org</li>
              </ul>
              <h3>March 2026</h3>
              <ul>
                <li>Faster tune list loading</li>
                <li>Fixed pickup and repeat handling for tunes like Old Joe Clark and Angeline the Baker</li>
                <li>Email sign-in option</li>
                <li>My Sets with drag-to-reorder</li>
              </ul>
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

      {showAddToSet && (
        <div className="add-to-set-overlay" onClick={() => setShowAddToSet(false)}>
          <div className="add-to-set-popup" onClick={(e) => e.stopPropagation()}>
            <button
              className="about-close"
              onClick={() => setShowAddToSet(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2>Add to Set</h2>
            {userSets.length === 0 ? (
              <p className="empty">No sets yet. Create one from the tune list.</p>
            ) : (
              <div className="add-to-set-form">
                <div className="add-to-set-field">
                  <label>Set</label>
                  <select
                    value={addToSetSelectedId ?? ''}
                    onChange={(e) => setAddToSetSelectedId(Number(e.target.value))}
                  >
                    {userSets.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.item_count})</option>
                    ))}
                  </select>
                </div>
                <div className="add-to-set-field">
                  <label>BPM</label>
                  <input
                    type="number"
                    value={addToSetBpm}
                    onChange={(e) => setAddToSetBpm(Number(e.target.value))}
                    min={30}
                    max={300}
                  />
                </div>
                <div className="add-to-set-field">
                  <label>Transpose</label>
                  <select
                    value={addToSetTranspose}
                    onChange={(e) => setAddToSetTranspose(Number(e.target.value))}
                  >
                    {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(t => (
                      <option key={t} value={t}>
                        {t === 0 ? 'Original' : `${t > 0 ? '+' : ''}${t} semitones`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="add-to-set-field">
                  <label>Octave Shift</label>
                  <input
                    type="number"
                    value={addToSetOctave}
                    onChange={(e) => setAddToSetOctave(Number(e.target.value))}
                    min={-3}
                    max={3}
                  />
                </div>
                <div className="add-to-set-field">
                  <label>Synth</label>
                  <select
                    value={addToSetSynth}
                    onChange={(e) => setAddToSetSynth(e.target.value as SynthType)}
                  >
                    {getSynthTypes().map(st => (
                      <option key={st.value} value={st.value}>{st.name}</option>
                    ))}
                  </select>
                </div>
                <div className="add-to-set-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={addToSetMetronome}
                      onChange={(e) => setAddToSetMetronome(e.target.checked)}
                    />
                    Metronome
                  </label>
                </div>
                <div className="add-to-set-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={addToSetCountOff}
                      onChange={(e) => setAddToSetCountOff(e.target.checked)}
                    />
                    Count-off
                  </label>
                </div>
                <div className="add-to-set-actions">
                  <button className="cancel-btn" onClick={() => setShowAddToSet(false)}>Cancel</button>
                  <button
                    className="add-btn"
                    disabled={!addToSetSelectedId || addToSetSubmitting}
                    onClick={async () => {
                      if (!addToSetSelectedId) return;
                      setAddToSetSubmitting(true);
                      const isLibrary = !tune.id.startsWith('song_') && tune.id !== 'pasted';
                      const tuneSource = isLibrary ? 'library' : 'user_song';
                      const tuneRef = isLibrary ? tune.id : tune.id.replace('song_', '');
                      const res = await fetch(`/api/sets/${addToSetSelectedId}/items`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          tune_source: tuneSource,
                          tune_ref: tuneRef,
                          tune_title: tune.title,
                          bpm: addToSetBpm,
                          transpose: addToSetTranspose,
                          octave_shift: addToSetOctave,
                          synth_type: addToSetSynth,
                          metronome_enabled: addToSetMetronome,
                          count_off_enabled: addToSetCountOff,
                        }),
                      });
                      setAddToSetSubmitting(false);
                      if (res.ok) {
                        const setName = userSets.find(s => s.id === addToSetSelectedId)?.name || 'set';
                        setAddToSetSuccess(`Added to "${setName}"`);
                        setShowAddToSet(false);
                      }
                    }}
                  >
                    {addToSetSubmitting ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
