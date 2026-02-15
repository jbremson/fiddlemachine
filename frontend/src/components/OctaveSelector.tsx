interface OctaveSelectorProps {
  octaveShift: number;
  onOctaveChange: (shift: number) => void;
}

export function OctaveSelector({ octaveShift, onOctaveChange }: OctaveSelectorProps) {
  return (
    <div className="octave-selector">
      <label>Octave:</label>
      <div className="octave-controls">
        <button
          className="octave-btn"
          onClick={() => onOctaveChange(octaveShift - 1)}
          disabled={octaveShift <= -2}
          title="Octave down"
        >
          -
        </button>
        <span className="octave-display">
          {octaveShift === 0 ? 'Original' : (octaveShift > 0 ? `+${octaveShift}` : octaveShift)}
        </span>
        <button
          className="octave-btn"
          onClick={() => onOctaveChange(octaveShift + 1)}
          disabled={octaveShift >= 2}
          title="Octave up"
        >
          +
        </button>
        {octaveShift !== 0 && (
          <button
            className="octave-reset"
            onClick={() => onOctaveChange(0)}
            title="Reset to original octave"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
