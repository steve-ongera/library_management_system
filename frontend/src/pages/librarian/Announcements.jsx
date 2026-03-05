import { useState, useEffect } from 'react';
import { announcementsAPI } from '../../services/api';

const EMPTY = { title: '', content: '', target_role: 'all', is_active: true };

export default function LibrarianAnnouncements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const load = () => { setLoading(true); announcementsAPI.getAll().then(r => setItems(r.data.results || r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') await announcementsAPI.create(form);
      else await announcementsAPI.update(form.slug, form);
      showToast(`Announcement ${modal === 'add' ? 'posted' : 'updated'}!`);
      setModal(null); load();
    } catch { showToast('Failed to save.', 'danger'); }
    finally { setSaving(false); }
  };

  const del = async (slug) => {
    if (!confirm('Delete this announcement?')) return;
    await announcementsAPI.delete(slug);
    showToast('Deleted.', 'warning');
    load();
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const targetLabel = { all: '🌐 All', student: '👨‍🎓 Students', librarian: '📚 Librarians' };

  return (
    <div>
      {toast && <div className={`alert alert-${toast.type}`} style={{ position: 'fixed', top: 80, right: 24, zIndex: 300, minWidth: 280, boxShadow: 'var(--shadow-lg)' }}>{toast.msg}</div>}
      <div className="page-header">
        <div><h1 className="page-title">📢 Announcements</h1><p className="page-subtitle">Post library announcements</p></div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setModal('add'); }}>➕ New Announcement</button>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : items.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📢</div><div className="empty-title">No announcements yet</div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map(a => (
            <div key={a.slug} className="card card-body" style={{ opacity: a.is_active ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{a.title}</h3>
                    {!a.is_active && <span className="badge badge-default">Draft</span>}
                    <span className="badge badge-info" style={{ fontSize: 11 }}>{targetLabel[a.target_role]}</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(a.created_at).toLocaleDateString()} · by {a.created_by?.full_name}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setForm(a); setModal('edit'); }}>✏️ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => del(a.slug)}>🗑️</button>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14 }}>{a.content}</p>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'add' ? '➕ New Announcement' : '✏️ Edit Announcement'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-control" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Announcement title..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Content *</label>
                  <textarea className="form-control" rows={5} value={form.content} onChange={e => set('content', e.target.value)} required placeholder="Write your announcement..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Target Audience</label>
                    <select className="form-control" value={form.target_role} onChange={e => set('target_role', e.target.value)}>
                      <option value="all">All Users</option>
                      <option value="student">Students Only</option>
                      <option value="librarian">Librarians Only</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={form.is_active ? 'active' : 'draft'} onChange={e => set('is_active', e.target.value === 'active')}>
                      <option value="active">Active (Published)</option>
                      <option value="draft">Draft (Hidden)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '⏳ Saving…' : '📢 Publish'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}