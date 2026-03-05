// IssueBook.jsx
import { useState } from 'react';
import { studentsAPI, booksAPI, borrowingsAPI } from '../../services/api';

export function IssueBook() {
  const [studentSlug, setStudentSlug] = useState('');
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState(null);
  const [bookSlug, setBookSlug] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [books, setBooks] = useState([]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const searchStudent = async () => {
    try {
      const res = await studentsAPI.getAll({ search: studentId });
      const s = (res.data.results || res.data)[0];
      if (s) { setStudent(s); setStudentSlug(s.slug); }
      else showToast('Student not found', 'danger');
    } catch { showToast('Error finding student', 'danger'); }
  };

  const searchBooks = async () => {
    if (!bookSearch.trim()) return;
    const res = await booksAPI.getAll({ search: bookSearch, available: 'true' });
    setBooks(res.data.results || res.data);
  };

  const submit = async () => {
    if (!studentSlug || !bookSlug) { showToast('Please select student and book.', 'danger'); return; }
    setLoading(true);
    try {
      const dd = dueDate ? new Date(dueDate).toISOString() : undefined;
      await borrowingsAPI.issueBook({ student_slug: studentSlug, book_slug: bookSlug, due_date: dd, notes });
      showToast('✅ Book issued successfully!');
      setStudent(null); setStudentId(''); setBookSlug(''); setBooks([]); setBookSearch(''); setDueDate(''); setNotes('');
    } catch (err) { showToast(err.response?.data?.detail || 'Issue failed.', 'danger'); }
    finally { setLoading(false); }
  };

  const defaultDue = () => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0]; };

  return (
    <div>
      {toast && <div className={`alert alert-${toast.type}`} style={{ position: 'fixed', top: 80, right: 24, zIndex: 300, minWidth: 300, boxShadow: 'var(--shadow-lg)' }}>{toast.msg}</div>}
      <div className="page-header"><div><h1 className="page-title">📤 Issue Book</h1><p className="page-subtitle">Issue a book to a student</p></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Student */}
        <div className="card card-body">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>👨‍🎓 Find Student</h3>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input className="form-control" placeholder="Student ID or name..." value={studentId} onChange={e => setStudentId(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchStudent()} />
            <button className="btn btn-primary" onClick={searchStudent}>Find</button>
          </div>
          {student && (
            <div style={{ background: 'var(--success-light)', border: '1px solid #a7d7bb', borderRadius: 'var(--radius)', padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{student.user?.full_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>ID: {student.student_id} · {student.department}</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>
                Books: {student.current_borrowed_count}/{student.max_books_allowed} borrowed
                {!student.can_borrow && <span className="badge badge-danger" style={{ marginLeft: 8 }}>At limit</span>}
                {!student.is_active && <span className="badge badge-danger" style={{ marginLeft: 8 }}>Suspended</span>}
              </div>
            </div>
          )}
        </div>

        {/* Book */}
        <div className="card card-body">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>📚 Select Book</h3>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input className="form-control" placeholder="Search available books..." value={bookSearch} onChange={e => setBookSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchBooks()} />
            <button className="btn btn-primary" onClick={searchBooks}>Search</button>
          </div>
          {books.length > 0 && (
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {books.map(b => (
                <div key={b.slug} onClick={() => { setBookSlug(b.slug); setBooks([b]); }}
                  style={{ padding: '10px 14px', borderRadius: 8, border: `2px solid ${bookSlug === b.slug ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', background: bookSlug === b.slug ? 'rgba(200,146,42,0.05)' : 'white', transition: 'var(--transition)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ISBN: {b.isbn} · {b.available_copies} available</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card card-body" style={{ marginTop: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>📋 Issue Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input className="form-control" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={new Date().toISOString().split('T')[0]} placeholder={defaultDue()} />
            <div className="form-hint">Leave blank for default 14-day period</div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-control" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special notes..." />
          </div>
        </div>
        <button className="btn btn-accent btn-lg" onClick={submit} disabled={loading || !student || !bookSlug}>
          {loading ? '⏳ Issuing…' : '📤 Issue Book'}
        </button>
      </div>
    </div>
  );
}
export default IssueBook;