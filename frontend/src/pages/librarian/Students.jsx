import { useState, useEffect } from 'react';
import { studentsAPI } from '../../services/api';

export default function LibrarianStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  const load = (q = '') => {
    setLoading(true);
    studentsAPI.getAll({ search: q })
      .then(r => setStudents(r.data.results || r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (s) => {
    setSelected(s);
    setHistLoading(true);
    studentsAPI.getBorrowingHistory(s.slug)
      .then(r => setHistory(r.data.results || r.data))
      .finally(() => setHistLoading(false));
  };

  const toggle = async (s) => {
    await studentsAPI.toggleActive(s.slug);
    load(search);
    if (selected?.slug === s.slug) setSelected(prev => ({ ...prev, is_active: !prev.is_active }));
  };

  const statusBadge = {
    borrowed: <span className="badge badge-info">Borrowed</span>,
    returned: <span className="badge badge-success">Returned</span>,
    overdue: <span className="badge badge-danger">Overdue</span>,
    lost: <span className="badge badge-default">Lost</span>,
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👨‍🎓 Students</h1>
          <p className="page-subtitle">Manage registered students</p>
        </div>
        {selected && (
          <button className="btn btn-ghost" onClick={() => setSelected(null)}>✕ Close Detail</button>
        )}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          className="form-control"
          style={{ maxWidth: 340 }}
          placeholder="🔍 Search by name, student ID, department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load(search)}
        />
        <button className="btn btn-primary" onClick={() => load(search)}>Search</button>
        {search && <button className="btn btn-ghost" onClick={() => { setSearch(''); load(); }}>Clear</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1.2fr 1fr' : '1fr', gap: 20 }}>
        {/* Students Table */}
        <div className="card">
          <div className="table-container">
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : students.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👨‍🎓</div>
                <div className="empty-title">No students found</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Student ID</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Books</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr
                      key={s.slug}
                      style={{ cursor: 'pointer', background: selected?.slug === s.slug ? 'rgba(200,146,42,0.04)' : '' }}
                      onClick={() => openDetail(s)}
                    >
                      <td>
                        <div style={{ fontWeight: 500 }}>{s.user?.full_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.user?.email}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{s.student_id}</td>
                      <td style={{ fontSize: 13 }}>{s.department}</td>
                      <td style={{ fontSize: 13, textAlign: 'center' }}>Yr {s.year_of_study}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${s.current_borrowed_count > 0 ? 'badge-info' : 'badge-default'}`}>
                          {s.current_borrowed_count}/{s.max_books_allowed}
                        </span>
                      </td>
                      <td>
                        {s.is_active
                          ? <span className="badge badge-success">✓ Active</span>
                          : <span className="badge badge-danger">✗ Suspended</span>}
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${s.is_active ? 'btn-danger' : 'btn-success'}`}
                          onClick={e => { e.stopPropagation(); toggle(s); }}
                        >
                          {s.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Student Detail Panel */}
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Profile Card */}
            <div className="card card-body">
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, flexShrink: 0
                }}>
                  {selected.user?.first_name?.[0]}{selected.user?.last_name?.[0]}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
                    {selected.user?.full_name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selected.user?.email}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                {[
                  ['🆔 Student ID', selected.student_id],
                  ['🏛️ Department', selected.department],
                  ['📚 Course', selected.course],
                  ['📅 Year', `Year ${selected.year_of_study}`],
                  ['📞 Phone', selected.user?.phone_number || '—'],
                  ['📤 Books', `${selected.current_borrowed_count} / ${selected.max_books_allowed}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--bg)', padding: '8px 12px', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</div>
                    <div style={{ fontWeight: 600, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Borrowing History */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ fontSize: 15 }}>📋 Borrowing History</h3>
              </div>
              <div className="table-container">
                {histLoading ? (
                  <div className="loading-center" style={{ padding: 30 }}><div className="spinner" /></div>
                ) : history.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px 20px' }}>
                    <div className="empty-title">No history</div>
                  </div>
                ) : (
                  <table className="table">
                    <thead><tr><th>Book</th><th>Due</th><th>Status</th></tr></thead>
                    <tbody>
                      {history.slice(0, 10).map(b => (
                        <tr key={b.slug}>
                          <td style={{ fontSize: 12, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {b.book?.title}
                          </td>
                          <td style={{ fontSize: 12 }}>{new Date(b.due_date).toLocaleDateString()}</td>
                          <td>{statusBadge[b.is_overdue ? 'overdue' : b.status]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}