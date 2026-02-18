interface MetronomeSelectorProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function MetronomeSelector({ enabled, onToggle }: MetronomeSelectorProps) {
  return (
    <div className="metronome-selector" role="group" aria-label="Metronome">
      <button
        className={enabled ? '' : 'active'}
        onClick={() => onToggle(false)}
        aria-pressed={!enabled}
      >
        Off
      </button>
      <button
        className={enabled ? 'active' : ''}
        onClick={() => onToggle(true)}
        aria-pressed={enabled}
      >
        Click
      </button>
    </div>
  );
}
