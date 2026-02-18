interface RepeatSelectorProps {
  repeatCount: number;
  loopForever: boolean;
  onRepeatCountChange: (count: number) => void;
  onLoopForeverChange: (loop: boolean) => void;
}

export function RepeatSelector({
  repeatCount,
  loopForever,
  onRepeatCountChange,
  onLoopForeverChange,
}: RepeatSelectorProps) {
  return (
    <div className="repeat-selector">
      <label>Repeat:</label>
      <div className="repeat-controls">
        <button
          className="repeat-btn"
          onClick={() => onRepeatCountChange(Math.max(1, repeatCount - 1))}
          disabled={loopForever || repeatCount <= 1}
        >
          -
        </button>
        <span className="repeat-display">{loopForever ? '∞' : repeatCount}</span>
        <button
          className="repeat-btn"
          onClick={() => onRepeatCountChange(repeatCount + 1)}
          disabled={loopForever}
        >
          +
        </button>
        <button
          className={`loop-btn ${loopForever ? 'active' : ''}`}
          onClick={() => onLoopForeverChange(!loopForever)}
          title="Loop forever"
        >
          ∞
        </button>
      </div>
    </div>
  );
}
