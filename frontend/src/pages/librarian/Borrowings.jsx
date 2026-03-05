// Borrowings.jsx
import { useState, useEffect } from 'react';
import { borrowingsAPI } from '../../services/api';

export function Borrowings() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); borrowingsAPI.getAll({ status }).then(r => setData(r.data.results || r.data)).finally(() => setLoading(false)); };
  useEffect(load, [status]);
  const statusBadge = { borrowed: <span className="badge badge-info">Borrowed</span>, returned: <span className="badge badge-success">Returned</span>, overdue: <span className="badge badge-danger">Overdue</span>, lost: <span className="badge badge-default">Lost</span> };
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">📤 All Borrowings</h1><p className="page-subtitle">Track all book borrowings</p></div>
        <select className="form-control" style={{ width: 160 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="borrowed">Borrowed</option>
          <option value="returned">Returned</option>
          <option value="overdue">Overdue</option>
          <option value="lost">Lost</option>
        </select>
      </div>
      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <table className="table">
              <thead><tr><th>Student</th><th>Book</th><th>Issued By</th><th>Borrow Date</th><th>Due Date</th><th>Return Date</th><th>Status</th><th>Fine</th></tr></thead>
              <tbody>
                {data.map(b => (
                  <tr key={b.slug}>
                    <td><div style={{ fontWeight: 500, fontSize: 13 }}>{b.user?.full_name}</div></td>
                    <td style={{ fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.book?.title}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.issued_by?.full_name}</td>
                    <td style={{ fontSize: 12 }}>{new Date(b.borrow_date).toLocaleDateString()}</td>
                    <td style={{ fontSize: 12 }}>{new Date(b.due_date).toLocaleDateString()}</td>
                    <td style={{ fontSize: 12 }}>{b.return_date ? new Date(b.return_date).toLocaleDateString() : '—'}</td>
                    <td>{statusBadge[b.is_overdue ? 'overdue' : b.status] || b.status}</td>
                    <td style={{ fontSize: 13, color: b.calculated_fine > 0 ? 'var(--danger)' : 'inherit', fontWeight: b.calculated_fine > 0 ? 700 : 400 }}>
                      {b.calculated_fine > 0 ? `KES ${Number(b.calculated_fine).toLocaleString()}` : '—'}
                    </td>
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
export default Borrowings;