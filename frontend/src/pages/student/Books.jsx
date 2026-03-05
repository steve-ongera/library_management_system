import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { booksAPI, categoriesAPI, reservationsAPI } from '../../services/api';

export default function StudentBooks() {
  const [books,        setBooks]        = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [reserving,    setReserving]    = useState(false);
  const [toast,        setToast]        = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const search    = searchParams.get('search')   || '';
  const category  = searchParams.get('category') || '';
  const available = searchParams.get('available')|| '';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    Promise.all([
      booksAPI.getAll({ search, category__slug: category, available: available || undefined }),
      categoriesAPI.getAll(),
    ]).then(([bRes, cRes]) => {
      setBooks(bRes.data.results || bRes.data);
      setCategories(cRes.data.results || cRes.data);
    }).finally(() => setLoading(false));
  }, [search, category, available]);

  const handleReserve = async (book) => {
    setReserving(true);
    try {
      await reservationsAPI.create({ book_slug: book.slug });
      showToast(`"${book.title}" reserved successfully!`);
      setSelectedBook(null);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Could not reserve. You may already have a reservation.', 'danger');
    } finally {
      setReserving(false);
    }
  };

  const BOOK_DETAILS = (b) => [
    ['bi-calendar3',       'Published', b.publication_year || 'N/A'],
    ['bi-geo-alt',         'Location',  b.location || 'Check desk'],
    ['bi-translate',       'Language',  b.language],
    ['bi-clipboard-check', 'Condition', b.condition],
    ['bi-box-seam',        'Available', `${b.available_copies} of ${b.total_copies}`],
    ['bi-cash-coin',       'Fine/day',  `KES ${b.fine_per_day}`],
  ];

  return (
    <div>
      {/* ── Toast ── */}
      {toast && (
        <div className={`alert alert-${toast.type}`} style={{ position: 'fixed', top: 80, right: 24, zIndex: 300, minWidth: 300, boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} />
          {toast.msg}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title"><i className="bi bi-journals" style={{ marginRight: 8 }} />Browse Library</h1>
          <p className="page-subtitle">Discover and reserve books from our collection</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card card-body" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', padding: '16px 20px', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', fontSize: 14, pointerEvents: 'none' }} />
          <input
            className="form-control"
            style={{ maxWidth: 280, paddingLeft: 32 }}
            placeholder="Search title, author, ISBN..."
            defaultValue={search}
            onKeyDown={e => {
              if (e.key === 'Enter')
                setSearchParams(p => { const n = new URLSearchParams(p); n.set('search', e.target.value); return n; });
            }}
          />
        </div>

        <select className="form-control" style={{ maxWidth: 200 }} value={category}
          onChange={e => setSearchParams(p => { const n = new URLSearchParams(p); n.set('category', e.target.value); return n; })}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={available === 'true'}
            onChange={e => setSearchParams(p => { const n = new URLSearchParams(p); n.set('available', e.target.checked ? 'true' : ''); return n; })} />
          Available only
        </label>

        {(search || category || available) && (
          <button className="btn btn-ghost btn-sm" style={{ gap: 5 }} onClick={() => setSearchParams({})}>
            <i className="bi bi-x-lg" />Clear
          </button>
        )}
      </div>

      {/* ── Book grid ── */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="bi bi-search" /></div>
          <div className="empty-title">No books found</div>
          <div className="empty-desc">Try adjusting your search filters</div>
        </div>
      ) : (
        <div className="book-grid">
          {books.map(book => (
            <div key={book.slug} className="book-card" onClick={() => setSelectedBook(book)}>
              <div className="book-cover">
                {book.cover_image
                  ? <img src={book.cover_image} alt={book.title} />
                  : <i className="bi bi-book-fill" style={{ fontSize: 40, color: 'rgba(255,255,255,.7)' }} />}
                <div className="book-availability">
                  {book.is_available
                    ? <span className="badge badge-success"><i className="bi bi-check-lg" style={{ marginRight: 3 }} />Available</span>
                    : <span className="badge badge-danger"><i className="bi bi-x-lg" style={{ marginRight: 3 }} />Unavailable</span>}
                </div>
              </div>
              <div className="book-info">
                <div className="book-title">{book.title}</div>
                <div className="book-author">{book.authors?.map(a => a.name).join(', ') || 'Unknown Author'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-default" style={{ fontSize: 11 }}>{book.category?.name || 'General'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{book.available_copies}/{book.total_copies} left</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Book detail modal ── */}
      {selectedBook && (
        <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><i className="bi bi-book" style={{ marginRight: 8 }} />Book Details</h3>
              <button className="modal-close" onClick={() => setSelectedBook(null)}><i className="bi bi-x-lg" /></button>
            </div>

            <div className="modal-body">
              {/* Book hero */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                <div style={{ width: 100, height: 140, background: 'linear-gradient(135deg,var(--primary),var(--primary-light))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selectedBook.cover_image
                    ? <img src={selectedBook.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    : <i className="bi bi-book-fill" style={{ fontSize: 40, color: 'rgba(255,255,255,.8)' }} />}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{selectedBook.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <i className="bi bi-person-lines-fill" style={{ marginRight: 5 }} />by {selectedBook.authors?.map(a => a.name).join(', ')}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    <i className="bi bi-upc" style={{ marginRight: 5 }} />ISBN: {selectedBook.isbn}
                  </p>
                  {selectedBook.category && (
                    <span className="badge badge-primary" style={{ marginTop: 8 }}>{selectedBook.category.name}</span>
                  )}
                </div>
              </div>

              {selectedBook.description && (
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>{selectedBook.description}</p>
              )}

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                {BOOK_DETAILS(selectedBook).map(([icon, label, value]) => (
                  <div key={label} style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <i className={`bi ${icon}`} />{label}
                    </div>
                    <div style={{ fontWeight: 600 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedBook(null)}>Close</button>
              <button className="btn btn-accent" style={{ gap: 7 }}
                disabled={!selectedBook.is_available || reserving}
                onClick={() => handleReserve(selectedBook)}>
                {reserving
                  ? <><i className="bi bi-arrow-repeat spin" />Reserving…</>
                  : selectedBook.is_available
                    ? <><i className="bi bi-bookmark-plus" />Reserve Book</>
                    : <><i className="bi bi-x-circle" />Unavailable</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin .8s linear infinite}`}</style>
    </div>
  );
}