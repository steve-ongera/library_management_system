// Announcements.jsx
import { useState, useEffect } from 'react';
import { announcementsAPI } from '../../services/api';

export function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { announcementsAPI.getAll().then(r => setItems(r.data.results || r.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">📢 Announcements</h1><p className="page-subtitle">Latest updates from the library</p></div></div>
      {items.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📢</div><div className="empty-title">No announcements</div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map(a => (
            <div key={a.slug} className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{a.title}</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{a.content}</p>
              <div style={{ marginTop: 10 }}><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Posted by {a.created_by?.full_name}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default Announcements;