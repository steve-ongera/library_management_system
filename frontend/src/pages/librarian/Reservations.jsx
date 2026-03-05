// Reservations.jsx
import { useState, useEffect } from 'react';
import { reservationsAPI } from '../../services/api';

export function Reservations() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = () => {
    setLoading(true);
    reservationsAPI.getAll({ status })
      .then(r => setItems(r.data.results || r.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status]);

  const statusBadge = {
    active: <span className="badge badge-info">🟢 Active</span>,
    fulfilled: <span className="badge badge-success">✅ Fulfilled</span>,
    cancelled: <span className="badge badge-default">✕ Cancelled</span>,
    expired: <span className="badge badge-warning">⏰ Expired</span>,
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">🔖 Reservations</h1><p className="page-subtitle">Manage all book reservations</p></div>
        <select className="form-control" style={{ width: 160 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>
      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <table className="table">
              <thead><tr><th>Student</th><th>Book</th><th>Reserved</th><th>Expires</th><th>Status</th></tr></thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No reservations found</td></tr>
                ) : items.map(r => (
                  <tr key={r.slug}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{r.user?.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.user?.email}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{r.book?.title}</td>
                    <td style={{ fontSize: 12 }}>{new Date(r.reserved_at).toLocaleDateString()}</td>
                    <td style={{ fontSize: 12 }}>{new Date(r.expires_at).toLocaleDateString()}</td>
                    <td>{statusBadge[r.status]}</td>
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
export default Reservations;