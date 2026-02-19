interface OctaveControlProps {
  octaveShift: number;
  onOctaveChange: (shift: number) => void;
}

export function OctaveControl({ octaveShift, onOctaveChange }: OctaveControlProps) {
  return (
    <div className="octave-control" role="group" aria-label="Octave control">
      <span className="octave-label">Octave:</span>
      <button
        className="octave-btn"
        onClick={() => onOctaveChange(octaveShift - 1)}
        disabled={octaveShift <= -2}
        aria-label="Decrease octave"
      >
        −
      </button>
      <span className="octave-display" aria-live="polite">
        {octaveShift >= 0 ? '+' : ''}{octaveShift}
      </span>
      <button
        className="octave-btn"
        onClick={() => onOctaveChange(octaveShift + 1)}
        disabled={octaveShift >= 2}
        aria-label="Increase octave"
      >
        +
      </button>
    </div>
  );
}
