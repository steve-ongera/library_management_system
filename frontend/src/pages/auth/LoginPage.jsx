import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const FEATURES = [
  { icon: 'bi-journals',            text: 'Browse 50,000+ books' },
  { icon: 'bi-bookmark-star',       text: 'Reserve books online' },
  { icon: 'bi-credit-card-2-front', text: 'Pay fines digitally' },
  { icon: 'bi-graph-up-arrow',      text: 'Track your history' },
];

export default function LoginPage() {
  const [form, setForm]   = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await login(form);
      navigate(user.role === 'student' ? '/student/dashboard' : '/librarian/dashboard');
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Invalid username or password.');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      {/* ── Left panel ── */}
      <div style={S.left}>
        <div style={S.leftInner}>
          <div style={S.logoBadge}><i className="bi bi-book-fill" style={{ fontSize:28, color:'#fff' }} /></div>
          <h1 style={S.leftTitle}>UniLibrary</h1>
          <p style={S.leftSub}>Your gateway to knowledge. Access thousands of books, manage borrowings, and stay connected with your university library.</p>
          <div style={S.features}>
            {FEATURES.map(f => (
              <div key={f.text} style={S.featureRow}>
                <span style={S.featureIconBox}><i className={`bi ${f.icon}`} /></span>
                <span style={S.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={S.circle1} /><div style={S.circle2} />
      </div>

      {/* ── Right panel ── */}
      <div style={S.right}>
        <div style={S.card}>
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <h2 style={S.cardTitle}>Welcome back</h2>
            <p style={S.cardSub}>Sign in to your library account</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom:16 }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ marginRight:8 }} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={S.inputWrap}>
                <i className="bi bi-person-fill" style={S.inputIcon} />
                <input className="form-control" style={S.inputPadded} type="text"
                  placeholder="Enter your username" value={form.username} autoFocus required
                  onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={S.inputWrap}>
                <i className="bi bi-lock-fill" style={S.inputIcon} />
                <input className="form-control" style={{ ...S.inputPadded, paddingRight:40 }}
                  type={showPw ? 'text' : 'password'} placeholder="Enter your password"
                  value={form.password} required
                  onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" style={S.eyeBtn} tabIndex={-1} onClick={() => setShowPw(v => !v)}>
                  <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg"
              style={{ width:'100%', justifyContent:'center', marginTop:8, gap:8 }} disabled={loading}>
              {loading
                ? <><i className="bi bi-arrow-repeat spin" /> Signing in…</>
                : <><i className="bi bi-box-arrow-in-right" /> Sign In</>}
            </button>
          </form>

          <div style={S.divider}>
            <span style={S.divLine}/><span style={S.divText}>Don't have an account?</span><span style={S.divLine}/>
          </div>

          <Link to="/register">
            <button className="btn btn-outline btn-lg" style={{ width:'100%', justifyContent:'center', gap:8 }}>
              <i className="bi bi-person-plus" /> Register as Student
            </button>
          </Link>

          <p style={S.hint}>
            <i className="bi bi-mortarboard" style={{ marginRight:6 }} />
            Students can self-register. Librarian accounts are created by administrators.
          </p>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin .8s linear infinite}`}</style>
    </div>
  );
}

const S = {
  page:         { display:'flex', minHeight:'100vh', fontFamily:'var(--font-body)' },
  left:         { flex:1, background:'linear-gradient(145deg,#0f2338 0%,#1a3a5c 60%,#234e7a 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 48px', position:'relative', overflow:'hidden' },
  leftInner:    { position:'relative', zIndex:2, maxWidth:420, color:'#fff' },
  logoBadge:    { width:64, height:64, background:'#c8922a', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, boxShadow:'0 8px 24px rgba(200,146,42,.4)' },
  leftTitle:    { fontFamily:'var(--font-display)', fontSize:40, fontWeight:700, marginBottom:16, lineHeight:1.1 },
  leftSub:      { fontSize:16, lineHeight:1.7, color:'rgba(255,255,255,.75)', marginBottom:36 },
  features:     { display:'flex', flexDirection:'column', gap:12 },
  featureRow:   { display:'flex', alignItems:'center', gap:14, background:'rgba(255,255,255,.08)', padding:'11px 16px', borderRadius:10 },
  featureIconBox:{ width:32, height:32, background:'rgba(200,146,42,.25)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#e4b155', flexShrink:0 },
  featureText:  { fontSize:15, color:'rgba(255,255,255,.9)' },
  circle1:      { position:'absolute', width:400, height:400, borderRadius:'50%', border:'1px solid rgba(255,255,255,.06)', bottom:-100, right:-100, zIndex:1 },
  circle2:      { position:'absolute', width:240, height:240, borderRadius:'50%', background:'rgba(200,146,42,.08)', top:-40, right:40, zIndex:1 },
  right:        { width:480, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 48px', background:'#f4f6f9' },
  card:         { width:'100%', background:'#fff', borderRadius:16, padding:'40px 36px', boxShadow:'0 4px 24px rgba(0,0,0,.08)', border:'1px solid #e2e8f0' },
  cardTitle:    { fontFamily:'var(--font-display)', fontSize:26, fontWeight:700, color:'#1a202c', marginBottom:6 },
  cardSub:      { fontSize:14, color:'#718096' },
  inputWrap:    { position:'relative', display:'flex', alignItems:'center' },
  inputIcon:    { position:'absolute', left:12, color:'#a0aec0', fontSize:15, pointerEvents:'none', lineHeight:1 },
  inputPadded:  { paddingLeft:36 },
  eyeBtn:       { position:'absolute', right:10, background:'none', border:'none', cursor:'pointer', color:'#a0aec0', fontSize:16, padding:'0 4px', lineHeight:1 },
  divider:      { display:'flex', alignItems:'center', gap:10, margin:'22px 0' },
  divLine:      { flex:1, height:1, background:'#e2e8f0' },
  divText:      { fontSize:13, color:'#a0aec0', whiteSpace:'nowrap' },
  hint:         { marginTop:16, fontSize:12, color:'#a0aec0', textAlign:'center', lineHeight:1.6 },
};