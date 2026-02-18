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
  const counts = [1, 2, 3, 4];

  return (
    <div className="repeat-selector" role="group" aria-label="Repeat count">
      <label id="repeat-label">Repeat:</label>
      <div className="repeat-buttons" role="radiogroup" aria-labelledby="repeat-label">
        {counts.map((num) => (
          <button
            key={num}
            role="radio"
            aria-checked={!loopForever && repeatCount === num}
            className={`repeat-num ${!loopForever && repeatCount === num ? 'active' : ''}`}
            onClick={() => {
              onLoopForeverChange(false);
              onRepeatCountChange(num);
            }}
          >
            {num}
          </button>
        ))}
        <button
          role="radio"
          aria-checked={loopForever}
          aria-label="Loop forever"
          className={`loop-btn ${loopForever ? 'active' : ''}`}
          onClick={() => onLoopForeverChange(!loopForever)}
        >
          ∞
        </button>
      </div>
    </div>
  );
}
