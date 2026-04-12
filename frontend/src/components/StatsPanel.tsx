import { useState, useEffect } from 'react';

interface MostPlayed {
  tune_title: string;
  tune_ref: string;
  tune_source: string;
  play_count: number;
  total_duration: number | null;
  avg_bpm: number | null;
}

interface StatsSummary {
  most_played: MostPlayed[];
  period_days: number;
  total_sessions: number;
  total_seconds: number;
  week_sessions: number;
  week_seconds: number;
}

interface PlayEvent {
  id: number;
  tune_ref: string;
  tune_source: string;
  tune_title: string;
  bpm: number | null;
  transpose: number | null;
  duration_seconds: number | null;
  created_at: string;
}

interface StatsPanelProps {
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}

export function StatsPanel({ onClose }: StatsPanelProps) {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [history, setHistory] = useState<PlayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'summary' | 'history'>('summary');

  useEffect(() => {
    Promise.all([
      fetch('/api/stats/summary').then(r => r.ok ? r.json() : null),
      fetch('/api/stats/history').then(r => r.ok ? r.json() : []),
    ])
      .then(([sum, hist]) => {
        setSummary(sum);
        setHistory(hist);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-popup stats-popup" onClick={e => e.stopPropagation()}>
        <button className="about-close" onClick={onClose} aria-label="Close">×</button>
        <h2>My Stats</h2>

        <div className="stats-tabs">
          <button
            className={`stats-tab ${tab === 'summary' ? 'active' : ''}`}
            onClick={() => setTab('summary')}
          >
            Summary
          </button>
          <button
            className={`stats-tab ${tab === 'history' ? 'active' : ''}`}
            onClick={() => setTab('history')}
          >
            History
          </button>
        </div>

        {loading && <p className="loading">Loading stats...</p>}

        {!loading && tab === 'summary' && summary && (
          <div className="stats-summary">
            <div className="stats-totals">
              <div className="stat-card">
                <span className="stat-value">{formatDuration(summary.week_seconds)}</span>
                <span className="stat-label">This week</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{formatDuration(summary.total_seconds)}</span>
                <span className="stat-label">This month</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{summary.total_sessions}</span>
                <span className="stat-label">Sessions (30d)</span>
              </div>
            </div>

            {summary.most_played.length > 0 && (
              <>
                <h3>Most Played</h3>
                <ul className="stats-most-played">
                  {summary.most_played.map((tune, i) => (
                    <li key={`${tune.tune_source}-${tune.tune_ref}`}>
                      <span className="stats-rank">{i + 1}.</span>
                      <span className="stats-tune-title">{tune.tune_title}</span>
                      <span className="stats-play-count">{tune.play_count}x</span>
                      {tune.total_duration != null && (
                        <span className="stats-duration">{formatDuration(tune.total_duration)}</span>
                      )}
                      {tune.avg_bpm != null && (
                        <span className="stats-bpm">~{tune.avg_bpm} BPM</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {summary.most_played.length === 0 && summary.total_sessions === 0 && (
              <p className="empty">No play data yet. Start playing tunes to see your stats!</p>
            )}
          </div>
        )}

        {!loading && tab === 'history' && (
          <div className="stats-history">
            {history.length === 0 ? (
              <p className="empty">No play history yet.</p>
            ) : (
              <ul className="stats-history-list">
                {history.map(event => (
                  <li key={event.id} className="stats-history-item">
                    <span className="stats-tune-title">{event.tune_title}</span>
                    <span className="stats-meta">
                      {event.bpm && `${event.bpm} BPM`}
                      {event.duration_seconds != null && ` · ${formatDuration(event.duration_seconds)}`}
                    </span>
                    <span className="stats-date">
                      {new Date(event.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
