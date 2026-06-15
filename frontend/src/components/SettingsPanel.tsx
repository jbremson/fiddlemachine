import { SynthType, getSynthTypes, PlaybackEngine } from '../audio/synth';
import { CountOffButton } from './CountOffButton';

interface SettingsPanelProps {
  synthType: SynthType;
  onSynthTypeChange: (type: SynthType) => void;
  playbackEngine: PlaybackEngine;
  onPlaybackEngineChange: (engine: PlaybackEngine) => void;
  soundfontLoading: boolean;
  countOffEnabled: boolean;
  onCountOffToggle: (enabled: boolean) => void;
  onClose: () => void;
}

export function SettingsPanel({ synthType, onSynthTypeChange, playbackEngine, onPlaybackEngineChange, soundfontLoading, countOffEnabled, onCountOffToggle, onClose }: SettingsPanelProps) {
  const synthTypes = getSynthTypes();

  return (
    <div className="settings-panel" role="dialog" aria-label="Settings">
      <div className="settings-header">
        <span>Settings</span>
        <button className="settings-close" onClick={onClose} aria-label="Close settings" title="Close settings">×</button>
      </div>
      <div className="settings-content">
        <div className="settings-row">
          <label htmlFor="engine-select">Engine:</label>
          <select
            id="engine-select"
            value={playbackEngine}
            onChange={(e) => onPlaybackEngineChange(e.target.value as PlaybackEngine)}
          >
            <option value="synth">Basic Synth</option>
            <option value="soundfont">SoundFont (HD)</option>
          </select>
          {soundfontLoading && <span className="loading-indicator">Loading...</span>}
        </div>
        <div className="settings-row">
          <label htmlFor="sound-select">Sound:</label>
          <select
            id="sound-select"
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
        <div className="settings-row">
          <label>Count-off:</label>
          <CountOffButton
            enabled={countOffEnabled}
            onToggle={onCountOffToggle}
          />
        </div>
      </div>
    </div>
  );
}
