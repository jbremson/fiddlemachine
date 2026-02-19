interface MetronomeSelectorProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function MetronomeSelector({ enabled, onToggle }: MetronomeSelectorProps) {
  return (
    <button
      className={`metronome-btn ${enabled ? 'active' : ''}`}
      onClick={() => onToggle(!enabled)}
      title={enabled ? 'Turn metronome off' : 'Turn metronome on'}
      aria-label={enabled ? 'Turn metronome off' : 'Turn metronome on'}
      aria-pressed={enabled}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L8 22h8L12 2z" />
        <path d="M12 6l5 10" />
        <circle cx="12" cy="18" r="2" />
      </svg>
    </button>
  );
}
