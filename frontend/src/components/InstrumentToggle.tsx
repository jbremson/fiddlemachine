interface InstrumentToggleProps {
  instrument: 'fiddle' | 'mandolin';
  onInstrumentChange: (instrument: 'fiddle' | 'mandolin') => void;
}

export function InstrumentToggle({ instrument, onInstrumentChange }: InstrumentToggleProps) {
  return (
    <div className="instrument-toggle" role="group" aria-label="Instrument selection">
      <button
        className={instrument === 'fiddle' ? 'active' : ''}
        onClick={() => onInstrumentChange('fiddle')}
        aria-pressed={instrument === 'fiddle'}
      >
        Fiddle
      </button>
      <button
        className={instrument === 'mandolin' ? 'active' : ''}
        onClick={() => onInstrumentChange('mandolin')}
        aria-pressed={instrument === 'mandolin'}
      >
        Mandolin
      </button>
    </div>
  );
}
