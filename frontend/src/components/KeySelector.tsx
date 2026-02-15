interface KeySelectorProps {
  currentKey: string;
  transpose: number;
  onTransposeChange: (semitones: number) => void;
}

const KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab'];

export function KeySelector({ currentKey, transpose, onTransposeChange }: KeySelectorProps) {
  const baseKey = currentKey.replace(' minor', '').replace(' major', '');
  const isMinor = currentKey.includes('minor');

  // Calculate the transposed key name
  const baseIndex = KEYS.indexOf(baseKey);
  const transposedIndex = baseIndex >= 0 ? (baseIndex + transpose + 12) % 12 : -1;
  const transposedKey = transposedIndex >= 0
    ? KEYS[transposedIndex] + (isMinor ? 'm' : '')
    : currentKey;

  return (
    <div className="key-selector">
      <label>Key:</label>
      <div className="key-controls">
        <button
          className="key-btn"
          onClick={() => onTransposeChange(transpose - 1)}
          title="Transpose down"
        >
          -
        </button>
        <span className="key-display">{transposedKey}</span>
        <button
          className="key-btn"
          onClick={() => onTransposeChange(transpose + 1)}
          title="Transpose up"
        >
          +
        </button>
        {transpose !== 0 && (
          <button
            className="key-reset"
            onClick={() => onTransposeChange(0)}
            title="Reset to original key"
          >
            Reset
          </button>
        )}
      </div>
      {transpose !== 0 && (
        <span className="transpose-info">
          ({transpose > 0 ? '+' : ''}{transpose} semitones)
        </span>
      )}
    </div>
  );
}
