import { useState, useEffect } from 'react';
import { reservationsAPI } from '../../services/api';

export default function StudentReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    reservationsAPI.getAll().then(res => setReservations(res.data.results || res.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const cancel = async (slug) => {
    if (!confirm('Cancel this reservation?')) return;
    await reservationsAPI.cancel(slug);
    load();
  };

  const statusBadge = { active: <span className="badge badge-info">🟢 Active</span>, fulfilled: <span className="badge badge-success">✅ Fulfilled</span>, cancelled: <span className="badge badge-default">✕ Cancelled</span>, expired: <span className="badge badge-warning">⏰ Expired</span> };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">🔖 Reservations</h1><p className="page-subtitle">Books you've reserved</p></div>
      </div>
      <div className="card">
        <div className="table-container">
          {reservations.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🔖</div><div className="empty-title">No reservations</div><div className="empty-desc">Browse books and reserve ones you want</div></div>
          ) : (
            <table className="table">
              <thead><tr><th>Book</th><th>Reserved</th><th>Expires</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {reservations.map(r => (
                  <tr key={r.slug}>
                    <td><div style={{ fontWeight: 500 }}>{r.book?.title}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.book?.isbn}</div></td>
                    <td style={{ fontSize: 13 }}>{new Date(r.reserved_at).toLocaleDateString()}</td>
                    <td style={{ fontSize: 13 }}>{new Date(r.expires_at).toLocaleDateString()}</td>
                    <td>{statusBadge[r.status]}</td>
                    <td>{r.status === 'active' && <button className="btn btn-danger btn-sm" onClick={() => cancel(r.slug)}>Cancel</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}