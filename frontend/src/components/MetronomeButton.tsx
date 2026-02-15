interface MetronomeButtonProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function MetronomeButton({ enabled, onToggle }: MetronomeButtonProps) {
  return (
    <div className="metronome-button">
      <button
        className={`metronome-toggle ${enabled ? 'active' : ''}`}
        onClick={() => onToggle(!enabled)}
        title={enabled ? 'Turn metronome off' : 'Turn metronome on'}
      >
        <span className="metronome-icon">
          {enabled ? '🔊' : '🔇'}
        </span>
        Metronome
      </button>
    </div>
  );
}
