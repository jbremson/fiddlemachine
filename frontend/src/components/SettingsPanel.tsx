import { SynthType, getSynthTypes } from '../audio/synth';

interface SettingsPanelProps {
  synthType: SynthType;
  onSynthTypeChange: (type: SynthType) => void;
  onClose: () => void;
}

export function SettingsPanel({ synthType, onSynthTypeChange, onClose }: SettingsPanelProps) {
  const synthTypes = getSynthTypes();

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <span>Settings</span>
        <button className="settings-close" onClick={onClose}>×</button>
      </div>
      <div className="settings-content">
        <div className="settings-row">
          <label>Sound:</label>
          <select
            value={synthType}
            onChange={(e) => onSynthTypeChange(e.target.value as SynthType)}
          >
            {synthTypes.map(({ value, name }) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
