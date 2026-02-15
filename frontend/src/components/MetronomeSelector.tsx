import { MetronomeType, getMetronomeTypes } from '../audio/synth';

interface MetronomeSelectorProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  metronomeType: MetronomeType;
  onTypeChange: (type: MetronomeType) => void;
}

export function MetronomeSelector({ enabled, onToggle, metronomeType, onTypeChange }: MetronomeSelectorProps) {
  const metronomeTypes = getMetronomeTypes();

  return (
    <div className="metronome-selector">
      <button
        className={`metronome-toggle ${enabled ? 'active' : ''}`}
        onClick={() => onToggle(!enabled)}
        title={enabled ? 'Turn metronome off' : 'Turn metronome on'}
      >
        <span className="metronome-icon">&#9834;</span>
        <span>Metronome</span>
      </button>

      {enabled && (
        <select
          value={metronomeType}
          onChange={(e) => onTypeChange(e.target.value as MetronomeType)}
          className="metronome-type-select"
        >
          {metronomeTypes.map(({ value, name }) => (
            <option key={value} value={value}>
              {name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
