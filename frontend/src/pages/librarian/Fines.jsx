import { useState, useEffect } from 'react';
import { finesAPI } from '../../services/api';

const STATUS_BADGE = {
  paid:    <span className="badge badge-success"><i className="bi bi-check-circle" style={{marginRight:4}}/>Paid</span>,
  waived:  <span className="badge badge-warning"><i className="bi bi-shield-check" style={{marginRight:4}}/>Waived</span>,
  pending: <span className="badge badge-danger"><i className="bi bi-hourglass-split" style={{marginRight:4}}/>Pending</span>,
};

export default function LibrarianFines() {
  const [fines, setFines]           = useState([]);
  const [status, setStatus]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [waiveModal, setWaiveModal] = useState(null);
  const [waiveReason, setWaiveReason] = useState('');
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const load = () => { setLoading(true); finesAPI.getAll({ status }).then(r => setFines(r.data.results || r.data)).finally(() => setLoading(false)); };
  useEffect(load, [status]);

  const waive = async () => {
    try {
      await finesAPI.waive(waiveModal.slug, { waive_reason: waiveReason });
      showToast('Fine waived successfully.');
      setWaiveModal(null); setWaiveReason(''); load();
    } catch (err) { showToast(err.response?.data?.waive_reason?.[0] || 'Waive failed.', 'danger'); }
  };

  const totalPending   = fines.filter(f => f.status === 'pending').reduce((s, f) => s + Number(f.amount), 0);
  const totalCollected = fines.filter(f => f.status === 'paid').reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div>
      {toast && (
        <div className={`alert alert-${toast.type}`} style={{ position:'fixed', top:80, right:24, zIndex:300, minWidth:300, boxShadow:'var(--shadow-lg)', display:'flex', alignItems:'center', gap:8 }}>
          <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} />{toast.msg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title"><i className="bi bi-cash-coin" style={{ marginRight:8 }}/>Fines Management</h1>
          <p className="page-subtitle">Manage and waive student fines</p>
        </div>
        <div style={{ display:'flex', gap:24 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--danger)' }}>KES {totalPending.toLocaleString()}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, justifyContent:'center' }}>
              <i className="bi bi-hourglass-split"/>Pending
            </div>
          </div>
          <div style={{ width:1, background:'var(--border)' }}/>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--success)' }}>KES {totalCollected.toLocaleString()}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, justifyContent:'center' }}>
              <i className="bi bi-check-circle"/>Collected
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom:16 }}>
        <select className="form-control" style={{ width:180 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Fines</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="waived">Waived</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-center"><div className="spinner"/></div> : (
            <table className="table">
              <thead>
                <tr>
                  <th><i className="bi bi-person-fill" style={{marginRight:5}}/>Student</th>
                  <th><i className="bi bi-book-half" style={{marginRight:5}}/>Book</th>
                  <th><i className="bi bi-cash-coin" style={{marginRight:5}}/>Amount</th>
                  <th><i className="bi bi-info-circle" style={{marginRight:5}}/>Status</th>
                  <th><i className="bi bi-credit-card" style={{marginRight:5}}/>Method</th>
                  <th><i className="bi bi-calendar3" style={{marginRight:5}}/>Date</th>
                  <th><i className="bi bi-gear" style={{marginRight:5}}/>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fines.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
                    <i className="bi bi-cash-coin" style={{ fontSize:32, opacity:.3, display:'block', marginBottom:8 }}/>No fines found
                  </td></tr>
                ) : fines.map(f => (
                  <tr key={f.slug}>
                    <td><div style={{ fontWeight:500, fontSize:13 }}>{f.user?.full_name}</div></td>
                    <td style={{ fontSize:13, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.borrowing?.book?.title}</td>
                    <td style={{ fontWeight:700, color: f.status === 'pending' ? 'var(--danger)' : 'inherit' }}>KES {Number(f.amount).toLocaleString()}</td>
                    <td>{STATUS_BADGE[f.status]}</td>
                    <td style={{ fontSize:13, textTransform:'capitalize' }}>
                      {f.payment_method ? <span style={{ display:'flex', alignItems:'center', gap:5 }}><i className="bi bi-credit-card"/>{f.payment_method}</span> : '—'}
                    </td>
                    <td style={{ fontSize:12 }}>{f.paid_at ? new Date(f.paid_at).toLocaleDateString() : new Date(f.created_at).toLocaleDateString()}</td>
                    <td>
                      {f.status === 'pending' && (
                        <button className="btn btn-ghost btn-sm" style={{ gap:6 }} onClick={() => { setWaiveModal(f); setWaiveReason(''); }}>
                          <i className="bi bi-shield-check"/>Waive
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {waiveModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title"><i className="bi bi-shield-check" style={{ marginRight:8 }}/>Waive Fine</h3>
              <button className="modal-close" onClick={() => setWaiveModal(null)}><i className="bi bi-x-lg"/></button>
            </div>
            <div className="modal-body">
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'var(--bg)', borderRadius:'var(--radius)', marginBottom:20 }}>
                <i className="bi bi-person-circle" style={{ fontSize:28, color:'var(--text-muted)' }}/>
                <div>
                  <div style={{ fontWeight:600 }}>{waiveModal.user?.full_name}</div>
                  <div style={{ fontSize:13, color:'var(--danger)', fontWeight:700 }}>KES {Number(waiveModal.amount).toLocaleString()}</div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label"><i className="bi bi-chat-text" style={{ marginRight:6 }}/>Reason for Waiver *</label>
                <textarea className="form-control" rows={3} value={waiveReason} onChange={e => setWaiveReason(e.target.value)} placeholder="Provide a reason (min 10 characters)..." />
                <div className="form-hint">{waiveReason.length}/10 characters minimum</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setWaiveModal(null)}>Cancel</button>
              <button className="btn btn-accent" onClick={waive} disabled={waiveReason.length < 10} style={{ gap:6 }}>
                <i className="bi bi-shield-check"/>Confirm Waiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}