import { useState, useEffect, useCallback } from 'react';
import { TuneList } from './components/TuneList';
import { PlayerView } from './components/PlayerView';
import { tunePlayer } from './audio/player';
import { SynthType, PlaybackEngine } from './audio/synth';
import { Tune, TuneSummary, PlaybackState, SetDetail, SetItem } from './types/tune';
import './styles/main.css';

export function App() {
  const [tunes, setTunes] = useState<TuneSummary[]>([]);
  const [loadingTunes, setLoadingTunes] = useState(true);
  const [selectedTune, setSelectedTune] = useState<Tune | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [bpm, setBpm] = useState(72);
  const [repeatCount, setRepeatCount] = useState(2);
  const [loopForever, setLoopForever] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [synthType, setSynthType] = useState<SynthType>('fiddle');
  const [transpose, setTranspose] = useState(0);
  const [octaveShift, setOctaveShift] = useState(0);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [countOffEnabled, setCountOffEnabled] = useState(true);
  const [playbackEngine, setPlaybackEngine] = useState<PlaybackEngine>(
    () => (localStorage.getItem('playbackEngine') as PlaybackEngine) || 'synth'
  );
  const [soundfontLoading, setSoundfontLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSet, setActiveSet] = useState<SetDetail | null>(null);
  const [activeSetIndex, setActiveSetIndex] = useState(0);

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

  // Initialize audio player callbacks and restore engine
  useEffect(() => {
    tunePlayer.setOnStateChange(setPlaybackState);
    tunePlayer.setPlaybackEngine(playbackEngine);
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

  // Load tune from URL
  const handleLoadFromUrl = useCallback(async (url: string) => {
    try {
      const response = await fetch('/api/tunes/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (response.ok) {
        const tune: Tune = await response.json();
        setSelectedTune(tune);
        tunePlayer.setTune(tune);
        setTranspose(0);
        setOctaveShift(0);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to load tune from URL');
      }
    } catch (err) {
      console.error('Failed to fetch tune from URL:', err);
      setError('Failed to load tune from URL');
    }
  }, []);

  // Load tune from pasted ABC
  const handleLoadFromAbc = useCallback(async (abc: string) => {
    try {
      const response = await fetch('/api/tunes/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abc, id: 'pasted' }),
      });
      if (response.ok) {
        const tune: Tune = await response.json();
        setSelectedTune(tune);
        tunePlayer.setTune(tune);
        setTranspose(0);
        setOctaveShift(0);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to parse ABC');
      }
    } catch (err) {
      console.error('Failed to parse ABC:', err);
      setError('Failed to parse ABC');
    }
  }, []);

  const handleBack = useCallback(() => {
    tunePlayer.stop();
    setSelectedTune(null);
    setPlaybackState('stopped');
    setActiveSet(null);
    setActiveSetIndex(0);
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
    setSoundfontLoading(tunePlayer.isSoundfontLoading() || playbackEngine === 'soundfont');
    await tunePlayer.play();
    setSoundfontLoading(false);
  }, [initializeAudio, playbackEngine]);

  const handlePause = useCallback(() => {
    tunePlayer.pause();
  }, []);

  const handleStop = useCallback(() => {
    tunePlayer.stop();
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

  const handlePlaybackEngineChange = useCallback((engine: PlaybackEngine) => {
    setPlaybackEngine(engine);
    localStorage.setItem('playbackEngine', engine);
    tunePlayer.setPlaybackEngine(engine);
  }, []);

  // Reload tune from edited ABC
  const handleReloadAbc = useCallback(async (abc: string) => {
    tunePlayer.stop();
    try {
      const response = await fetch('/api/tunes/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abc, id: selectedTune?.id || 'edited' }),
      });
      if (response.ok) {
        const tune: Tune = await response.json();
        setSelectedTune(tune);
        tunePlayer.setTune(tune);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to parse ABC');
      }
    } catch (err) {
      console.error('Failed to parse ABC:', err);
      setError('Failed to parse ABC');
    }
  }, [selectedTune?.id]);

  // Load a set item by fetching the tune and applying stored settings
  const loadSetItem = useCallback(async (item: SetItem) => {
    tunePlayer.stop();
    try {
      let tune: Tune;
      if (item.tune_source === 'library') {
        const response = await fetch(`/api/tunes/${item.tune_ref}`);
        if (!response.ok) { setError('Failed to load tune'); return; }
        tune = await response.json();
      } else {
        // user_song: fetch the song's abc_content and parse it
        const songRes = await fetch(`/api/songs/${item.tune_ref}`);
        if (!songRes.ok) { setError('Failed to load song'); return; }
        const songData = await songRes.json();
        const parseRes = await fetch('/api/tunes/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ abc: songData.abc_content, id: `song_${item.tune_ref}` }),
        });
        if (!parseRes.ok) { setError('Failed to parse song'); return; }
        tune = await parseRes.json();
      }
      setSelectedTune(tune);
      tunePlayer.setTune(tune);

      // Apply stored settings
      if (item.bpm != null) { setBpm(item.bpm); tunePlayer.setBpm(item.bpm); }
      if (item.transpose != null) { setTranspose(item.transpose); tunePlayer.setTranspose(item.transpose); }
      else { setTranspose(0); }
      if (item.octave_shift != null) { setOctaveShift(item.octave_shift); tunePlayer.setOctaveShift(item.octave_shift); }
      else { setOctaveShift(0); }
      if (item.synth_type != null) { setSynthType(item.synth_type as SynthType); tunePlayer.setSynthType(item.synth_type as SynthType); }
      if (item.metronome_enabled != null) { setMetronomeEnabled(item.metronome_enabled); tunePlayer.setMetronome(item.metronome_enabled); }
      if (item.count_off_enabled != null) { setCountOffEnabled(item.count_off_enabled); tunePlayer.setCountOff(item.count_off_enabled); }
      setError(null);
    } catch (err) {
      console.error('Failed to load set item:', err);
      setError('Failed to load tune from set');
    }
  }, []);

  const handlePlaySet = useCallback(async (set: SetDetail) => {
    if (set.items.length === 0) return;
    setActiveSet(set);
    setActiveSetIndex(0);
    await loadSetItem(set.items[0]);
  }, [loadSetItem]);

  const handleNextTune = useCallback(async () => {
    if (!activeSet || activeSetIndex >= activeSet.items.length - 1) return;
    const newIndex = activeSetIndex + 1;
    setActiveSetIndex(newIndex);
    await loadSetItem(activeSet.items[newIndex]);
  }, [activeSet, activeSetIndex, loadSetItem]);

  const handlePrevTune = useCallback(async () => {
    if (!activeSet || activeSetIndex <= 0) return;
    const newIndex = activeSetIndex - 1;
    setActiveSetIndex(newIndex);
    await loadSetItem(activeSet.items[newIndex]);
  }, [activeSet, activeSetIndex, loadSetItem]);

  // Show tune list if no tune is selected, otherwise show player
  if (!selectedTune) {
    return (
      <TuneList
        tunes={tunes}
        loading={loadingTunes}
        error={error}
        onSelectTune={handleSelectTune}
        onLoadFromUrl={handleLoadFromUrl}
        onLoadFromAbc={handleLoadFromAbc}
        onDismissError={() => setError(null)}
        onPlaySet={handlePlaySet}
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
      synthType={synthType}
      transpose={transpose}
      octaveShift={octaveShift}
      metronomeEnabled={metronomeEnabled}
      countOffEnabled={countOffEnabled}
      playbackEngine={playbackEngine}
      soundfontLoading={soundfontLoading}
      onPlaybackEngineChange={handlePlaybackEngineChange}
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
      onReloadAbc={handleReloadAbc}
      activeSet={activeSet}
      activeSetIndex={activeSetIndex}
      onNextTune={handleNextTune}
      onPrevTune={handlePrevTune}
    />
  );
}
