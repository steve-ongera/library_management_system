import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

export default function LibrarianProfile() {
  const { user, loadUser } = useAuth();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateMe(form);
      await loadUser();
      setToast('Profile updated successfully!');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">👤 My Profile</h1><p className="page-subtitle">Manage your librarian account</p></div>
      </div>

      {toast && <div className="alert alert-success">{toast}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Left - Identity Card */}
        <div className="card card-body" style={{ textAlign: 'center' }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            color: 'white', fontSize: 32, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(26,58,92,0.3)',
          }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 4 }}>
            {user?.first_name} {user?.last_name}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>@{user?.username}</p>
          <span className="badge badge-primary" style={{ display: 'inline-flex', margin: '0 auto', textTransform: 'capitalize', padding: '5px 14px' }}>
            📚 {user?.role}
          </span>

          {user?.librarian_profile && (
            <div style={{ marginTop: 20, textAlign: 'left', background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Staff Information
              </div>
              {[
                ['Staff ID', user.librarian_profile.staff_id],
                ['Department', user.librarian_profile.department],
                ['Joined', new Date(user.date_joined).toLocaleDateString()],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right - Edit Form */}
        <div className="card card-body">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>✏️ Edit Profile</h3>
          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-control" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-control" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-control" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="0712345678" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '⏳ Saving…' : '💾 Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}