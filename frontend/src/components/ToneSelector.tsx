import { SynthType, getSynthTypes } from '../audio/synth';

interface ToneSelectorProps {
  selectedTone: SynthType;
  onToneChange: (tone: SynthType) => void;
}

export function ToneSelector({ selectedTone, onToneChange }: ToneSelectorProps) {
  const synthTypes = getSynthTypes();

  return (
    <div className="tone-selector">
      <label htmlFor="tone-select">Sound:</label>
      <select
        id="tone-select"
        value={selectedTone}
        onChange={(e) => onToneChange(e.target.value as SynthType)}
      >
        {synthTypes.map(({ value, name }) => (
          <option key={value} value={value}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
