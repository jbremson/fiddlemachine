interface LoopButtonProps {
  looping: boolean;
  onToggle: (looping: boolean) => void;
}

export function LoopButton({ looping, onToggle }: LoopButtonProps) {
  return (
    <button
      className={`loop-button ${looping ? 'active' : ''}`}
      onClick={() => onToggle(!looping)}
      title={looping ? 'Turn off loop' : 'Loop forever'}
      aria-label={looping ? 'Turn off loop' : 'Loop forever'}
      aria-pressed={looping}
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
        <path d="M17 2l4 4-4 4" />
        <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
        <path d="M7 22l-4-4 4-4" />
        <path d="M21 13v1a4 4 0 0 1-4 4H3" />
      </svg>
    </button>
  );
}
