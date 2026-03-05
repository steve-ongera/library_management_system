import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirm_password: '',
    first_name: '', last_name: '', phone_number: '',
    student_id: '', department: '', course: '', year_of_study: 1,
    role: 'student',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const err = (field) => errors[field]?.[0] || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const { authAPI } = await import('../../services/api');
      await authAPI.register(form);
      const user = await login({ username: form.username, password: form.password });
      navigate(user.role === 'student' ? '/student/dashboard' : '/librarian/dashboard');
    } catch (err) {
      setErrors(err.response?.data || { non_field_errors: ['Registration failed.'] });
    } finally {
      setLoading(false);
    }
  };

  /* ── shared styles ── */
  const inputWrap  = { position: 'relative', display: 'flex', alignItems: 'center' };
  const inputIcon  = { position: 'absolute', left: 11, color: '#a0aec0', fontSize: 14, pointerEvents: 'none', lineHeight: 1 };
  const inputLeft  = { paddingLeft: 34 };
  const eyeBtn     = { position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', fontSize: 15, padding: '0 4px', lineHeight: 1 };
  const divLabel   = { fontSize: 13, fontWeight: 700, color: '#4a5568', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 };
  const divIcon    = { width: 24, height: 24, borderRadius: 6, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 640, background: 'white', borderRadius: 16, padding: '40px', boxShadow: '0 4px 24px rgba(0,0,0,.08)', border: '1px solid #e2e8f0' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'var(--primary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 6px 20px rgba(15,35,56,.3)' }}>
            <i className="bi bi-book-fill" style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#1a202c', marginBottom: 6 }}>
            Create Account
          </h1>
          <p style={{ fontSize: 14, color: '#718096' }}>Register for UniLibrary student access</p>
        </div>

        {/* ── Global error ── */}
        {errors.non_field_errors && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <i className="bi bi-exclamation-triangle-fill" />{errors.non_field_errors[0]}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── Personal info ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="form-label"><i className="bi bi-person" style={{ marginRight: 6 }} />First Name *</label>
              <input className={`form-control ${err('first_name') ? 'error' : ''}`} value={form.first_name} onChange={e => set('first_name', e.target.value)} required placeholder="John" />
              {err('first_name') && <div className="form-error">{err('first_name')}</div>}
            </div>
            <div className="form-group">
              <label className="form-label"><i className="bi bi-person" style={{ marginRight: 6 }} />Last Name *</label>
              <input className={`form-control ${err('last_name') ? 'error' : ''}`} value={form.last_name} onChange={e => set('last_name', e.target.value)} required placeholder="Doe" />
              {err('last_name') && <div className="form-error">{err('last_name')}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><i className="bi bi-at" style={{ marginRight: 6 }} />Username *</label>
            <div style={inputWrap}>
              <i className="bi bi-at" style={inputIcon} />
              <input className={`form-control ${err('username') ? 'error' : ''}`} style={inputLeft} value={form.username} onChange={e => set('username', e.target.value)} required placeholder="johndoe" />
            </div>
            {err('username') && <div className="form-error">{err('username')}</div>}
          </div>

          <div className="form-group">
            <label className="form-label"><i className="bi bi-envelope" style={{ marginRight: 6 }} />Email *</label>
            <div style={inputWrap}>
              <i className="bi bi-envelope" style={inputIcon} />
              <input className={`form-control ${err('email') ? 'error' : ''}`} style={inputLeft} type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="john@university.ac.ke" />
            </div>
            {err('email') && <div className="form-error">{err('email')}</div>}
          </div>

          <div className="form-group">
            <label className="form-label"><i className="bi bi-telephone" style={{ marginRight: 6 }} />Phone Number</label>
            <div style={inputWrap}>
              <i className="bi bi-telephone" style={inputIcon} />
              <input className="form-control" style={inputLeft} value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="0712345678" />
            </div>
          </div>

          {/* ── Section divider — Student Info ── */}
          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
          <p style={divLabel}>
            <span style={divIcon}><i className="bi bi-mortarboard-fill" style={{ fontSize: 13, color: '#fff' }} /></span>
            Student Information
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="form-label"><i className="bi bi-person-badge" style={{ marginRight: 6 }} />Student ID *</label>
              <div style={inputWrap}>
                <i className="bi bi-person-badge" style={inputIcon} />
                <input className={`form-control ${err('student_id') ? 'error' : ''}`} style={inputLeft} value={form.student_id} onChange={e => set('student_id', e.target.value)} required placeholder="STU2024001" />
              </div>
              {err('student_id') && <div className="form-error">{err('student_id')}</div>}
            </div>
            <div className="form-group">
              <label className="form-label"><i className="bi bi-calendar3" style={{ marginRight: 6 }} />Year of Study</label>
              <select className="form-control" value={form.year_of_study} onChange={e => set('year_of_study', parseInt(e.target.value))}>
                {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><i className="bi bi-building" style={{ marginRight: 6 }} />Department *</label>
            <div style={inputWrap}>
              <i className="bi bi-building" style={inputIcon} />
              <input className="form-control" style={inputLeft} value={form.department} onChange={e => set('department', e.target.value)} required placeholder="Computer Science" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><i className="bi bi-journal-bookmark" style={{ marginRight: 6 }} />Course / Programme *</label>
            <div style={inputWrap}>
              <i className="bi bi-journal-bookmark" style={inputIcon} />
              <input className="form-control" style={inputLeft} value={form.course} onChange={e => set('course', e.target.value)} required placeholder="BSc. Software Engineering" />
            </div>
          </div>

          {/* ── Section divider — Security ── */}
          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
          <p style={divLabel}>
            <span style={divIcon}><i className="bi bi-shield-lock-fill" style={{ fontSize: 13, color: '#fff' }} /></span>
            Security
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="form-label"><i className="bi bi-lock" style={{ marginRight: 6 }} />Password *</label>
              <div style={inputWrap}>
                <i className="bi bi-lock" style={inputIcon} />
                <input
                  className={`form-control ${err('password') ? 'error' : ''}`}
                  style={{ ...inputLeft, paddingRight: 36 }}
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                  placeholder="Min 8 characters"
                />
                <button type="button" style={eyeBtn} tabIndex={-1} onClick={() => setShowPw(v => !v)}>
                  <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
              {err('password') && <div className="form-error">{err('password')}</div>}
            </div>
            <div className="form-group">
              <label className="form-label"><i className="bi bi-lock-fill" style={{ marginRight: 6 }} />Confirm Password *</label>
              <div style={inputWrap}>
                <i className="bi bi-lock-fill" style={inputIcon} />
                <input
                  className={`form-control ${err('confirm_password') ? 'error' : ''}`}
                  style={{ ...inputLeft, paddingRight: 36 }}
                  type={showCpw ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={e => set('confirm_password', e.target.value)}
                  required
                  placeholder="Repeat password"
                />
                <button type="button" style={eyeBtn} tabIndex={-1} onClick={() => setShowCpw(v => !v)}>
                  <i className={`bi ${showCpw ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
              {err('confirm_password') && <div className="form-error">{err('confirm_password')}</div>}
            </div>
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, gap: 8 }}
            disabled={loading}
          >
            {loading
              ? <><i className="bi bi-arrow-repeat spin" />Creating account…</>
              : <><i className="bi bi-rocket-takeoff" />Create Account</>}
          </button>
        </form>

        {/* ── Sign in link ── */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#718096' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <i className="bi bi-box-arrow-in-right" />Sign in
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin .8s linear infinite}`}</style>
    </div>
  );
}