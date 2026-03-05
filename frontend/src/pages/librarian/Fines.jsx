import { useState, useEffect } from 'react';
import { finesAPI } from '../../services/api';

export default function LibrarianFines() {
  const [fines, setFines] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [waiveModal, setWaiveModal] = useState(null);
  const [waiveReason, setWaiveReason] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = () => { setLoading(true); finesAPI.getAll({ status }).then(r => setFines(r.data.results || r.data)).finally(() => setLoading(false)); };
  useEffect(load, [status]);

  const waive = async () => {
    try {
      await finesAPI.waive(waiveModal.slug, { waive_reason: waiveReason });
      showToast('Fine waived.');
      setWaiveModal(null); setWaiveReason('');
      load();
    } catch (err) { showToast(err.response?.data?.waive_reason?.[0] || 'Waive failed.', 'danger'); }
  };

  const totalPending = fines.filter(f => f.status === 'pending').reduce((s, f) => s + Number(f.amount), 0);
  const totalCollected = fines.filter(f => f.status === 'paid').reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div>
      {toast && <div className={`alert alert-${toast.type}`} style={{ position: 'fixed', top: 80, right: 24, zIndex: 300, minWidth: 300, boxShadow: 'var(--shadow-lg)' }}>{toast.msg}</div>}
      <div className="page-header">
        <div><h1 className="page-title">💰 Fines Management</h1><p className="page-subtitle">Manage student fines</p></div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--danger)' }}>KES {totalPending.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pending</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>KES {totalCollected.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Collected</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select className="form-control" style={{ width: 180 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Fines</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="waived">Waived</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <table className="table">
              <thead><tr><th>Student</th><th>Book</th><th>Amount</th><th>Status</th><th>Method</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {fines.map(f => (
                  <tr key={f.slug}>
                    <td><div style={{ fontWeight: 500, fontSize: 13 }}>{f.user?.full_name}</div></td>
                    <td style={{ fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.borrowing?.book?.title}</td>
                    <td style={{ fontWeight: 700, color: f.status === 'pending' ? 'var(--danger)' : 'inherit' }}>KES {Number(f.amount).toLocaleString()}</td>
                    <td>
                      {f.status === 'paid' ? <span className="badge badge-success">✅ Paid</span>
                        : f.status === 'waived' ? <span className="badge badge-warning">🤝 Waived</span>
                        : <span className="badge badge-danger">⏳ Pending</span>}
                    </td>
                    <td style={{ fontSize: 13, textTransform: 'capitalize' }}>{f.payment_method || '—'}</td>
                    <td style={{ fontSize: 12 }}>{f.paid_at ? new Date(f.paid_at).toLocaleDateString() : new Date(f.created_at).toLocaleDateString()}</td>
                    <td>
                      {f.status === 'pending' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => { setWaiveModal(f); setWaiveReason(''); }}>🤝 Waive</button>
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
            <div className="modal-header"><h3 className="modal-title">🤝 Waive Fine</h3><button className="modal-close" onClick={() => setWaiveModal(null)}>✕</button></div>
            <div className="modal-body">
              <p style={{ marginBottom: 16, fontSize: 14 }}>Waiving <strong>KES {Number(waiveModal.amount).toLocaleString()}</strong> fine for <strong>{waiveModal.user?.full_name}</strong></p>
              <div className="form-group">
                <label className="form-label">Reason for Waiver *</label>
                <textarea className="form-control" rows={3} value={waiveReason} onChange={e => setWaiveReason(e.target.value)} placeholder="Provide a reason (min 10 characters)..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setWaiveModal(null)}>Cancel</button>
              <button className="btn btn-accent" onClick={waive} disabled={waiveReason.length < 10}>Confirm Waiver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}