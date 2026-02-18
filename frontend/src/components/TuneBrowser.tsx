import { TuneSummary } from '../types/tune';

interface TuneBrowserProps {
  tunes: TuneSummary[];
  selectedTuneId: string | null;
  onSelectTune: (tuneId: string) => void;
  loading: boolean;
}

export function TuneBrowser({ tunes, selectedTuneId, onSelectTune, loading }: TuneBrowserProps) {
  const handleKeyDown = (e: React.KeyboardEvent, tuneId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectTune(tuneId);
    }
  };

  if (loading) {
    return (
      <div className="tune-browser">
        <h2>Tunes</h2>
        <p className="loading">Loading tunes...</p>
      </div>
    );
  }

  if (tunes.length === 0) {
    return (
      <div className="tune-browser">
        <h2>Tunes</h2>
        <p className="empty">No tunes available</p>
      </div>
    );
  }

  return (
    <div className="tune-browser">
      <h2>Tunes</h2>
      <ul className="tune-list" role="listbox" aria-label="Available tunes">
        {tunes.map((tune) => (
          <li
            key={tune.id}
            role="option"
            aria-selected={selectedTuneId === tune.id}
            className={`tune-item ${selectedTuneId === tune.id ? 'selected' : ''}`}
            onClick={() => onSelectTune(tune.id)}
            onKeyDown={(e) => handleKeyDown(e, tune.id)}
            tabIndex={0}
          >
            <span className="tune-title">{tune.title}</span>
            <span className="tune-key">{tune.key}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
