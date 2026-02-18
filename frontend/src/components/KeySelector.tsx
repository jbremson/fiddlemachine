interface KeySelectorProps {
  currentKey: string;
  transpose: number;
  onTransposeChange: (semitones: number) => void;
}

const KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab'];

export function KeySelector({ currentKey, transpose, onTransposeChange }: KeySelectorProps) {
  const baseKey = currentKey.replace(' minor', '').replace(' major', '');
  const isMinor = currentKey.includes('minor');
  const baseIndex = KEYS.indexOf(baseKey);

  return (
    <div className="key-selector">
      <select
        value={transpose}
        onChange={(e) => onTransposeChange(parseInt(e.target.value))}
        aria-label="Key transposition"
      >
        {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((t) => {
          const idx = baseIndex >= 0 ? (baseIndex + t + 12) % 12 : -1;
          const keyName = idx >= 0 ? KEYS[idx] + (isMinor ? 'm' : '') : currentKey;
          return (
            <option key={t} value={t}>
              Key of {keyName} {t !== 0 ? `(${t > 0 ? '+' : ''}${t})` : ''}
            </option>
          );
        })}
      </select>
    </div>
  );
}
