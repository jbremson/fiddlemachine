import { useState, useEffect, useCallback } from 'react';
import { TuneList } from './components/TuneList';
import { PlayerView } from './components/PlayerView';
import { tunePlayer } from './audio/player';
import { SynthType } from './audio/synth';
import { Tune, TuneSummary, PlaybackState } from './types/tune';
import './styles/main.css';

export function App() {
  const [tunes, setTunes] = useState<TuneSummary[]>([]);
  const [loadingTunes, setLoadingTunes] = useState(true);
  const [selectedTune, setSelectedTune] = useState<Tune | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [bpm, setBpm] = useState(72);
  const [repeatCount, setRepeatCount] = useState(2);
  const [loopForever, setLoopForever] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [synthType, setSynthType] = useState<SynthType>('fiddle');
  const [transpose, setTranspose] = useState(0);
  const [octaveShift, setOctaveShift] = useState(0);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [countOffEnabled, setCountOffEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        // Keep user's BPM setting, don't override with tune's default
        setProgress(0);
        setTranspose(0);
        setOctaveShift(0);
        setError(null);
      } else {
        setError('Failed to load tune');
      }
    } catch (err) {
      console.error('Failed to fetch tune:', err);
      setError('Failed to load tune');
    }
  }, []);

  const handleBack = useCallback(() => {
    tunePlayer.stop();
    setSelectedTune(null);
    setProgress(0);
    setPlaybackState('stopped');
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
    const clamped = Math.max(30, Math.min(200, newBpm));
    setBpm(clamped);
    tunePlayer.setBpm(clamped);
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

  const handleOctaveChange = useCallback((shift: number) => {
    const limited = Math.max(-2, Math.min(2, shift));
    setOctaveShift(limited);
    tunePlayer.setOctaveShift(limited);
  }, []);

  const handleTransposeChange = useCallback((semitones: number) => {
    const limited = Math.max(-12, Math.min(12, semitones));
    setTranspose(limited);
    tunePlayer.setTranspose(limited);
  }, []);

  const handleMetronomeToggle = useCallback((enabled: boolean) => {
    setMetronomeEnabled(enabled);
    tunePlayer.setMetronome(enabled);
  }, []);

  const handleCountOffToggle = useCallback((enabled: boolean) => {
    setCountOffEnabled(enabled);
    tunePlayer.setCountOff(enabled);
  }, []);

  // Show tune list if no tune is selected, otherwise show player
  if (!selectedTune) {
    return (
      <TuneList
        tunes={tunes}
        loading={loadingTunes}
        error={error}
        onSelectTune={handleSelectTune}
        onDismissError={() => setError(null)}
      />
    );
  }

  return (
    <PlayerView
      tune={selectedTune}
      playbackState={playbackState}
      bpm={bpm}
      repeatCount={repeatCount}
      loopForever={loopForever}
      progress={progress}
      synthType={synthType}
      transpose={transpose}
      octaveShift={octaveShift}
      metronomeEnabled={metronomeEnabled}
      countOffEnabled={countOffEnabled}
      error={error}
      onBack={handleBack}
      onPlay={handlePlay}
      onPause={handlePause}
      onStop={handleStop}
      onBpmChange={handleBpmChange}
      onRepeatCountChange={handleRepeatCountChange}
      onLoopForeverChange={handleLoopForeverChange}
      onToneChange={handleToneChange}
      onOctaveChange={handleOctaveChange}
      onTransposeChange={handleTransposeChange}
      onMetronomeToggle={handleMetronomeToggle}
      onCountOffToggle={handleCountOffToggle}
      onDismissError={() => setError(null)}
    />
  );
}
