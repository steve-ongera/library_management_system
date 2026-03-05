import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const statusBadge = {
  borrowed: <span className="badge badge-info">📤 Borrowed</span>,
  returned: <span className="badge badge-success">✅ Returned</span>,
  overdue: <span className="badge badge-danger">⚠️ Overdue</span>,
  lost: <span className="badge badge-default">❌ Lost</span>,
};

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAPI.getStudentDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const stats = [
    { icon: '📖', label: 'Books Borrowed', value: data?.borrowed_books ?? 0, color: 'blue' },
    { icon: '⚠️', label: 'Overdue Books', value: data?.overdue_books ?? 0, color: 'red' },
    { icon: '💳', label: 'Pending Fines (KES)', value: `${Number(data?.pending_fines ?? 0).toLocaleString()}`, color: 'amber' },
    { icon: '🔖', label: 'Active Reservations', value: data?.reservations ?? 0, color: 'purple' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👋 Welcome, {user?.first_name}!</h1>
          <p className="page-subtitle">Here's an overview of your library activity</p>
        </div>
        <button className="btn btn-accent" onClick={() => navigate('/student/books')}>
          📚 Browse Books
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 4 }}>
        {/* Recent Borrowings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📤 Recent Borrowings</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student/my-books')}>View all</button>
          </div>
          <div className="table-container">
            {data?.recent_borrowings?.length > 0 ? (
              <table className="table">
                <thead><tr><th>Book</th><th>Due Date</th><th>Status</th></tr></thead>
                <tbody>
                  {data.recent_borrowings.map(b => (
                    <tr key={b.slug}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{b.book?.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ISBN: {b.book?.isbn}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {new Date(b.due_date).toLocaleDateString()}
                        {b.is_overdue && <div style={{ color: 'var(--danger)', fontSize: 11 }}>+{b.days_overdue}d overdue</div>}
                      </td>
                      <td>{statusBadge[b.status] || b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <div className="empty-title">No borrowings yet</div>
                <div className="empty-desc">Start by browsing the library catalog</div>
              </div>
            )}
          </div>
        </div>

        {/* Active Fines */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">💳 Pending Fines</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/student/fines')}>Pay fines</button>
          </div>
          <div className="table-container">
            {data?.active_fines?.length > 0 ? (
              <table className="table">
                <thead><tr><th>Book</th><th>Amount</th><th>Action</th></tr></thead>
                <tbody>
                  {data.active_fines.map(f => (
                    <tr key={f.slug}>
                      <td style={{ fontSize: 13 }}>{f.borrowing?.book?.title}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
                          KES {Number(f.amount).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-accent btn-sm" onClick={() => navigate('/student/fines')}>
                          Pay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <div className="empty-title">No pending fines</div>
                <div className="empty-desc">You're all clear!</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}