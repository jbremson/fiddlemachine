interface KeySelectorProps {
  currentKey: string;
  transpose: number;
  onTransposeChange: (semitones: number) => void;
}

const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Map enharmonic equivalents to conventional names
const ENHARMONIC_MAP: Record<string, string> = {
  'C#': 'Db', 'D#': 'Eb', 'Gb': 'F#', 'G#': 'Ab', 'A#': 'Bb', 'Cb': 'B', 'Fb': 'E',
};

export function KeySelector({ currentKey, transpose, onTransposeChange }: KeySelectorProps) {
  const safeKey = currentKey || '?';
  const baseKey = safeKey.replace(' minor', '').replace(' major', '').replace(' dorian', '').replace(' mixolydian', '').trim();
  const isMinor = safeKey.includes('minor');
  const normalizedKey = ENHARMONIC_MAP[baseKey] || baseKey;
  const baseIndex = KEYS.indexOf(normalizedKey);

  return (
    <div className="key-selector">
      <select
        value={transpose}
        onChange={(e) => onTransposeChange(parseInt(e.target.value))}
        aria-label="Key transposition"
      >
        {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((t) => {
          const idx = baseIndex >= 0 ? (baseIndex + t + 12) % 12 : -1;
          const keyName = idx >= 0 ? KEYS[idx] + (isMinor ? 'm' : '') : safeKey;
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
