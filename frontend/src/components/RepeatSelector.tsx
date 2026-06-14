interface RepeatSelectorProps {
  repeatCount: number;
  onRepeatCountChange: (count: number) => void;
  disabled?: boolean;
}

export function RepeatSelector({
  repeatCount,
  onRepeatCountChange,
  disabled = false,
}: RepeatSelectorProps) {
  return (
    <div
      className={`repeat-control ${disabled ? 'disabled' : ''}`}
      role="group"
      aria-label="Repeat count"
      title={disabled ? 'Controlled by the tempo trainer' : undefined}
    >
      <span className="repeat-label">Repeat:</span>
      <button
        className="repeat-btn"
        onClick={() => onRepeatCountChange(Math.max(1, repeatCount - 1))}
        disabled={disabled || repeatCount <= 1}
        aria-label="Decrease repeat count"
      >
        −
      </button>
      <span className="repeat-display" aria-live="polite">{repeatCount}</span>
      <button
        className="repeat-btn"
        onClick={() => onRepeatCountChange(Math.min(10, repeatCount + 1))}
        disabled={disabled || repeatCount >= 10}
        aria-label="Increase repeat count"
      >
        +
      </button>
    </div>
  );
}
