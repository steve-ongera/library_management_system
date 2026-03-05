import { useState, useEffect } from 'react';
import { authorsAPI } from '../../services/api';

const EMPTY = { name: '', bio: '', nationality: '' };

export default function LibrarianAuthors() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const load = (q = '') => { setLoading(true); authorsAPI.getAll({ search: q }).then(r => setItems(r.data.results || r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') await authorsAPI.create(form);
      else await authorsAPI.update(form.slug, form);
      showToast(`Author ${modal === 'add' ? 'added' : 'updated'}!`);
      setModal(null); load();
    } catch { showToast('Failed to save.', 'danger'); }
    finally { setSaving(false); }
  };

  const del = async (slug) => {
    if (!confirm('Delete this author?')) return;
    await authorsAPI.delete(slug);
    showToast('Author deleted.', 'warning');
    load();
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      {toast && <div className={`alert alert-${toast.type}`} style={{ position: 'fixed', top: 80, right: 24, zIndex: 300, minWidth: 280, boxShadow: 'var(--shadow-lg)' }}>{toast.msg}</div>}
      <div className="page-header">
        <div><h1 className="page-title">✍️ Authors</h1><p className="page-subtitle">Manage book authors</p></div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal('add'); }}>➕ Add Author</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input className="form-control" style={{ maxWidth: 320 }} placeholder="🔍 Search authors..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(search)} />
        <button className="btn btn-primary" onClick={() => load(search)}>Search</button>
        {search && <button className="btn btn-ghost" onClick={() => { setSearch(''); load(); }}>Clear</button>}
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : items.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✍️</div><div className="empty-title">No authors found</div></div>
          ) : (
            <table className="table">
              <thead><tr><th>Name</th><th>Nationality</th><th>Books</th><th>Bio</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(a => (
                  <tr key={a.slug}>
                    <td style={{ fontWeight: 500 }}>{a.name}</td>
                    <td style={{ fontSize: 13 }}>{a.nationality || '—'}</td>
                    <td style={{ textAlign: 'center' }}><span className="badge badge-default">{a.book_count}</span></td>
                    <td style={{ fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{a.bio || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setForm(a); setModal('edit'); }}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => del(a.slug)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'add' ? '➕ Add Author' : '✏️ Edit Author'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. John Doe" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nationality</label>
                  <input className="form-control" value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="e.g. Kenyan" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea className="form-control" rows={3} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Brief biography..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving…' : '💾 Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}