import { useState, useEffect } from 'react';

const MIN_BPM = 30;
const MAX_BPM = 160;

interface TempoSliderProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
}

export function TempoSlider({ bpm, onBpmChange }: TempoSliderProps) {
  const [inputValue, setInputValue] = useState(bpm.toString());

  // Sync input value when bpm prop changes
  useEffect(() => {
    setInputValue(bpm.toString());
  }, [bpm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const parsed = parseInt(inputValue);
    if (!isNaN(parsed)) {
      const clamped = Math.max(MIN_BPM, Math.min(MAX_BPM, parsed));
      onBpmChange(clamped);
      setInputValue(clamped.toString());
    } else {
      setInputValue(bpm.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="tempo-slider">
      <label htmlFor="tempo">
        Tempo:
        <input
          type="number"
          className="tempo-input"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          min={MIN_BPM}
          max={MAX_BPM}
        />
        BPM
      </label>
      <input
        type="range"
        id="tempo"
        min={MIN_BPM}
        max={MAX_BPM}
        value={bpm}
        onChange={(e) => onBpmChange(parseInt(e.target.value))}
      />
      <div className="tempo-marks">
        <span>{MIN_BPM}</span>
        <span>{Math.round((MIN_BPM + MAX_BPM) / 2)}</span>
        <span>{MAX_BPM}</span>
      </div>
    </div>
  );
}
