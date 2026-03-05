import { useState, useEffect } from 'react';
import { reservationsAPI } from '../../services/api';

const STATUS_BADGE = {
  active:    <span className="badge badge-info"><i className="bi bi-circle-fill" style={{marginRight:4,fontSize:8}}/>Active</span>,
  fulfilled: <span className="badge badge-success"><i className="bi bi-check-circle" style={{marginRight:4}}/>Fulfilled</span>,
  cancelled: <span className="badge badge-default"><i className="bi bi-x-circle" style={{marginRight:4}}/>Cancelled</span>,
  expired:   <span className="badge badge-warning"><i className="bi bi-clock" style={{marginRight:4}}/>Expired</span>,
};

export default function Reservations() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = () => { setLoading(true); reservationsAPI.getAll({ status }).then(r => setItems(r.data.results || r.data)).finally(() => setLoading(false)); };
  useEffect(load, [status]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><i className="bi bi-bookmark-check" style={{ marginRight:8 }}/>Reservations</h1>
          <p className="page-subtitle">Manage all book reservations</p>
        </div>
        <select className="form-control" style={{ width:160 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-center"><div className="spinner"/></div> : (
            <table className="table">
              <thead>
                <tr>
                  <th><i className="bi bi-person-fill" style={{marginRight:5}}/>Student</th>
                  <th><i className="bi bi-book-half" style={{marginRight:5}}/>Book</th>
                  <th><i className="bi bi-calendar-plus" style={{marginRight:5}}/>Reserved</th>
                  <th><i className="bi bi-calendar-x" style={{marginRight:5}}/>Expires</th>
                  <th><i className="bi bi-info-circle" style={{marginRight:5}}/>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
                      <i className="bi bi-bookmark-check" style={{ fontSize:32, opacity:.3, display:'block', marginBottom:8 }}/>No reservations found
                    </td>
                  </tr>
                ) : items.map(r => (
                  <tr key={r.slug}>
                    <td>
                      <div style={{ fontWeight:500, fontSize:13 }}>{r.user?.full_name}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>
                        <i className="bi bi-envelope" style={{ fontSize:10 }}/>{r.user?.email}
                      </div>
                    </td>
                    <td style={{ fontSize:13 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <i className="bi bi-book-half" style={{ color:'var(--text-muted)', fontSize:12 }}/>{r.book?.title}
                      </div>
                    </td>
                    <td style={{ fontSize:12 }}>{new Date(r.reserved_at).toLocaleDateString()}</td>
                    <td style={{ fontSize:12 }}>{new Date(r.expires_at).toLocaleDateString()}</td>
                    <td>{STATUS_BADGE[r.status]}</td>
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