interface CountOffButtonProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function CountOffButton({ enabled, onToggle }: CountOffButtonProps) {
  return (
    <button
      className={`countoff-btn ${enabled ? 'active' : ''}`}
      onClick={() => onToggle(!enabled)}
      title={enabled ? 'Turn count-off off' : 'Turn count-off on'}
      aria-label={enabled ? 'Turn count-off off' : 'Turn count-off on'}
      aria-pressed={enabled}
    >
      <span className="countoff-text">1234</span>
    </button>
  );
}
