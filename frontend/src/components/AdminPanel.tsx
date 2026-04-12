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

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [userSets, setUserSets] = useState<UserSet[]>([]);
  const [setsLoading, setSetsLoading] = useState(false);

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
        <button className="about-close" onClick={onClose} aria-label="Close">×</button>
        <h2>Admin Panel</h2>
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
      </div>
    </div>
  );
}
