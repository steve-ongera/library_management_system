import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const STUDENT_INFO_ROWS = [
  ['bi-person-badge',     'ID',     u => u.student_profile.student_id],
  ['bi-building',         'Dept',   u => u.student_profile.department],
  ['bi-journal-bookmark', 'Course', u => u.student_profile.course],
  ['bi-calendar3',        'Year',   u => `Year ${u.student_profile.year_of_study}`],
];

export function Profile() {
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
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="bi bi-person-circle" style={{ marginRight: 8 }} />My Profile
          </h1>
          <p className="page-subtitle">Manage your account details</p>
        </div>
      </div>

      {/* ── Toast ── */}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>

        {/* ── Left — Identity card ── */}
        <div className="card card-body" style={{ textAlign: 'center' }}>

          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--primary)', color: 'white',
            fontSize: 28, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 6px 20px rgba(15,35,56,.25)',
          }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>

          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 4 }}>
            {user?.first_name} {user?.last_name}
          </h3>

          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <i className="bi bi-at" />{user?.username}
          </p>

          <span className="badge badge-primary" style={{ margin: '0 auto', display: 'inline-flex', textTransform: 'capitalize', gap: 5 }}>
            <i className="bi bi-person-badge" />{user?.role}
          </span>

          {/* Student info rows */}
          {user?.student_profile && (
            <div style={{ marginTop: 20, textAlign: 'left', background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="bi bi-mortarboard" />Student Info
              </div>
              {STUDENT_INFO_ROWS.map(([icon, label, getValue]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className={`bi ${icon}`} />{label}
                  </span>
                  <span style={{ fontWeight: 600 }}>{getValue(user)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right — Edit form ── */}
        <div className="card card-body">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-pencil-square" style={{ color: 'var(--accent)' }} />Edit Profile
          </h3>

          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label"><i className="bi bi-person" style={{ marginRight: 6 }} />First Name</label>
                <input className="form-control" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label"><i className="bi bi-person" style={{ marginRight: 6 }} />Last Name</label>
                <input className="form-control" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><i className="bi bi-envelope" style={{ marginRight: 6 }} />Email</label>
              <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label"><i className="bi bi-telephone" style={{ marginRight: 6 }} />Phone Number</label>
              <input className="form-control" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} placeholder="0712345678" />
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
export default Profile;