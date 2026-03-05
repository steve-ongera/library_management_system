import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const INFO_ROWS = [
  ['bi-person-badge',   'Staff ID',   u => u?.librarian_profile?.staff_id],
  ['bi-building',       'Department', u => u?.librarian_profile?.department],
  ['bi-calendar-event', 'Joined',     u => u?.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'],
];

export default function LibrarianProfile() {
  const { user, loadUser } = useAuth();
  const [form, setForm] = useState({
    first_name:   user?.first_name   || '',
    last_name:    user?.last_name    || '',
    email:        user?.email        || '',
    phone_number: user?.phone_number || '',
  });
  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState('');

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateMe(form);
      await loadUser();
      setToast('success');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="bi bi-person-badge" style={{ marginRight: 8 }} />My Profile
          </h1>
          <p className="page-subtitle">Manage your librarian account</p>
        </div>
      </div>

      {/* Toast alerts */}
      {toast === 'success' && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <i className="bi bi-check-circle-fill" />Profile updated successfully!
        </div>
      )}
      {toast === 'error' && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <i className="bi bi-exclamation-triangle-fill" />Failed to update profile.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>

        {/* Left — Identity card */}
        <div className="card card-body" style={{ textAlign: 'center' }}>

          {/* Avatar initials */}
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            color: 'white', fontSize: 32, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(26,58,92,.3)',
          }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>

          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 4 }}>
            {user?.first_name} {user?.last_name}
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <i className="bi bi-at" />{user?.username}
          </p>

          <span className="badge badge-primary" style={{ display: 'inline-flex', margin: '0 auto', padding: '5px 14px', gap: 6, textTransform: 'capitalize' }}>
            <i className="bi bi-person-badge" />{user?.role}
          </span>

          {/* Staff info rows */}
          {user?.librarian_profile && (
            <div style={{ marginTop: 20, textAlign: 'left', background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="bi bi-info-circle" />Staff Information
              </div>
              {INFO_ROWS.map(([icon, label, getValue]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className={`bi ${icon}`} />{label}
                  </span>
                  <span style={{ fontWeight: 600 }}>{getValue(user)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Contact quick-view */}
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: 'bi-envelope',  label: 'Email', val: user?.email },
              { icon: 'bi-telephone', label: 'Phone', val: user?.phone_number || '—' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <i className={`bi ${item.icon}`} />{item.label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Edit form */}
        <div className="card card-body">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-pencil-square" style={{ color: 'var(--accent)' }} />Edit Profile
          </h3>

          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-person" style={{ marginRight: 6 }} />First Name
                </label>
                <input
                  className="form-control"
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-person" style={{ marginRight: 6 }} />Last Name
                </label>
                <input
                  className="form-control"
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <i className="bi bi-envelope" style={{ marginRight: 6 }} />Email Address
              </label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <i className="bi bi-telephone" style={{ marginRight: 6 }} />Phone Number
              </label>
              <input
                className="form-control"
                value={form.phone_number}
                onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                placeholder="0712345678"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ gap: 8 }}>
                {saving
                  ? <><i className="bi bi-arrow-repeat spin" />Saving…</>
                  : <><i className="bi bi-floppy" />Save Changes</>}
              </button>
              {!saving && toast === 'success' && (
                <span style={{ fontSize: 13, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="bi bi-check-circle-fill" />Saved!
                </span>
              )}
            </div>
          </form>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin .8s linear infinite}`}</style>
    </div>
  );
}