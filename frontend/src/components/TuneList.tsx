import { useState } from 'react';
import { TuneSummary } from '../types/tune';

interface TuneListProps {
  tunes: TuneSummary[];
  loading: boolean;
  error: string | null;
  onSelectTune: (tuneId: string) => void;
  onLoadFromUrl: (url: string) => void;
  onLoadFromAbc: (abc: string) => void;
  onDismissError: () => void;
}

export function TuneList({ tunes, loading, error, onSelectTune, onLoadFromUrl, onLoadFromAbc, onDismissError }: TuneListProps) {
  const [urlInput, setUrlInput] = useState('');
  const [abcInput, setAbcInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isLoadingAbc, setIsLoadingAbc] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [libraryExpanded, setLibraryExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sort tunes alphabetically and filter by search query
  const filteredTunes = tunes
    .filter(tune =>
      tune.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tune.key.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  const handleKeyDown = (e: React.KeyboardEvent, tuneId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectTune(tuneId);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setIsLoadingUrl(true);
      onLoadFromUrl(urlInput.trim());
      setTimeout(() => setIsLoadingUrl(false), 2000);
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUrlSubmit(e);
    }
  };

  const handleAbcSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (abcInput.trim()) {
      setIsLoadingAbc(true);
      onLoadFromAbc(abcInput.trim());
      setTimeout(() => setIsLoadingAbc(false), 2000);
    }
  };

  return (
    <div className="app tune-list-page">
      <header className="app-header">
        <h1>Fiddle Machine</h1>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={onDismissError} aria-label="Dismiss error">×</button>
        </div>
      )}

      <main className="tune-list-main">
        <div className="loaders-section">
          <div className="url-loader">
            <label htmlFor="abc-url">Load from URL:</label>
            <div className="url-input-row">
              <input
                id="abc-url"
                type="url"
                placeholder="https://thesession.org/tunes/2/abc"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={handleUrlKeyDown}
                disabled={isLoadingUrl}
              />
              <button
                onClick={handleUrlSubmit}
                disabled={!urlInput.trim() || isLoadingUrl}
                aria-label="Load tune from URL"
              >
                {isLoadingUrl ? 'Loading...' : 'Load'}
              </button>
            </div>
          </div>

          <div className="abc-loader">
            <label htmlFor="abc-paste">Paste ABC notation:</label>
            <textarea
              id="abc-paste"
              placeholder="X: 1&#10;T: Tune Title&#10;M: 4/4&#10;K: G&#10;|: GABc ..."
              value={abcInput}
              onChange={(e) => setAbcInput(e.target.value)}
              disabled={isLoadingAbc}
              rows={4}
            />
            <button
              onClick={handleAbcSubmit}
              disabled={!abcInput.trim() || isLoadingAbc}
              aria-label="Load pasted ABC"
            >
              {isLoadingAbc ? 'Loading...' : 'Load ABC'}
            </button>
          </div>
        </div>

        <div className="library-section">
          <button
            className="library-header"
            onClick={() => setLibraryExpanded(!libraryExpanded)}
            aria-expanded={libraryExpanded}
          >
            <span className="library-title">Library</span>
            <span className="library-count">{tunes.length} tunes</span>
            <span className="library-toggle">{libraryExpanded ? '▼' : '▶'}</span>
          </button>

          {libraryExpanded && (
            loading ? (
              <p className="loading">Loading tunes...</p>
            ) : tunes.length === 0 ? (
              <p className="empty">No tunes available</p>
            ) : (
              <>
                <div className="library-search">
                  <input
                    type="text"
                    placeholder="Search tunes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search tunes"
                  />
                  {searchQuery && (
                    <span className="search-count">
                      {filteredTunes.length} of {tunes.length}
                    </span>
                  )}
                </div>
                <ul className="tune-list-compact" role="listbox" aria-label="Available tunes">
                  {filteredTunes.map((tune) => (
                    <li
                      key={tune.id}
                      role="option"
                      aria-selected={false}
                      className="tune-item-compact"
                      onClick={() => onSelectTune(tune.id)}
                      onKeyDown={(e) => handleKeyDown(e, tune.id)}
                      tabIndex={0}
                    >
                      <span className="tune-item-title">{tune.title}</span>
                      <span className="tune-item-key">{tune.key}</span>
                    </li>
                  ))}
                  {filteredTunes.length === 0 && (
                    <li className="tune-item-empty">No tunes match "{searchQuery}"</li>
                  )}
                </ul>
              </>
            )
          )}
        </div>
      </main>

      <button
        className="about-link"
        onClick={() => setShowAbout(true)}
        aria-label="About FiddleMachine"
      >
        About
      </button>

      {showAbout && (
        <div className="about-overlay" onClick={() => setShowAbout(false)}>
          <div className="about-popup" onClick={(e) => e.stopPropagation()}>
            <button
              className="about-close"
              onClick={() => setShowAbout(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2>About FiddleMachine</h2>
            <p>
              FiddleMachine is a web application for learning fiddle tunes by ear.
              Load tunes from URLs, paste ABC notation, or browse the built-in library
              of public domain traditional tunes.
            </p>
            <p>
              Features include adjustable tempo, octave shifting, key transposition,
              metronome, count-off, and looping.
            </p>
            <div className="about-contact">
              <p>Built and maintained by <strong>Joel Bremson</strong></p>
              <p>
                <a href="mailto:info@fiddlemachine.com">info@fiddlemachine.com</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
