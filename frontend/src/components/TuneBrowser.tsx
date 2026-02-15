import { TuneSummary } from '../types/tune';

interface TuneBrowserProps {
  tunes: TuneSummary[];
  selectedTuneId: string | null;
  onSelectTune: (tuneId: string) => void;
  loading: boolean;
}

export function TuneBrowser({ tunes, selectedTuneId, onSelectTune, loading }: TuneBrowserProps) {
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
      <ul className="tune-list">
        {tunes.map((tune) => (
          <li
            key={tune.id}
            className={`tune-item ${selectedTuneId === tune.id ? 'selected' : ''}`}
            onClick={() => onSelectTune(tune.id)}
          >
            <span className="tune-title">{tune.title}</span>
            <span className="tune-key">{tune.key}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
