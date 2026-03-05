import { useState } from 'react';
import { studentsAPI, booksAPI, borrowingsAPI } from '../../services/api';

export function IssueBook() {
  const [studentSlug, setStudentSlug] = useState('');
  const [studentId,   setStudentId]   = useState('');
  const [student,     setStudent]     = useState(null);
  const [bookSlug,    setBookSlug]    = useState('');
  const [bookSearch,  setBookSearch]  = useState('');
  const [books,       setBooks]       = useState([]);
  const [dueDate,     setDueDate]     = useState('');
  const [notes,       setNotes]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

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
      showToast('Book issued successfully!');
      setStudent(null); setStudentId(''); setBookSlug(''); setBooks([]);
      setBookSearch(''); setDueDate(''); setNotes('');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Issue failed.', 'danger');
    } finally { setLoading(false); }
  };

  const defaultDue = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  return (
    <div>
      {/* ── Toast ── */}
      {toast && (
        <div
          className={`alert alert-${toast.type}`}
          style={{ position: 'fixed', top: 80, right: 24, zIndex: 300, minWidth: 300,
                   boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} />
          {toast.msg}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="bi bi-box-arrow-up-right" style={{ marginRight: 8 }} />Issue Book
          </h1>
          <p className="page-subtitle">Issue a book to a student</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* ── Find Student ── */}
        <div className="card card-body">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16,
                       display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-mortarboard-fill" style={{ color: 'var(--accent)' }} />Find Student
          </h3>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <i className="bi bi-search"
                 style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                          color: '#a0aec0', fontSize: 14, pointerEvents: 'none' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 32 }}
                placeholder="Student ID or name..."
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchStudent()}
              />
            </div>
            <button className="btn btn-primary" style={{ gap: 6 }} onClick={searchStudent}>
              <i className="bi bi-search" />Find
            </button>
          </div>

          {student && (
            <div style={{ background: 'var(--success-light)', border: '1px solid #a7d7bb',
                          borderRadius: 'var(--radius)', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <i className="bi bi-person-check-fill" style={{ fontSize: 20, color: 'var(--success)' }} />
                <div style={{ fontWeight: 700, fontSize: 16 }}>{student.user?.full_name}</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span><i className="bi bi-person-badge" style={{ marginRight: 4 }} />ID: {student.student_id}</span>
                <span><i className="bi bi-building" style={{ marginRight: 4 }} />{student.department}</span>
              </div>
              <div style={{ fontSize: 13, marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <i className="bi bi-book-half" />
                Books: {student.current_borrowed_count}/{student.max_books_allowed} borrowed
                {!student.can_borrow && (
                  <span className="badge badge-danger">
                    <i className="bi bi-slash-circle" style={{ marginRight: 4 }} />At limit
                  </span>
                )}
                {!student.is_active && (
                  <span className="badge badge-danger">
                    <i className="bi bi-exclamation-triangle" style={{ marginRight: 4 }} />Suspended
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Select Book ── */}
        <div className="card card-body">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16,
                       display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-journals" style={{ color: 'var(--accent)' }} />Select Book
          </h3>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <i className="bi bi-search"
                 style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                          color: '#a0aec0', fontSize: 14, pointerEvents: 'none' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 32 }}
                placeholder="Search available books..."
                value={bookSearch}
                onChange={e => setBookSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchBooks()}
              />
            </div>
            <button className="btn btn-primary" style={{ gap: 6 }} onClick={searchBooks}>
              <i className="bi bi-search" />Search
            </button>
          </div>

          {books.length > 0 && (
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {books.map(b => (
                <div
                  key={b.slug}
                  onClick={() => { setBookSlug(b.slug); setBooks([b]); }}
                  style={{
                    padding: '10px 14px', borderRadius: 8, cursor: 'pointer', transition: 'var(--transition)',
                    border: `2px solid ${bookSlug === b.slug ? 'var(--accent)' : 'var(--border)'}`,
                    background: bookSlug === b.slug ? 'rgba(200,146,42,.05)' : 'white',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {bookSlug === b.slug
                      ? <i className="bi bi-check-circle-fill" style={{ color: 'var(--accent)' }} />
                      : <i className="bi bi-book-half" style={{ color: 'var(--text-muted)' }} />}
                    {b.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 10 }}>
                    <span><i className="bi bi-upc" style={{ marginRight: 4 }} />ISBN: {b.isbn}</span>
                    <span><i className="bi bi-stack" style={{ marginRight: 4 }} />{b.available_copies} available</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Issue Details ── */}
      <div className="card card-body" style={{ marginTop: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16,
                     display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bi bi-clipboard-check" style={{ color: 'var(--accent)' }} />Issue Details
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="form-group">
            <label className="form-label">
              <i className="bi bi-calendar3" style={{ marginRight: 6 }} />Due Date
            </label>
            <input
              className="form-control"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              placeholder={defaultDue()}
            />
            <div className="form-hint">
              <i className="bi bi-info-circle" style={{ marginRight: 4 }} />Leave blank for default 14-day period
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <i className="bi bi-chat-text" style={{ marginRight: 6 }} />Notes
            </label>
            <input
              className="form-control"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special notes..."
            />
          </div>
        </div>

        <button
          className="btn btn-accent btn-lg"
          onClick={submit}
          disabled={loading || !student || !bookSlug}
          style={{ gap: 8, marginTop: 4 }}
        >
          {loading
            ? <><i className="bi bi-arrow-repeat spin" />Issuing…</>
            : <><i className="bi bi-box-arrow-up-right" />Issue Book</>}
        </button>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin .8s linear infinite}`}</style>
    </div>
  );
}

export default IssueBook;