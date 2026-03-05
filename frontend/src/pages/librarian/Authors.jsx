import { useState, useEffect } from 'react';
import { authorsAPI } from '../../services/api';

const EMPTY = { name: '', bio: '', nationality: '' };

export default function LibrarianAuthors() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast]   = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const load = (q = '') => { setLoading(true); authorsAPI.getAll({ search: q }).then(r => setItems(r.data.results || r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
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
    await authorsAPI.delete(slug); showToast('Author deleted.', 'warning'); load();
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
          <h1 className="page-title"><i className="bi bi-person-lines-fill" style={{ marginRight:8 }}/>Authors</h1>
          <p className="page-subtitle">Manage book authors</p>
        </div>
        <button className="btn btn-primary" style={{ gap:6 }} onClick={() => { setForm(EMPTY); setModal('add'); }}>
          <i className="bi bi-person-plus"/>Add Author
        </button>
      </div>

      {/* Search */}
      <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, maxWidth:360 }}>
          <i className="bi bi-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#a0aec0', fontSize:14 }}/>
          <input className="form-control" style={{ paddingLeft:32 }} placeholder="Search authors..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(search)} />
        </div>
        <button className="btn btn-primary" style={{ gap:6 }} onClick={() => load(search)}><i className="bi bi-search"/>Search</button>
        {search && <button className="btn btn-ghost" style={{ gap:6 }} onClick={() => { setSearch(''); load(); }}><i className="bi bi-x-lg"/>Clear</button>}
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-center"><div className="spinner"/></div>
          : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><i className="bi bi-person-lines-fill"/></div>
              <div className="empty-title">No authors found</div>
            </div>
          ) : (
            <table className="table">
              <thead><tr>
                <th><i className="bi bi-person-fill" style={{marginRight:5}}/>Name</th>
                <th><i className="bi bi-geo-alt" style={{marginRight:5}}/>Nationality</th>
                <th><i className="bi bi-book-half" style={{marginRight:5}}/>Books</th>
                <th><i className="bi bi-file-text" style={{marginRight:5}}/>Bio</th>
                <th><i className="bi bi-gear" style={{marginRight:5}}/>Actions</th>
              </tr></thead>
              <tbody>
                {items.map(a => (
                  <tr key={a.slug}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--primary)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 }}>
                          {a.name?.[0]}
                        </div>
                        <span style={{ fontWeight:500 }}>{a.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize:13 }}>
                      {a.nationality
                        ? <span style={{ display:'flex', alignItems:'center', gap:5 }}><i className="bi bi-geo-alt"/>{a.nationality}</span>
                        : '—'}
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <span className="badge badge-default" style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                        <i className="bi bi-book-half"/>{a.book_count}
                      </span>
                    </td>
                    <td style={{ fontSize:12, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text-muted)' }}>{a.bio || '—'}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => { setForm(a); setModal('edit'); }}><i className="bi bi-pencil"/></button>
                        <button className="btn btn-danger btn-sm" title="Delete" onClick={() => del(a.slug)}><i className="bi bi-trash"/></button>
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
              <h3 className="modal-title">
                {modal === 'add'
                  ? <><i className="bi bi-person-plus" style={{ marginRight:8 }}/>Add Author</>
                  : <><i className="bi bi-pencil" style={{ marginRight:8 }}/>Edit Author</>}
              </h3>
              <button className="modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"/></button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label"><i className="bi bi-person" style={{ marginRight:6 }}/>Full Name *</label>
                  <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Ngugi wa Thiong'o" />
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="bi bi-geo-alt" style={{ marginRight:6 }}/>Nationality</label>
                  <input className="form-control" value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="e.g. Kenyan" />
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="bi bi-file-text" style={{ marginRight:6 }}/>Bio</label>
                  <textarea className="form-control" rows={3} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Brief biography..." />
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