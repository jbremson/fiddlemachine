import { useState, useEffect, useCallback } from 'react';
import { TuneBrowser } from './components/TuneBrowser';
import { NotationView } from './components/NotationView';
import { NotationViewV1 } from './components/NotationViewV1';
import { NotationViewV2 } from './components/NotationViewV2';
import { NotationViewV3 } from './components/NotationViewV3';
import { TransportControls } from './components/TransportControls';
import { TempoSlider } from './components/TempoSlider';
import { SectionSelector } from './components/SectionSelector';
import { ToneSelector } from './components/ToneSelector';
import { KeySelector } from './components/KeySelector';
import { OctaveSelector } from './components/OctaveSelector';
import { MetronomeSelector } from './components/MetronomeSelector';
import { HighlightOffsetSlider } from './components/HighlightOffsetSlider';
import { tunePlayer } from './audio/player';
import { SynthType, MetronomeType } from './audio/synth';
import { Tune, TuneSummary, PlaybackState, SectionMode } from './types/tune';
import './styles/main.css';

type HighlightVersion = 'current' | 'v1' | 'v2' | 'v3';

export function App() {
  const [tunes, setTunes] = useState<TuneSummary[]>([]);
  const [loadingTunes, setLoadingTunes] = useState(true);
  const [selectedTune, setSelectedTune] = useState<Tune | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [bpm, setBpm] = useState(120);
  const [sectionMode, setSectionMode] = useState<SectionMode>('full');
  const [progress, setProgress] = useState(0);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [synthType, setSynthType] = useState<SynthType>('fiddle');
  const [transpose, setTranspose] = useState(0);
  const [octaveShift, setOctaveShift] = useState(0);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeType, setMetronomeType] = useState<MetronomeType>('click1');
  const [highlightOffset, setHighlightOffset] = useState(0);
  const [highlightVersion, setHighlightVersion] = useState<HighlightVersion>('v1');

  // Fetch tune list on mount
  useEffect(() => {
    async function fetchTunes() {
      try {
        const response = await fetch('/api/tunes');
        if (response.ok) {
          const data = await response.json();
          setTunes(data);
        }
      } catch (error) {
        console.error('Failed to fetch tunes:', error);
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
        setSectionMode('full');
        setTranspose(0);
        setOctaveShift(0);
      }
    } catch (error) {
      console.error('Failed to fetch tune:', error);
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

  const handleSectionChange = useCallback((mode: SectionMode) => {
    setSectionMode(mode);
    tunePlayer.setSectionMode(mode);
    setProgress(0);
  }, []);

  const handleToneChange = useCallback((tone: SynthType) => {
    setSynthType(tone);
    tunePlayer.setSynthType(tone);
  }, []);

  const handleTransposeChange = useCallback((semitones: number) => {
    // Limit to +/- 12 semitones (one octave)
    const limited = Math.max(-12, Math.min(12, semitones));
    setTranspose(limited);
    tunePlayer.setTranspose(limited);
  }, []);

  const handleOctaveChange = useCallback((octaves: number) => {
    // Limit to +/- 2 octaves
    const limited = Math.max(-2, Math.min(2, octaves));
    setOctaveShift(limited);
    tunePlayer.setOctaveShift(limited);
  }, []);

  const handleMetronomeToggle = useCallback((enabled: boolean) => {
    setMetronomeEnabled(enabled);
    tunePlayer.setMetronome(enabled);
  }, []);

  const handleMetronomeTypeChange = useCallback((type: MetronomeType) => {
    setMetronomeType(type);
    tunePlayer.setMetronomeType(type);
  }, []);

  const hasASections = selectedTune?.sections.some((s) => s.name === 'A') ?? false;
  const hasBSections = selectedTune?.sections.some((s) => s.name === 'B') ?? false;

  const renderNotationView = () => {
    const props = {
      tune: selectedTune,
      transpose,
      progress,
      isPlaying: playbackState === 'playing',
      highlightOffset
    };

    switch (highlightVersion) {
      case 'v1':
        return <NotationViewV1 {...props} />;
      case 'v2':
        return <NotationViewV2 {...props} />;
      case 'v3':
        return <NotationViewV3 {...props} />;
      case 'current':
      default:
        return <NotationView {...props} />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>FiddleMachine</h1>
        <p>Learn fiddle tunes by ear</p>
      </header>

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
          {renderNotationView()}

          <div className="controls">
            <TransportControls
              playbackState={playbackState}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
              disabled={!selectedTune}
            />

            <TempoSlider
              bpm={bpm}
              onBpmChange={handleBpmChange}
            />

            <SectionSelector
              sectionMode={sectionMode}
              onSectionChange={handleSectionChange}
              hasASections={hasASections}
              hasBSections={hasBSections}
            />

            <ToneSelector
              selectedTone={synthType}
              onToneChange={handleToneChange}
            />

            <KeySelector
              currentKey={selectedTune?.key ?? 'C'}
              transpose={transpose}
              onTransposeChange={handleTransposeChange}
            />

            <OctaveSelector
              octaveShift={octaveShift}
              onOctaveChange={handleOctaveChange}
            />

            <MetronomeSelector
              enabled={metronomeEnabled}
              onToggle={handleMetronomeToggle}
              metronomeType={metronomeType}
              onTypeChange={handleMetronomeTypeChange}
            />

            <HighlightOffsetSlider
              offset={highlightOffset}
              onOffsetChange={setHighlightOffset}
            />

            <div className="highlight-switcher">
              <span>Highlight:</span>
              <button
                className={highlightVersion === 'current' ? 'active' : ''}
                onClick={() => setHighlightVersion('current')}
              >
                Current
              </button>
              <button
                className={highlightVersion === 'v1' ? 'active' : ''}
                onClick={() => setHighlightVersion('v1')}
              >
                V1
              </button>
              <button
                className={highlightVersion === 'v2' ? 'active' : ''}
                onClick={() => setHighlightVersion('v2')}
              >
                V2
              </button>
              <button
                className={highlightVersion === 'v3' ? 'active' : ''}
                onClick={() => setHighlightVersion('v3')}
              >
                V3
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
