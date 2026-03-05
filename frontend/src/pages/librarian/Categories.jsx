import { useState, useEffect } from 'react';
import { categoriesAPI } from '../../services/api';

const EMPTY = { name: '', description: '', icon: 'bi-journals' };

// Map common category names to Bootstrap icons
const CAT_ICON_MAP = {
  default:        'bi-journals',
  'computer':     'bi-cpu',
  'mathematics':  'bi-calculator',
  'engineering':  'bi-gear',
  'medicine':     'bi-heart-pulse',
  'business':     'bi-briefcase',
  'law':          'bi-scale',
  'literature':   'bi-pen',
  'history':      'bi-hourglass',
  'science':      'bi-flask',
  'social':       'bi-people',
};

const resolveIcon = (cat) => {
  if (!cat.icon) return 'bi-journals';
  // If already a bi- class, use directly
  if (cat.icon.startsWith('bi-')) return cat.icon;
  // Attempt keyword match
  const key = Object.keys(CAT_ICON_MAP).find(k => cat.name?.toLowerCase().includes(k));
  return CAT_ICON_MAP[key] || 'bi-journals';
};

export default function LibrarianCategories() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const load = () => { setLoading(true); categoriesAPI.getAll().then(r => setItems(r.data.results || r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'add') await categoriesAPI.create(form);
      else await categoriesAPI.update(form.slug, form);
      showToast(`Category ${modal === 'add' ? 'created' : 'updated'}!`);
      setModal(null); load();
    } catch (err) { showToast(err.response?.data?.name?.[0] || 'Failed.', 'danger'); }
    finally { setSaving(false); }
  };

  const del = async (slug) => {
    if (!confirm('Delete this category?')) return;
    await categoriesAPI.delete(slug); showToast('Category deleted.', 'warning'); load();
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      {toast && (
        <div className={`alert alert-${toast.type}`} style={{ position:'fixed', top:80, right:24, zIndex:300, minWidth:280, boxShadow:'var(--shadow-lg)', display:'flex', alignItems:'center', gap:8 }}>
          <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}/>{toast.msg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title"><i className="bi bi-grid-3x3-gap" style={{ marginRight:8 }}/>Categories</h1>
          <p className="page-subtitle">Manage book categories</p>
        </div>
        <button className="btn btn-primary" style={{ gap:6 }} onClick={() => { setForm(EMPTY); setModal('add'); }}>
          <i className="bi bi-plus-circle"/>Add Category
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:16 }}>
        {loading ? (
          <div className="loading-center" style={{ gridColumn:'1/-1' }}><div className="spinner"/></div>
        ) : items.length === 0 ? (
          <div className="empty-state" style={{ gridColumn:'1/-1' }}>
            <div className="empty-icon"><i className="bi bi-grid-3x3-gap"/></div>
            <div className="empty-title">No categories yet</div>
          </div>
        ) : items.map(c => {
          const icon = resolveIcon(c);
          return (
            <div key={c.slug} className="card card-body" style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
              <div style={{ width:46, height:46, borderRadius:12, background:'linear-gradient(135deg,var(--primary),var(--primary-light))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px rgba(15,35,56,.2)' }}>
                <i className={`bi ${icon}`} style={{ fontSize:20, color:'white' }}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, marginBottom:4 }}>{c.name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12, lineHeight:1.5 }}>{c.description || 'No description'}</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span className="badge badge-primary" style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <i className="bi bi-book-half"/>{c.book_count} books
                  </span>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => { setForm(c); setModal('edit'); }}>
                      <i className="bi bi-pencil"/>
                    </button>
                    <button className="btn btn-danger btn-sm" title="Delete" onClick={() => del(c.slug)}>
                      <i className="bi bi-trash"/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {modal === 'add'
                  ? <><i className="bi bi-plus-circle" style={{ marginRight:8 }}/>New Category</>
                  : <><i className="bi bi-pencil" style={{ marginRight:8 }}/>Edit Category</>}
              </h3>
              <button className="modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"/></button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label"><i className="bi bi-tag" style={{marginRight:6}}/>Name *</label>
                  <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Computer Science" />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <i className="bi bi-grid" style={{ marginRight:6 }}/>Bootstrap Icon class
                  </label>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <input className="form-control" value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="bi-journals" />
                    <div style={{ width:38, height:38, background:'var(--bg)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid var(--border)' }}>
                      <i className={`bi ${form.icon || 'bi-journals'}`} style={{ fontSize:18 }}/>
                    </div>
                  </div>
                  <div className="form-hint">e.g. bi-cpu, bi-flask, bi-briefcase — see icons.getbootstrap.com</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ gap:6 }}>
                  {saving ? <><i className="bi bi-arrow-repeat spin"/>Saving…</> : <><i className="bi bi-floppy"/>Save</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin .8s linear infinite}`}</style>
    </div>
  );
}