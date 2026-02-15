interface TempoSliderProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
}

export function TempoSlider({ bpm, onBpmChange }: TempoSliderProps) {
  return (
    <div className="tempo-slider">
      <label htmlFor="tempo">
        Tempo: {bpm} BPM
      </label>
      <input
        type="range"
        id="tempo"
        min="30"
        max="160"
        value={bpm}
        onChange={(e) => onBpmChange(parseInt(e.target.value))}
      />
      <div className="tempo-marks">
        <span>30</span>
        <span>95</span>
        <span>160</span>
      </div>
    </div>
  );
}
