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
        {/* Count-in / conductor baton icon */}
        <line x1="4" y1="20" x2="20" y2="4" />
        <circle cx="20" cy="4" r="2" fill="currentColor" />
        {/* Beat marks */}
        <line x1="6" y1="10" x2="6" y2="14" />
        <line x1="10" y1="8" x2="10" y2="12" />
        <line x1="14" y1="6" x2="14" y2="10" />
      </svg>
    </button>
  );
}
