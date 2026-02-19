import { TuneSummary } from '../types/tune';

interface TuneListProps {
  tunes: TuneSummary[];
  loading: boolean;
  error: string | null;
  onSelectTune: (tuneId: string) => void;
  onDismissError: () => void;
}

export function TuneList({ tunes, loading, error, onSelectTune, onDismissError }: TuneListProps) {
  const handleKeyDown = (e: React.KeyboardEvent, tuneId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectTune(tuneId);
    }
  };

  return (
    <div className="app tune-list-page">
      <header className="app-header">
        <h1>FiddleMachine</h1>
        <p>Learn fiddle tunes by ear</p>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={onDismissError} aria-label="Dismiss error">×</button>
        </div>
      )}

      <main className="tune-list-main">
        {loading ? (
          <p className="loading">Loading tunes...</p>
        ) : tunes.length === 0 ? (
          <p className="empty">No tunes available</p>
        ) : (
          <ul className="tune-grid" role="listbox" aria-label="Available tunes">
            {tunes.map((tune) => (
              <li
                key={tune.id}
                role="option"
                aria-selected={false}
                className="tune-card"
                onClick={() => onSelectTune(tune.id)}
                onKeyDown={(e) => handleKeyDown(e, tune.id)}
                tabIndex={0}
              >
                <span className="tune-card-title">{tune.title}</span>
                <span className="tune-card-key">{tune.key}</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
