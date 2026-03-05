// ReturnBook.jsx
import { useState } from 'react';
import { borrowingsAPI } from '../../services/api';

export function ReturnBook() {
  const [slug, setSlug] = useState('');
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!slug.trim()) { setError('Please enter borrowing reference.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await borrowingsAPI.returnBook({ slug: slug.trim(), condition, notes });
      setResult(res.data);
      setSlug(''); setNotes('');
    } catch (err) { setError(err.response?.data?.detail || 'Return failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">↩️ Return Book</h1><p className="page-subtitle">Process a book return</p></div></div>
      <div className="card card-body" style={{ maxWidth: 560 }}>
        {error && <div className="alert alert-danger">{error}</div>}
        {result && (
          <div className={`alert ${result.fine_generated ? 'alert-warning' : 'alert-success'}`}>
            {result.fine_generated
              ? `⚠️ Book returned with fine! KES ${Number(result.fine?.amount).toLocaleString()} charged to ${result.borrowing?.user?.full_name}.`
              : '✅ Book returned successfully — no fine.'}
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Borrowing Reference (slug) *</label>
          <input className="form-control" value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g. john-doe-data-structures-a1b2c3d4" />
          <div className="form-hint">Scan barcode or enter the borrowing slug from the borrowings list</div>
        </div>
        <div className="form-group">
          <label className="form-label">Book Condition on Return</label>
          <select className="form-control" value={condition} onChange={e => setCondition(e.target.value)}>
            {['new', 'good', 'fair', 'poor'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-control" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any damage notes..." />
        </div>
        <button className="btn btn-primary btn-lg" onClick={submit} disabled={loading}>{loading ? '⏳ Processing…' : '↩️ Process Return'}</button>
      </div>
    </div>
  );
}
export default ReturnBook;