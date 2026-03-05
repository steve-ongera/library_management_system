import { useState } from 'react';
import { borrowingsAPI } from '../../services/api';

const CONDITIONS = [
  { value: 'new',  icon: 'bi-stars',           label: 'New' },
  { value: 'good', icon: 'bi-check-circle',     label: 'Good' },
  { value: 'fair', icon: 'bi-exclamation-circle', label: 'Fair' },
  { value: 'poor', icon: 'bi-x-circle',         label: 'Poor' },
];

export function ReturnBook() {
  const [slug,      setSlug]      = useState('');
  const [condition, setCondition] = useState('good');
  const [notes,     setNotes]     = useState('');
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const submit = async () => {
    if (!slug.trim()) { setError('Please enter borrowing reference.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await borrowingsAPI.returnBook({ slug: slug.trim(), condition, notes });
      setResult(res.data);
      setSlug(''); setNotes('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Return failed.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="bi bi-box-arrow-in-down-left" style={{ marginRight: 8 }} />Return Book
          </h1>
          <p className="page-subtitle">Process a book return</p>
        </div>
      </div>

      <div className="card card-body" style={{ maxWidth: 560 }}>

        {/* ── Error alert ── */}
        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <i className="bi bi-exclamation-triangle-fill" />{error}
          </div>
        )}

        {/* ── Result alert ── */}
        {result && (
          <div
            className={`alert ${result.fine_generated ? 'alert-warning' : 'alert-success'}`}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}
          >
            <i className={`bi ${result.fine_generated ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`}
               style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }} />
            <div>
              {result.fine_generated ? (
                <>
                  <strong>Fine generated.</strong> KES {Number(result.fine?.amount).toLocaleString()} charged to{' '}
                  <strong>{result.borrowing?.user?.full_name}</strong>.
                </>
              ) : (
                <><strong>Book returned successfully</strong> — no fine.</>
              )}
            </div>
          </div>
        )}

        {/* ── Borrowing reference ── */}
        <div className="form-group">
          <label className="form-label">
            <i className="bi bi-upc-scan" style={{ marginRight: 6 }} />Borrowing Reference *
          </label>
          <div style={{ position: 'relative' }}>
            <i className="bi bi-search"
               style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                        color: '#a0aec0', fontSize: 14, pointerEvents: 'none' }} />
            <input
              className="form-control"
              style={{ paddingLeft: 32 }}
              value={slug}
              onChange={e => setSlug(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="e.g. john-doe-data-structures-a1b2c3d4"
            />
          </div>
          <div className="form-hint">
            <i className="bi bi-info-circle" style={{ marginRight: 4 }} />
            Scan barcode or enter the borrowing slug from the borrowings list
          </div>
        </div>

        {/* ── Book condition ── */}
        <div className="form-group">
          <label className="form-label">
            <i className="bi bi-clipboard-check" style={{ marginRight: 6 }} />Book Condition on Return
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {CONDITIONS.map(c => (
              <label
                key={c.value}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  padding: '10px 8px', borderRadius: 8, cursor: 'pointer', transition: 'var(--transition)',
                  border: `2px solid ${condition === c.value ? 'var(--accent)' : 'var(--border)'}`,
                  background: condition === c.value ? 'rgba(200,146,42,.06)' : 'white',
                }}
              >
                <input
                  type="radio"
                  name="condition"
                  value={c.value}
                  checked={condition === c.value}
                  onChange={() => setCondition(c.value)}
                  style={{ display: 'none' }}
                />
                <i className={`bi ${c.icon}`}
                   style={{ fontSize: 20, color: condition === c.value ? 'var(--accent)' : 'var(--text-muted)' }} />
                <span style={{ fontSize: 12, fontWeight: condition === c.value ? 700 : 400,
                               color: condition === c.value ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {c.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Notes ── */}
        <div className="form-group">
          <label className="form-label">
            <i className="bi bi-chat-text" style={{ marginRight: 6 }} />Notes
          </label>
          <textarea
            className="form-control"
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any damage notes..."
          />
        </div>

        {/* ── Submit ── */}
        <button
          className="btn btn-primary btn-lg"
          onClick={submit}
          disabled={loading}
          style={{ gap: 8, marginTop: 4 }}
        >
          {loading
            ? <><i className="bi bi-arrow-repeat spin" />Processing…</>
            : <><i className="bi bi-box-arrow-in-down-left" />Process Return</>}
        </button>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin .8s linear infinite}`}</style>
    </div>
  );
}

export default ReturnBook;