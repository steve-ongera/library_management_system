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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      // Register then auto-login
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

  const err = (field) => errors[field]?.[0] || '';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 640, background: 'white', borderRadius: 16, padding: '40px 40px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📚</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: '#1a202c', marginBottom: 6 }}>
            Create Account
          </h1>
          <p style={{ fontSize: 14, color: '#718096' }}>Register for UniLibrary student access</p>
        </div>

        {errors.non_field_errors && (
          <div className="alert alert-danger">{errors.non_field_errors[0]}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className={`form-control ${err('first_name') ? 'error' : ''}`} value={form.first_name} onChange={e => set('first_name', e.target.value)} required placeholder="John" />
              {err('first_name') && <div className="form-error">{err('first_name')}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className={`form-control ${err('last_name') ? 'error' : ''}`} value={form.last_name} onChange={e => set('last_name', e.target.value)} required placeholder="Doe" />
              {err('last_name') && <div className="form-error">{err('last_name')}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username *</label>
            <input className={`form-control ${err('username') ? 'error' : ''}`} value={form.username} onChange={e => set('username', e.target.value)} required placeholder="johndoe" />
            {err('username') && <div className="form-error">{err('username')}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className={`form-control ${err('email') ? 'error' : ''}`} type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="john@university.ac.ke" />
            {err('email') && <div className="form-error">{err('email')}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-control" value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="0712345678" />
          </div>

          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 12 }}>🎓 Student Information</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="form-label">Student ID *</label>
              <input className={`form-control ${err('student_id') ? 'error' : ''}`} value={form.student_id} onChange={e => set('student_id', e.target.value)} required placeholder="STU2024001" />
              {err('student_id') && <div className="form-error">{err('student_id')}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Year of Study</label>
              <select className="form-control" value={form.year_of_study} onChange={e => set('year_of_study', parseInt(e.target.value))}>
                {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Department *</label>
            <input className="form-control" value={form.department} onChange={e => set('department', e.target.value)} required placeholder="Computer Science" />
          </div>

          <div className="form-group">
            <label className="form-label">Course / Programme *</label>
            <input className="form-control" value={form.course} onChange={e => set('course', e.target.value)} required placeholder="BSc. Software Engineering" />
          </div>

          <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 12 }}>🔒 Security</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className={`form-control ${err('password') ? 'error' : ''}`} type="password" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="Min 8 characters" />
              {err('password') && <div className="form-error">{err('password')}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input className={`form-control ${err('confirm_password') ? 'error' : ''}`} type="password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} required placeholder="Repeat password" />
              {err('confirm_password') && <div className="form-error">{err('confirm_password')}</div>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? '⏳ Creating account…' : '🚀 Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#718096' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}