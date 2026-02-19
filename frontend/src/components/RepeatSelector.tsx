interface RepeatSelectorProps {
  repeatCount: number;
  onRepeatCountChange: (count: number) => void;
}

export function RepeatSelector({
  repeatCount,
  onRepeatCountChange,
}: RepeatSelectorProps) {
  return (
    <div className="repeat-control" role="group" aria-label="Repeat count">
      <span className="repeat-label">Repeat:</span>
      <button
        className="repeat-btn"
        onClick={() => onRepeatCountChange(Math.max(1, repeatCount - 1))}
        disabled={repeatCount <= 1}
        aria-label="Decrease repeat count"
      >
        −
      </button>
      <span className="repeat-display" aria-live="polite">{repeatCount}</span>
      <button
        className="repeat-btn"
        onClick={() => onRepeatCountChange(Math.min(10, repeatCount + 1))}
        disabled={repeatCount >= 10}
        aria-label="Increase repeat count"
      >
        +
      </button>
    </div>
  );
}
