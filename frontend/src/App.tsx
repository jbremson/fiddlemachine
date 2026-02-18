import { useState, useEffect, useCallback } from 'react';
import { TuneBrowser } from './components/TuneBrowser';
import { NotationView } from './components/NotationView';
import { TransportControls } from './components/TransportControls';
import { InstrumentToggle } from './components/InstrumentToggle';
import { KeySelector } from './components/KeySelector';
import { MetronomeSelector } from './components/MetronomeSelector';
import { RepeatSelector } from './components/RepeatSelector';
import { SettingsPanel } from './components/SettingsPanel';
import { tunePlayer } from './audio/player';
import { SynthType } from './audio/synth';
import { Tune, TuneSummary, PlaybackState } from './types/tune';
import './styles/main.css';

export function App() {
  const [tunes, setTunes] = useState<TuneSummary[]>([]);
  const [loadingTunes, setLoadingTunes] = useState(true);
  const [selectedTune, setSelectedTune] = useState<Tune | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [bpm, setBpm] = useState(120);
  const [repeatCount, setRepeatCount] = useState(2);
  const [loopForever, setLoopForever] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [synthType, setSynthType] = useState<SynthType>('fiddle');
  const [transpose, setTranspose] = useState(0);
  const [instrument, setInstrument] = useState<'fiddle' | 'mandolin'>('fiddle');
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const highlightOffset = 0;

  // Fetch tune list on mount
  useEffect(() => {
    async function fetchTunes() {
      try {
        const response = await fetch('/api/tunes');
        if (response.ok) {
          const data = await response.json();
          setTunes(data);
          setError(null);
        } else {
          setError('Failed to load tune list');
        }
      } catch (err) {
        console.error('Failed to fetch tunes:', err);
        setError('Failed to connect to server');
      } finally {
        setLoadingTunes(false);
      }
    }
    fetchTunes();
  }, []);

  // Initialize audio player callbacks
  useEffect(() => {
    tunePlayer.setOnStateChange(setPlaybackState);
    tunePlayer.setOnProgress(setProgress);
  }, []);

  // Load selected tune
  const handleSelectTune = useCallback(async (tuneId: string) => {
    try {
      const response = await fetch(`/api/tunes/${tuneId}`);
      if (response.ok) {
        const tune: Tune = await response.json();
        setSelectedTune(tune);
        tunePlayer.setTune(tune);
        setBpm(tune.default_tempo);
        setProgress(0);
        setTranspose(0);
        setError(null);
      } else {
        setError('Failed to load tune');
      }
    } catch (err) {
      console.error('Failed to fetch tune:', err);
      setError('Failed to load tune');
    }
  }, []);

  // Initialize audio on first play
  const initializeAudio = useCallback(async () => {
    if (!audioInitialized) {
      await tunePlayer.initialize();
      setAudioInitialized(true);
    }
  }, [audioInitialized]);

  const handlePlay = useCallback(async () => {
    await initializeAudio();
    tunePlayer.play();
  }, [initializeAudio]);

  const handlePause = useCallback(() => {
    tunePlayer.pause();
  }, []);

  const handleStop = useCallback(() => {
    tunePlayer.stop();
    setProgress(0);
  }, []);

  const handleBpmChange = useCallback((newBpm: number) => {
    setBpm(newBpm);
    tunePlayer.setBpm(newBpm);
  }, []);

  const handleRepeatCountChange = useCallback((count: number) => {
    setRepeatCount(count);
    tunePlayer.setRepeatCount(count);
  }, []);

  const handleLoopForeverChange = useCallback((loop: boolean) => {
    setLoopForever(loop);
    tunePlayer.setLooping(loop);
  }, []);

  const handleToneChange = useCallback((tone: SynthType) => {
    setSynthType(tone);
    tunePlayer.setSynthType(tone);
  }, []);

  const handleInstrumentChange = useCallback((inst: 'fiddle' | 'mandolin') => {
    setInstrument(inst);
    // Mandolin is +1 octave from fiddle
    tunePlayer.setOctaveShift(inst === 'mandolin' ? 1 : 0);
  }, []);

  const handleTransposeChange = useCallback((semitones: number) => {
    // Limit to +/- 12 semitones (one octave)
    const limited = Math.max(-12, Math.min(12, semitones));
    setTranspose(limited);
    tunePlayer.setTranspose(limited);
  }, []);

  const handleMetronomeToggle = useCallback((enabled: boolean) => {
    setMetronomeEnabled(enabled);
    tunePlayer.setMetronome(enabled);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>FiddleMachine</h1>
        <p>Learn fiddle tunes by ear</p>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error">×</button>
        </div>
      )}

      <main className="app-main">
        <aside className="sidebar">
          <TuneBrowser
            tunes={tunes}
            selectedTuneId={selectedTune?.id ?? null}
            onSelectTune={handleSelectTune}
            loading={loadingTunes}
          />
        </aside>

        <section className="content">
          <div className="controls-bar">
            <div className="controls-row">
              <KeySelector
                currentKey={selectedTune?.key ?? 'C'}
                transpose={transpose}
                onTransposeChange={handleTransposeChange}
              />

              <InstrumentToggle
                instrument={instrument}
                onInstrumentChange={handleInstrumentChange}
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

            <div className="controls-row">
              <TransportControls
                playbackState={playbackState}
                onPlay={handlePlay}
                onPause={handlePause}
                onStop={handleStop}
                disabled={!selectedTune}
              />

              <div className="tempo-control" role="group" aria-label="Tempo control">
                <button
                  className="tempo-btn"
                  onClick={() => handleBpmChange(bpm - 5)}
                  aria-label="Decrease tempo"
                >
                  −
                </button>
                <span className="tempo-display" aria-live="polite">{bpm} <small>BPM</small></span>
                <button
                  className="tempo-btn"
                  onClick={() => handleBpmChange(bpm + 5)}
                  aria-label="Increase tempo"
                >
                  +
                </button>
              </div>

              <MetronomeSelector
                enabled={metronomeEnabled}
                onToggle={handleMetronomeToggle}
              />

              <RepeatSelector
                repeatCount={repeatCount}
                loopForever={loopForever}
                onRepeatCountChange={handleRepeatCountChange}
                onLoopForeverChange={handleLoopForeverChange}
              />
            </div>

            {showSettings && (
              <SettingsPanel
                synthType={synthType}
                onSynthTypeChange={handleToneChange}
                onClose={() => setShowSettings(false)}
              />
            )}
          </div>

          <NotationView
            tune={selectedTune}
            transpose={transpose}
            progress={progress}
            isPlaying={playbackState === 'playing'}
            highlightOffset={highlightOffset}
          />
        </section>
      </main>
    </div>
  );
}
