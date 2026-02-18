import { useState } from 'react';
import { SynthType, getSynthTypes } from '../audio/synth';

interface ToneSelectorProps {
  selectedTone: SynthType;
  onToneChange: (tone: SynthType) => void;
}

export function ToneSelector({ selectedTone, onToneChange }: ToneSelectorProps) {
  const synthTypes = getSynthTypes();
  const [isOpen, setIsOpen] = useState(false);

  const currentName = synthTypes.find(s => s.value === selectedTone)?.name || 'Sound';

  const handleSelect = (tone: SynthType) => {
    onToneChange(tone);
    setIsOpen(false);
  };

  return (
    <div className="tone-selector" style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)}>
        {currentName} ▾
      </button>
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 100,
          minWidth: '120px'
        }}>
          {synthTypes.map(({ value, name }) => (
            <div
              key={value}
              onClick={() => handleSelect(value)}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                background: value === selectedTone ? '#4A90D9' : 'white',
                color: value === selectedTone ? 'white' : '#333',
              }}
            >
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
