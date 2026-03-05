import { useState, useEffect } from 'react';
import { studentsAPI } from '../../services/api';

const HIST_BADGE = {
  borrowed: <span className="badge badge-info"><i className="bi bi-arrow-left-right" style={{marginRight:3}}/>Borrowed</span>,
  returned: <span className="badge badge-success"><i className="bi bi-check-circle" style={{marginRight:3}}/>Returned</span>,
  overdue:  <span className="badge badge-danger"><i className="bi bi-exclamation-triangle" style={{marginRight:3}}/>Overdue</span>,
  lost:     <span className="badge badge-default"><i className="bi bi-x-circle" style={{marginRight:3}}/>Lost</span>,
};

const INFO_ROWS = (s) => [
  ['bi-person-badge',        'Student ID',  s.student_id],
  ['bi-building',            'Department',  s.department],
  ['bi-journal-bookmark',    'Course',      s.course],
  ['bi-calendar3',           'Year',        `Year ${s.year_of_study}`],
  ['bi-telephone',           'Phone',       s.user?.phone_number || '—'],
  ['bi-book-half',           'Books',       `${s.current_borrowed_count} / ${s.max_books_allowed}`],
];

export default function LibrarianStudents() {
  const [students, setStudents]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);
  const [history, setHistory]       = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  const load = (q = '') => {
    setLoading(true);
    studentsAPI.getAll({ search: q }).then(r => setStudents(r.data.results || r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openDetail = async (s) => {
    setSelected(s); setHistLoading(true);
    studentsAPI.getBorrowingHistory(s.slug).then(r => setHistory(r.data.results || r.data)).finally(() => setHistLoading(false));
  };

  const toggle = async (s) => {
    await studentsAPI.toggleActive(s.slug);
    load(search);
    if (selected?.slug === s.slug) setSelected(prev => ({ ...prev, is_active: !prev.is_active }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><i className="bi bi-mortarboard" style={{ marginRight:8 }}/>Students</h1>
          <p className="page-subtitle">Manage registered students</p>
        </div>
        {selected && (
          <button className="btn btn-ghost" style={{ gap:6 }} onClick={() => setSelected(null)}>
            <i className="bi bi-x-lg"/>Close Detail
          </button>
        )}
      </div>

      {/* Search bar */}
      <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, maxWidth:400 }}>
          <i className="bi bi-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#a0aec0', fontSize:14 }}/>
          <input
            className="form-control"
            style={{ paddingLeft:32 }}
            placeholder="Search by name, student ID, department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(search)}
          />
        </div>
        <button className="btn btn-primary" style={{ gap:6 }} onClick={() => load(search)}>
          <i className="bi bi-search"/>Search
        </button>
        {search && (
          <button className="btn btn-ghost" style={{ gap:6 }} onClick={() => { setSearch(''); load(); }}>
            <i className="bi bi-x-lg"/>Clear
          </button>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selected ? '1.2fr 1fr' : '1fr', gap:20 }}>
        {/* Table */}
        <div className="card">
          <div className="table-container">
            {loading ? (
              <div className="loading-center"><div className="spinner"/></div>
            ) : students.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><i className="bi bi-mortarboard"/></div>
                <div className="empty-title">No students found</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th><i className="bi bi-person-fill" style={{marginRight:5}}/>Name</th>
                    <th><i className="bi bi-person-badge" style={{marginRight:5}}/>Student ID</th>
                    <th><i className="bi bi-building" style={{marginRight:5}}/>Department</th>
                    <th><i className="bi bi-calendar3" style={{marginRight:5}}/>Year</th>
                    <th><i className="bi bi-book-half" style={{marginRight:5}}/>Books</th>
                    <th><i className="bi bi-toggle-on" style={{marginRight:5}}/>Status</th>
                    <th><i className="bi bi-gear" style={{marginRight:5}}/>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.slug} style={{ cursor:'pointer', background: selected?.slug === s.slug ? 'rgba(200,146,42,.04)' : '' }} onClick={() => openDetail(s)}>
                      <td>
                        <div style={{ fontWeight:500 }}>{s.user?.full_name}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.user?.email}</div>
                      </td>
                      <td style={{ fontFamily:'monospace', fontSize:13 }}>{s.student_id}</td>
                      <td style={{ fontSize:13 }}>{s.department}</td>
                      <td style={{ fontSize:13, textAlign:'center' }}>Yr {s.year_of_study}</td>
                      <td style={{ textAlign:'center' }}>
                        <span className={`badge ${s.current_borrowed_count > 0 ? 'badge-info' : 'badge-default'}`}>
                          {s.current_borrowed_count}/{s.max_books_allowed}
                        </span>
                      </td>
                      <td>
                        {s.is_active
                          ? <span className="badge badge-success"><i className="bi bi-check-circle" style={{marginRight:3}}/>Active</span>
                          : <span className="badge badge-danger"><i className="bi bi-slash-circle" style={{marginRight:3}}/>Suspended</span>}
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${s.is_active ? 'btn-danger' : 'btn-success'}`}
                          style={{ gap:5 }}
                          onClick={e => { e.stopPropagation(); toggle(s); }}
                        >
                          <i className={`bi ${s.is_active ? 'bi-slash-circle' : 'bi-check-circle'}`}/>
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

        {/* Detail panel */}
        {selected && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Profile card */}
            <div className="card card-body">
              <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:16 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--primary)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, flexShrink:0, boxShadow:'0 4px 12px rgba(15,35,56,.3)' }}>
                  {selected.user?.first_name?.[0]}{selected.user?.last_name?.[0]}
                </div>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17 }}>{selected.user?.full_name}</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:5 }}>
                    <i className="bi bi-envelope"/>{selected.user?.email}
                  </div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:13 }}>
                {INFO_ROWS(selected).map(([icon, k, v]) => (
                  <div key={k} style={{ background:'var(--bg)', padding:'8px 12px', borderRadius:8 }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, marginBottom:2 }}>
                      <i className={`bi ${icon}`}/>{k}
                    </div>
                    <div style={{ fontWeight:600 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop:14, display:'flex', gap:8 }}>
                {selected.is_active
                  ? <span className="badge badge-success" style={{ padding:'5px 10px' }}><i className="bi bi-check-circle" style={{marginRight:4}}/>Active Account</span>
                  : <span className="badge badge-danger" style={{ padding:'5px 10px' }}><i className="bi bi-slash-circle" style={{marginRight:4}}/>Suspended</span>}
                {!selected.can_borrow && <span className="badge badge-warning" style={{ padding:'5px 10px' }}><i className="bi bi-exclamation-triangle" style={{marginRight:4}}/>At borrow limit</span>}
              </div>
            </div>

            {/* Borrowing history */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ fontSize:15 }}>
                  <i className="bi bi-clock-history" style={{ marginRight:7 }}/>Borrowing History
                </h3>
              </div>
              <div className="table-container">
                {histLoading ? (
                  <div className="loading-center" style={{ padding:30 }}><div className="spinner"/></div>
                ) : history.length === 0 ? (
                  <div className="empty-state" style={{ padding:'24px 20px' }}>
                    <div className="empty-icon" style={{ fontSize:28 }}><i className="bi bi-journals"/></div>
                    <div className="empty-title" style={{ fontSize:14 }}>No borrowing history</div>
                  </div>
                ) : (
                  <table className="table">
                    <thead><tr>
                      <th><i className="bi bi-book-half" style={{marginRight:5}}/>Book</th>
                      <th><i className="bi bi-calendar-check" style={{marginRight:5}}/>Due</th>
                      <th><i className="bi bi-info-circle" style={{marginRight:5}}/>Status</th>
                    </tr></thead>
                    <tbody>
                      {history.slice(0, 10).map(b => (
                        <tr key={b.slug}>
                          <td style={{ fontSize:12, maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.book?.title}</td>
                          <td style={{ fontSize:12 }}>{new Date(b.due_date).toLocaleDateString()}</td>
                          <td>{HIST_BADGE[b.is_overdue ? 'overdue' : b.status]}</td>
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