interface HighlightOffsetSliderProps {
  offset: number; // -0.5 to 0.5 beats (negative = lead, positive = lag)
  onOffsetChange: (offset: number) => void;
}

export function HighlightOffsetSlider({ offset, onOffsetChange }: HighlightOffsetSliderProps) {
  // Convert to percentage for slider (-50 to 50, representing -0.5 to 0.5 beats)
  const sliderValue = Math.round(offset * 100);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onOffsetChange(value / 100);
  };

  const displayLabel = offset === 0
    ? 'On beat'
    : offset < 0
      ? `Lag ${Math.abs(offset).toFixed(2)} beats`
      : `Lead ${offset.toFixed(2)} beats`;

  return (
    <div className="highlight-offset-slider">
      <label htmlFor="highlight-offset">
        Highlight: {displayLabel}
      </label>
      <input
        type="range"
        id="highlight-offset"
        min="-50"
        max="50"
        value={sliderValue}
        onChange={handleChange}
      />
      <div className="offset-marks">
        <span>Lag</span>
        <span>On beat</span>
        <span>Lead</span>
      </div>
    </div>
  );
}
