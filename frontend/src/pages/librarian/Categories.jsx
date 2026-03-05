import { useState, useEffect } from 'react';
import { categoriesAPI } from '../../services/api';

const EMPTY = { name: '', description: '', icon: '📚' };

export default function LibrarianCategories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const load = () => { setLoading(true); categoriesAPI.getAll().then(r => setItems(r.data.results || r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') await categoriesAPI.create(form);
      else await categoriesAPI.update(form.slug, form);
      showToast(`Category ${modal === 'add' ? 'created' : 'updated'}!`);
      setModal(null);
      load();
    } catch (err) { showToast(err.response?.data?.name?.[0] || 'Failed.', 'danger'); }
    finally { setSaving(false); }
  };

  const del = async (slug) => {
    if (!confirm('Delete this category?')) return;
    await categoriesAPI.delete(slug);
    showToast('Category deleted.', 'warning');
    load();
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      {toast && <div className={`alert alert-${toast.type}`} style={{ position: 'fixed', top: 80, right: 24, zIndex: 300, minWidth: 280, boxShadow: 'var(--shadow-lg)' }}>{toast.msg}</div>}
      <div className="page-header">
        <div><h1 className="page-title">🗂️ Categories</h1><p className="page-subtitle">Manage book categories</p></div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal('add'); }}>➕ Add Category</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {loading ? <div className="loading-center" style={{ gridColumn: '1/-1' }}><div className="spinner" /></div> :
          items.map(c => (
            <div key={c.slug} className="card card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ fontSize: 32, lineHeight: 1 }}>{c.icon || '📚'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{c.description || 'No description'}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="badge badge-primary">{c.book_count} books</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setForm(c); setModal('edit'); }}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => del(c.slug)}>🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'add' ? '➕ New Category' : '✏️ Edit Category'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Computer Science" />
                </div>
                <div className="form-group">
                  <label className="form-label">Icon (emoji)</label>
                  <input className="form-control" value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="📚" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
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