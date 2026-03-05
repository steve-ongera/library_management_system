import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';

export default function LibrarianDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAPI.getLibrarianDashboard().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const stats = [
    { icon: '📚', label: 'Total Books', value: data?.total_books ?? 0, color: 'blue' },
    { icon: '📤', label: 'Active Borrowings', value: data?.total_borrowings ?? 0, color: 'green' },
    { icon: '⚠️', label: 'Overdue', value: data?.overdue_borrowings ?? 0, color: 'red' },
    { icon: '👨‍🎓', label: 'Students', value: data?.total_students ?? 0, color: 'purple' },
    { icon: '💰', label: 'Fines Collected (KES)', value: Number(data?.total_fines_collected ?? 0).toLocaleString(), color: 'green' },
    { icon: '⏳', label: 'Pending Fines (KES)', value: Number(data?.pending_fines_amount ?? 0).toLocaleString(), color: 'amber' },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">📊 Librarian Dashboard</h1><p className="page-subtitle">Library operations overview</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => navigate('/librarian/issue')}>📤 Issue Book</button>
          <button className="btn btn-ghost" onClick={() => navigate('/librarian/return')}>↩️ Return Book</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-info"><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 4 }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📤 Recent Borrowings</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/librarian/borrowings')}>View all</button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Student</th><th>Book</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>
                {(data?.recent_borrowings || []).slice(0, 8).map(b => (
                  <tr key={b.slug}>
                    <td style={{ fontSize: 13 }}>{b.user?.full_name}</td>
                    <td style={{ fontSize: 13, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.book?.title}</td>
                    <td style={{ fontSize: 12 }}>{new Date(b.due_date).toLocaleDateString()}</td>
                    <td>
                      {b.is_overdue
                        ? <span className="badge badge-danger">Overdue</span>
                        : b.status === 'returned'
                          ? <span className="badge badge-success">Returned</span>
                          : <span className="badge badge-info">Active</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">💰 Recent Fines</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/librarian/fines')}>View all</button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Student</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {(data?.recent_fines || []).slice(0, 8).map(f => (
                  <tr key={f.slug}>
                    <td style={{ fontSize: 13 }}>{f.user?.full_name}</td>
                    <td style={{ fontWeight: 700, color: f.status === 'pending' ? 'var(--danger)' : 'var(--success)' }}>
                      KES {Number(f.amount).toLocaleString()}
                    </td>
                    <td>
                      {f.status === 'paid' ? <span className="badge badge-success">Paid</span>
                        : f.status === 'waived' ? <span className="badge badge-warning">Waived</span>
                        : <span className="badge badge-danger">Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}