import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form);
      // Role-based redirect
      if (user.role === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/librarian/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.logoWrap}>
            <span style={styles.logoIcon}>📚</span>
          </div>
          <h1 style={styles.leftTitle}>UniLibrary</h1>
          <p style={styles.leftSubtitle}>
            Your gateway to knowledge. Access thousands of books,
            manage borrowings, and stay connected with your university library.
          </p>
          <div style={styles.features}>
            {['📖 Browse 50,000+ books', '🔖 Reserve books online', '💳 Pay fines digitally', '📊 Track your history'].map(f => (
              <div key={f} style={styles.featureItem}>{f}</div>
            ))}
          </div>
        </div>
        <div style={styles.decorCircle1} />
        <div style={styles.decorCircle2} />
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Welcome back</h2>
            <p style={styles.formSubtitle}>Sign in to your library account</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-control"
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? '⏳ Signing in…' : '🔑 Sign In'}
            </button>
          </form>

          <div style={styles.divider}>
            <span>Don't have an account?</span>
          </div>

          <Link to="/register">
            <button className="btn btn-outline btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              📝 Register as Student
            </button>
          </Link>

          <p style={styles.hint}>
            🎓 Students can self-register. Librarian accounts are created by administrators.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex', minHeight: '100vh',
    fontFamily: 'var(--font-body)',
  },
  leftPanel: {
    flex: 1, background: 'linear-gradient(145deg, #0f2338 0%, #1a3a5c 60%, #234e7a 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px 48px', position: 'relative', overflow: 'hidden',
    '@media (max-width: 768px)': { display: 'none' },
  },
  leftContent: { position: 'relative', zIndex: 2, maxWidth: 420, color: 'white' },
  logoWrap: {
    width: 64, height: 64, background: '#c8922a',
    borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 30, marginBottom: 24, boxShadow: '0 8px 24px rgba(200,146,42,0.4)',
  },
  logoIcon: { fontSize: 28 },
  leftTitle: {
    fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700,
    marginBottom: 16, lineHeight: 1.1,
  },
  leftSubtitle: {
    fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)',
    marginBottom: 36,
  },
  features: { display: 'flex', flexDirection: 'column', gap: 12 },
  featureItem: {
    fontSize: 15, color: 'rgba(255,255,255,0.9)',
    background: 'rgba(255,255,255,0.08)',
    padding: '10px 16px', borderRadius: 8,
    backdropFilter: 'blur(4px)',
  },
  decorCircle1: {
    position: 'absolute', width: 400, height: 400,
    borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)',
    bottom: -100, right: -100, zIndex: 1,
  },
  decorCircle2: {
    position: 'absolute', width: 240, height: 240,
    borderRadius: '50%', background: 'rgba(200,146,42,0.08)',
    top: -40, right: 40, zIndex: 1,
  },
  rightPanel: {
    width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 48px', background: '#f4f6f9',
  },
  formCard: {
    width: '100%', background: 'white',
    borderRadius: 16, padding: '40px 36px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0',
  },
  formHeader: { marginBottom: 28, textAlign: 'center' },
  formTitle: {
    fontFamily: 'var(--font-display)', fontSize: 26,
    fontWeight: 700, color: '#1a202c', marginBottom: 6,
  },
  formSubtitle: { fontSize: 14, color: '#718096' },
  divider: {
    textAlign: 'center', margin: '20px 0',
    fontSize: 13, color: '#a0aec0',
  },
  hint: {
    marginTop: 16, fontSize: 12, color: '#a0aec0',
    textAlign: 'center', lineHeight: 1.6,
  },
};