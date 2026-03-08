import { useState, useRef, useEffect, useCallback } from 'react';
import { TuneSummary, SetSummary, SetDetail, SetItem } from '../types/tune';
import { useAuth } from '../context/AuthContext';

interface TuneListProps {
  tunes: TuneSummary[];
  loading: boolean;
  error: string | null;
  onSelectTune: (tuneId: string) => void;
  onLoadFromUrl: (url: string) => void;
  onLoadFromAbc: (abc: string) => void;
  onDismissError: () => void;
  onPlaySet: (set: SetDetail) => void;
}

export function TuneList({ tunes, loading, error, onSelectTune, onLoadFromUrl, onLoadFromAbc, onDismissError, onPlaySet }: TuneListProps) {
  const [urlInput, setUrlInput] = useState('');
  const [abcInput, setAbcInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [isLoadingAbc, setIsLoadingAbc] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [libraryExpanded, setLibraryExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isLoggedIn, login, logout } = useAuth();

  // My Songs state
  const [mySongs, setMySongs] = useState<Array<{ id: number; title: string; notes: string | null; abc_content: string; updated_at: string }>>([]);
  const [mySongsLoading, setMySongsLoading] = useState(false);

  // My Sets state
  const [mySetsExpanded, setMySetsExpanded] = useState(false);
  const [mySets, setMySets] = useState<SetSummary[]>([]);
  const [mySetsLoading, setMySetsLoading] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [setsSearchQuery, setSetsSearchQuery] = useState('');
  const [editingSet, setEditingSet] = useState<SetDetail | null>(null);
  const [showSetEditor, setShowSetEditor] = useState(false);
  const [tuneSearchQuery, setTuneSearchQuery] = useState('');
  const [tuneSearchResults, setTuneSearchResults] = useState<Array<{ id: string; title: string; source: 'library' | 'user_song' }>>([]);

  // Drag-and-drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchCurrentIndex = useRef<number | null>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch my songs when library is expanded or set editor is open
  useEffect(() => {
    if (isLoggedIn && (libraryExpanded || showSetEditor)) {
      setMySongsLoading(true);
      fetch('/api/songs')
        .then(res => res.ok ? res.json() : [])
        .then(setMySongs)
        .catch(() => setMySongs([]))
        .finally(() => setMySongsLoading(false));
    }
  }, [isLoggedIn, libraryExpanded, showSetEditor]);

  const handleDeleteSong = async (songId: number) => {
    const res = await fetch(`/api/songs/${songId}`, { method: 'DELETE' });
    if (res.ok) {
      setMySongs(prev => prev.filter(s => s.id !== songId));
    }
  };

  // Fetch my sets when expanded and logged in
  useEffect(() => {
    if (isLoggedIn && mySetsExpanded) {
      setMySetsLoading(true);
      fetch('/api/sets')
        .then(res => res.ok ? res.json() : [])
        .then(setMySets)
        .catch(() => setMySets([]))
        .finally(() => setMySetsLoading(false));
    }
  }, [isLoggedIn, mySetsExpanded]);

  const fetchMySets = () => {
    fetch('/api/sets')
      .then(res => res.ok ? res.json() : [])
      .then(setMySets)
      .catch(() => setMySets([]));
  };

  const handleCreateSet = async () => {
    if (!newSetName.trim()) return;
    const res = await fetch('/api/sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSetName.trim() }),
    });
    if (res.ok) {
      setNewSetName('');
      fetchMySets();
    }
  };

  const handleDeleteSet = async (setId: number) => {
    const res = await fetch(`/api/sets/${setId}`, { method: 'DELETE' });
    if (res.ok) {
      setMySets(prev => prev.filter(s => s.id !== setId));
    }
  };

  const handleOpenSetEditor = async (setId: number) => {
    const res = await fetch(`/api/sets/${setId}`);
    if (res.ok) {
      const detail: SetDetail = await res.json();
      setEditingSet(detail);
      setShowSetEditor(true);
      setTuneSearchQuery('');
      setTuneSearchResults([]);
    }
  };

  const handleTuneSearch = async (query: string) => {
    setTuneSearchQuery(query);
    if (!query.trim()) { setTuneSearchResults([]); return; }
    const q = query.toLowerCase();
    // Search library tunes
    const libraryResults = tunes
      .filter(t => t.title.toLowerCase().includes(q))
      .slice(0, 10)
      .map(t => ({ id: t.id, title: t.title, source: 'library' as const }));
    // Search user songs
    const songResults = mySongs
      .filter(s => s.title.toLowerCase().includes(q))
      .slice(0, 10)
      .map(s => ({ id: String(s.id), title: s.title, source: 'user_song' as const }));
    setTuneSearchResults([...songResults, ...libraryResults]);
  };

  const handleAddTuneToSet = async (tuneId: string, title: string, source: 'library' | 'user_song') => {
    if (!editingSet) return;
    const res = await fetch(`/api/sets/${editingSet.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tune_source: source, tune_ref: tuneId, tune_title: title }),
    });
    if (res.ok) {
      const item: SetItem = await res.json();
      setEditingSet(prev => prev ? { ...prev, items: [...prev.items, item] } : null);
      setTuneSearchQuery('');
      setTuneSearchResults([]);
      fetchMySets();
    }
  };

  const handleRemoveSetItem = async (itemId: number) => {
    if (!editingSet) return;
    const res = await fetch(`/api/sets/${editingSet.id}/items/${itemId}`, { method: 'DELETE' });
    if (res.ok) {
      setEditingSet(prev => prev ? {
        ...prev,
        items: prev.items.filter(i => i.id !== itemId).map((item, idx) => ({ ...item, position: idx }))
      } : null);
      fetchMySets();
    }
  };

  // Drag-and-drop reorder
  const handleDragReorder = useCallback(async (fromIndex: number, toIndex: number) => {
    if (!editingSet || fromIndex === toIndex) return;
    const items = [...editingSet.items];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    const reordered = items.map((item, idx) => ({ ...item, position: idx }));
    setEditingSet(prev => prev ? { ...prev, items: reordered } : null);

    await fetch(`/api/sets/${editingSet.id}/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_ids: reordered.map(i => i.id) }),
    });
  }, [editingSet]);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null) {
      handleDragReorder(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Touch drag support
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentIndex.current = index;
    setDragIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || !editingSet) return;
    const touchY = e.touches[0].clientY;
    // Find which item we're over
    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (touchY >= rect.top && touchY <= rect.bottom) {
          setDragOverIndex(i);
          break;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      handleDragReorder(dragIndex, dragOverIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
    touchStartY.current = null;
    touchCurrentIndex.current = null;
  };

  const filteredSets = mySets.filter(s =>
    s.name.toLowerCase().includes(setsSearchQuery.toLowerCase())
  );

  // Build unified library list: merge library tunes + user songs
  type LibraryItem = { id: string; title: string; key: string; isSaved: boolean; abc_content?: string; songId?: number };

  const unifiedLibrary: LibraryItem[] = (() => {
    const libraryItems: LibraryItem[] = tunes.map(t => ({
      id: t.id, title: t.title, key: t.key, isSaved: false,
    }));
    const savedItems: LibraryItem[] = mySongs.map(s => ({
      id: `song_${s.id}`, title: s.title, key: 'Saved', isSaved: true, abc_content: s.abc_content, songId: s.id,
    }));
    const all = [...libraryItems, ...savedItems];
    const q = searchQuery.toLowerCase();
    return all
      .filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q)
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  })();

  const totalCount = tunes.length + (isLoggedIn ? mySongs.length : 0);

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

  const handleLibraryItemClick = (item: LibraryItem) => {
    if (item.isSaved && item.abc_content) {
      setAbcInput(item.abc_content);
      onLoadFromAbc(item.abc_content);
    } else {
      onSelectTune(item.id);
    }
  };

  return (
    <div className="app tune-list-page">
      <header className="app-header">
        <div className="header-menu" ref={menuRef}>
          <button
            className="menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span className="menu-icon">☰</span>
            <span className="menu-label">Menu</span>
          </button>
          {menuOpen && (
            <div className="menu-dropdown">
              <button
                className="menu-item"
                onClick={() => {
                  setShowChangelog(true);
                  setMenuOpen(false);
                }}
              >
                Changelog
              </button>
              <button
                className="menu-item"
                onClick={() => {
                  setShowAbout(true);
                  setMenuOpen(false);
                }}
              >
                About
              </button>
            </div>
          )}
        </div>
        <h1>Fiddle Machine</h1>
        <div className="header-auth">
          {isLoggedIn ? (
            <button className="auth-btn" onClick={logout} title={user?.email || ''}>
              {user?.name ? user.name.split(' ')[0] : 'Logout'}
              <span className="auth-btn-label"> - Sign out</span>
            </button>
          ) : (
            <button className="auth-btn" onClick={login}>
              Sign in
            </button>
          )}
        </div>
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
            <div className="abc-loader-actions">
              <button
                onClick={handleAbcSubmit}
                disabled={!abcInput.trim() || isLoadingAbc}
                aria-label="Load pasted ABC"
              >
                {isLoadingAbc ? 'Loading...' : 'Load ABC'}
              </button>
            </div>
          </div>
        </div>

        {isLoggedIn && (
          <div className="library-section my-sets-section">
            <button
              className="library-header"
              onClick={() => setMySetsExpanded(!mySetsExpanded)}
              aria-expanded={mySetsExpanded}
            >
              <span className="library-title">My Sets</span>
              {mySets.length > 0 && <span className="library-count">{mySets.length} sets</span>}
              <span className="library-toggle">{mySetsExpanded ? '▼' : '▶'}</span>
            </button>

            {mySetsExpanded && (
              mySetsLoading ? (
                <p className="loading">Loading sets...</p>
              ) : (
                <div style={{ padding: '0.5rem 1rem' }}>
                  <div className="set-create-row">
                    <input
                      type="text"
                      placeholder="New set name..."
                      value={newSetName}
                      onChange={(e) => setNewSetName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateSet(); }}
                    />
                    <button onClick={handleCreateSet} disabled={!newSetName.trim()}>Create</button>
                  </div>
                  {mySets.length > 3 && (
                    <div className="library-search" style={{ padding: '0.5rem 0' }}>
                      <input
                        type="text"
                        placeholder="Search sets..."
                        value={setsSearchQuery}
                        onChange={(e) => setSetsSearchQuery(e.target.value)}
                      />
                    </div>
                  )}
                  {filteredSets.length === 0 ? (
                    <p className="empty">No sets yet</p>
                  ) : (
                    <ul className="tune-list-compact" role="listbox" aria-label="My sets">
                      {filteredSets.map((s) => (
                        <li key={s.id} className="tune-item-compact set-item">
                          <span
                            className="tune-item-title"
                            onClick={() => handleOpenSetEditor(s.id)}
                            role="option"
                            aria-selected={false}
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleOpenSetEditor(s.id); }}
                          >
                            {s.name}
                          </span>
                          <span className="set-item-count">{s.item_count} tunes</span>
                          <button
                            className="set-edit-btn"
                            onClick={() => handleOpenSetEditor(s.id)}
                            aria-label={`Edit ${s.name}`}
                            title="Edit set"
                          >
                            ✎
                          </button>
                          <button
                            className="delete-song-btn"
                            onClick={() => handleDeleteSet(s.id)}
                            aria-label={`Delete ${s.name}`}
                            title="Delete set"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            )}
          </div>
        )}

        <div className="library-section">
          <button
            className="library-header"
            onClick={() => setLibraryExpanded(!libraryExpanded)}
            aria-expanded={libraryExpanded}
          >
            <span className="library-title">Library</span>
            {totalCount > 0 && <span className="library-count">{totalCount} tunes</span>}
            <span className="library-toggle">{libraryExpanded ? '▼' : '▶'}</span>
          </button>

          {libraryExpanded && (
            loading || mySongsLoading ? (
              <p className="loading">Loading tunes...</p>
            ) : totalCount === 0 ? (
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
                      {unifiedLibrary.length} of {totalCount}
                    </span>
                  )}
                </div>
                <ul className="tune-list-compact" role="listbox" aria-label="Available tunes">
                  {unifiedLibrary.map((item) => (
                    <li
                      key={item.id}
                      role="option"
                      aria-selected={false}
                      className="tune-item-compact"
                      onClick={() => handleLibraryItemClick(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleLibraryItemClick(item);
                        }
                      }}
                      tabIndex={0}
                    >
                      <span className="tune-item-title">{item.title}</span>
                      {item.isSaved ? (
                        <>
                          <span className="set-source-tag">saved</span>
                          <button
                            className="delete-song-btn"
                            onClick={(e) => { e.stopPropagation(); handleDeleteSong(item.songId!); }}
                            aria-label={`Delete ${item.title}`}
                            title="Delete song"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <span className="tune-item-key">{item.key}</span>
                      )}
                    </li>
                  ))}
                  {unifiedLibrary.length === 0 && (
                    <li className="tune-item-empty">No tunes match "{searchQuery}"</li>
                  )}
                </ul>
              </>
            )
          )}
        </div>
      </main>

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

      {showChangelog && (
        <div className="about-overlay" onClick={() => setShowChangelog(false)}>
          <div className="about-popup changelog-popup" onClick={(e) => e.stopPropagation()}>
            <button
              className="about-close"
              onClick={() => setShowChangelog(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2>Changelog</h2>
            <div className="changelog-content">
              <h3>February 2026</h3>
              <ul>
                <li>New golden brown color scheme</li>
                <li>Edit ABC feature with live reload</li>
                <li>Improved zoom controls</li>
                <li>Print button for notation</li>
                <li>Scrollable notation view</li>
              </ul>
              <h3>January 2026</h3>
              <ul>
                <li>Initial release</li>
                <li>ABC notation playback</li>
                <li>Tempo control</li>
                <li>Key transposition</li>
                <li>Metronome and count-off</li>
                <li>Loop and repeat controls</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {showSetEditor && editingSet && (
        <div className="about-overlay" onClick={() => setShowSetEditor(false)}>
          <div className="about-popup set-editor-popup" onClick={(e) => e.stopPropagation()}>
            <button
              className="about-close"
              onClick={() => setShowSetEditor(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2>{editingSet.name}</h2>
            <div className="set-tune-search">
              <input
                type="text"
                placeholder={editingSet.items.length >= 99 ? "Set is full (99/99 max)" : "Search tunes to add..."}
                value={tuneSearchQuery}
                onChange={(e) => handleTuneSearch(e.target.value)}
                disabled={editingSet.items.length >= 99}
                autoFocus
              />
              {editingSet.items.length >= 99 && (
                <span className="search-count">99/99 max</span>
              )}
              {tuneSearchResults.length > 0 && (
                <ul className="set-search-results">
                  {tuneSearchResults.map((result) => (
                    <li
                      key={`${result.source}-${result.id}`}
                      onClick={() => handleAddTuneToSet(result.id, result.title, result.source)}
                    >
                      {result.title}
                      {result.source === 'user_song' && <span className="set-source-tag">saved</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="set-items-list">
              {editingSet.items.length === 0 ? (
                <p className="empty">No tunes in this set yet. Search above to add tunes.</p>
              ) : (
                <ol>
                  {editingSet.items.map((item, index) => (
                    <li
                      key={item.id}
                      className={`set-item-row${dragIndex === index ? ' dragging' : ''}${dragOverIndex === index ? ' drag-over' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      onTouchStart={(e) => handleTouchStart(e, index)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      ref={(el) => { itemRefs.current[index] = el; }}
                    >
                      <span className="drag-handle" aria-label="Drag to reorder">⋮⋮</span>
                      <span className="set-item-title">{item.tune_title}</span>
                      {item.tune_source === 'user_song' && <span className="set-source-tag">saved</span>}
                      <button
                        className="delete-song-btn"
                        onClick={() => handleRemoveSetItem(item.id)}
                        aria-label={`Remove ${item.tune_title}`}
                        title="Remove from set"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <button
              className="play-set-btn"
              onClick={() => { onPlaySet(editingSet); setShowSetEditor(false); }}
              disabled={editingSet.items.length === 0}
            >
              Play Set
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
