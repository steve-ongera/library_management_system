// MyBooks.jsx
import { useState, useEffect } from 'react';
import { borrowingsAPI } from '../../services/api';

const STATUS_BADGE = {
  borrowed: <span className="badge badge-info">📤 Borrowed</span>,
  returned: <span className="badge badge-success">✅ Returned</span>,
  overdue: <span className="badge badge-danger">⚠️ Overdue</span>,
  lost: <span className="badge badge-default">❌ Lost</span>,
};

export function MyBooks() {
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    borrowingsAPI.getMyHistory()
      .then(res => setBorrowings(res.data.results || res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📖 My Books</h1>
          <p className="page-subtitle">Your complete borrowing history</p>
        </div>
      </div>
      <div className="card">
        <div className="table-container">
          {borrowings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <div className="empty-title">No borrowings yet</div>
              <div className="empty-desc">Visit the library to borrow books</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Book</th><th>Author</th><th>Borrowed</th><th>Due</th><th>Returned</th><th>Status</th><th>Fine</th></tr>
              </thead>
              <tbody>
                {borrowings.map(b => (
                  <tr key={b.slug}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.book?.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.book?.isbn}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{b.book?.authors?.map(a => a.name).join(', ')}</td>
                    <td style={{ fontSize: 13 }}>{new Date(b.borrow_date).toLocaleDateString()}</td>
                    <td style={{ fontSize: 13 }}>
                      {new Date(b.due_date).toLocaleDateString()}
                      {b.is_overdue && <div style={{ color: 'var(--danger)', fontSize: 11 }}>+{b.days_overdue}d overdue</div>}
                    </td>
                    <td style={{ fontSize: 13 }}>{b.return_date ? new Date(b.return_date).toLocaleDateString() : '—'}</td>
                    <td>{STATUS_BADGE[b.status]}</td>
                    <td style={{ fontWeight: b.calculated_fine > 0 ? 700 : 400, color: b.calculated_fine > 0 ? 'var(--danger)' : 'var(--text-muted)', fontSize: 13 }}>
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
export default MyBooks;