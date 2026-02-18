import { PlaybackState } from '../types/tune';

interface TransportControlsProps {
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  disabled: boolean;
}

export function TransportControls({
  playbackState,
  onPlay,
  onPause,
  onStop,
  disabled,
}: TransportControlsProps) {
  return (
    <div className="transport-controls">
      <button
        className="transport-btn"
        onClick={onStop}
        disabled={disabled || playbackState === 'stopped'}
        title="Restart"
      >
        ↺
      </button>
      {playbackState === 'playing' ? (
        <button
          className="transport-btn play"
          onClick={onPause}
          disabled={disabled}
          title="Pause"
        >
          ⏸
        </button>
      ) : (
        <button
          className="transport-btn play"
          onClick={onPlay}
          disabled={disabled}
          title="Play"
        >
          ▶
        </button>
      )}
      <button
        className="transport-btn"
        onClick={onStop}
        disabled={disabled || playbackState === 'stopped'}
        title="Stop"
      >
        ⏹
      </button>
    </div>
  );
}
