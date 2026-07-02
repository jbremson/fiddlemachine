import { useState, useEffect } from 'react';

interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  picture_url: string | null;
  last_login: string;
  created_at: string;
  song_count: number;
  set_count: number;
}

interface UserSet {
  id: number;
  name: string;
  item_count: number;
  items: Array<{ id: number; tune_title: string; tune_source: string; position: number }>;
}

interface ActivityLog {
  id: number;
  user_email: string;
  user_id: number | null;
  action: string;
  detail: string | null;
  status: number | null;
  ip: string | null;
  created_at: string;
}

interface AdminPanelProps {
  onClose: () => void;
}

type AdminTab = 'users' | 'logs';

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [userSets, setUserSets] = useState<UserSet[]>([]);
  const [setsLoading, setSetsLoading] = useState(false);

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load users');
        return res.json();
      })
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadLogs = () => {
    setLogsLoading(true);
    setLogsError(null);
    fetch('/api/admin/logs?limit=500')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load activity log');
        return res.json();
      })
      .then(setLogs)
      .catch(e => setLogsError(e.message))
      .finally(() => setLogsLoading(false));
  };

  useEffect(() => {
    if (tab === 'logs' && logs.length === 0 && !logsLoading) {
      loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const handleExpandUser = async (userId: number) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(userId);
    setSetsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/sets`);
      if (res.ok) {
        setUserSets(await res.json());
      }
    } catch {
      setUserSets([]);
    } finally {
      setSetsLoading(false);
    }
  };

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-popup admin-popup" onClick={e => e.stopPropagation()}>
        <button className="about-close" onClick={onClose} aria-label="Close" title="Close admin panel">×</button>
        <h2>Admin Panel</h2>
        <div className="admin-tabs">
          <button
            className={`admin-tab${tab === 'users' ? ' active' : ''}`}
            onClick={() => setTab('users')}
            title="Show users"
          >
            Users
          </button>
          <button
            className={`admin-tab${tab === 'logs' ? ' active' : ''}`}
            onClick={() => setTab('logs')}
            title="Show activity log"
          >
            Activity Log
          </button>
        </div>

        {tab === 'users' && (
          <>
        {loading && <p className="loading">Loading users...</p>}
        {error && <p className="email-error">{error}</p>}
        {!loading && !error && (
          <div className="admin-users-list">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Songs</th>
                  <th>Sets</th>
                  <th>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <>
                    <tr key={u.id} className="admin-user-row" onClick={() => handleExpandUser(u.id)}>
                      <td>{u.name || '—'}</td>
                      <td>{u.email}</td>
                      <td>
                        <select
                          value={u.role}
                          onChange={e => { e.stopPropagation(); handleRoleChange(u.id, e.target.value); }}
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="admin">admin</option>
                          <option value="user">user</option>
                          <option value="readonly">readonly</option>
                        </select>
                      </td>
                      <td>{u.song_count}</td>
                      <td>{u.set_count}</td>
                      <td>{new Date(u.last_login).toLocaleDateString()}</td>
                    </tr>
                    {expandedUser === u.id && (
                      <tr key={`${u.id}-sets`}>
                        <td colSpan={6} className="admin-user-detail">
                          {setsLoading ? (
                            <p className="loading">Loading sets...</p>
                          ) : userSets.length === 0 ? (
                            <p className="empty">No sets</p>
                          ) : (
                            <div className="admin-user-sets">
                              {userSets.map(s => (
                                <div key={s.id} className="admin-set">
                                  <strong>{s.name}</strong> ({s.item_count} tunes)
                                  <ul>
                                    {s.items.map(item => (
                                      <li key={item.id}>{item.tune_title} <span className="set-source-tag">{item.tune_source}</span></li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}

        {tab === 'logs' && (
          <div className="admin-logs-list">
            <div className="admin-logs-toolbar">
              <button className="menu-item" onClick={loadLogs} disabled={logsLoading} title="Refresh activity log">
                {logsLoading ? 'Refreshing…' : 'Refresh'}
              </button>
              <a
                className="menu-item"
                href="/api/admin/logs/export"
                download
                title="Download the last 60 days of activity as CSV"
              >
                Download CSV (60 days)
              </a>
            </div>
            {logsLoading && logs.length === 0 && <p className="loading">Loading activity…</p>}
            {logsError && <p className="email-error">{logsError}</p>}
            {!logsLoading && !logsError && logs.length === 0 && (
              <p className="empty">No activity yet</p>
            )}
            {logs.length > 0 && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Status</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className={log.user_email === 'anon' ? 'log-anon' : undefined}>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                      <td>{log.user_email}</td>
                      <td>{log.action}{log.detail ? ` ${log.detail}` : ''}</td>
                      <td>{log.status ?? '—'}</td>
                      <td>{log.ip || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
