import { useState, useEffect } from 'react';
import { finesAPI } from '../../services/api';

const GATEWAYS = [
  { id: 'mpesa', label: '📱 M-Pesa', desc: 'Pay via Safaricom M-Pesa STK Push', currency: 'KES' },
  { id: 'paypal', label: '🅿️ PayPal', desc: 'Pay with PayPal account', currency: 'USD' },
  { id: 'stripe', label: '💳 Card (Stripe)', desc: 'Visa / Mastercard / Amex', currency: 'KES' },
];

export default function StudentFines() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);  // { fine }
  const [gateway, setGateway] = useState('mpesa');
  const [phone, setPhone] = useState('');
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = () => {
    finesAPI.getAll().then(res => setFines(res.data.results || res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePay = async () => {
    if (gateway === 'mpesa' && !phone) {
      showToast('Please enter your M-Pesa phone number.', 'danger');
      return;
    }
    setPaying(true);
    try {
      const payload = { gateway, fine_slug: payModal.fine.slug };
      if (gateway === 'mpesa') payload.phone_number = phone;
      if (gateway === 'paypal') {
        payload.return_url = `${window.location.origin}/student/fines?paypal=success`;
        payload.cancel_url = `${window.location.origin}/student/fines?paypal=cancel`;
      }

      const res = await finesAPI.initiatePayment(payModal.fine.slug, payload);

      if (gateway === 'mpesa') {
        showToast('✅ M-Pesa STK push sent! Check your phone to complete payment.');
        setPayModal(null);
        setTimeout(load, 5000); // Reload after callback
      } else if (gateway === 'paypal' && res.data.gateway_data?.approval_url) {
        window.location.href = res.data.gateway_data.approval_url;
      } else if (gateway === 'stripe') {
        // In production: use Stripe.js with client_secret
        showToast('Stripe payment initiated. Complete payment in the Stripe widget.', 'info');
        setPayModal(null);
      }
    } catch (err) {
      showToast(err.response?.data?.detail || 'Payment failed. Please try again.', 'danger');
    } finally {
      setPaying(false);
    }
  };

  const pending = fines.filter(f => f.status === 'pending');
  const paid = fines.filter(f => f.status === 'paid');
  const waived = fines.filter(f => f.status === 'waived');

  const totalPending = pending.reduce((s, f) => s + Number(f.amount), 0);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      {toast && (
        <div className={`alert alert-${toast.type}`} style={{ position: 'fixed', top: 80, right: 24, zIndex: 300, minWidth: 320, boxShadow: 'var(--shadow-lg)' }}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">💳 My Fines</h1>
          <p className="page-subtitle">Manage and pay your library fines</p>
        </div>
        {totalPending > 0 && (
          <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: '10px 18px', color: 'var(--danger)', fontWeight: 700 }}>
            Total Pending: KES {totalPending.toLocaleString()}
          </div>
        )}
      </div>

      {pending.length === 0 && paid.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-title">No fines!</div>
          <div className="empty-desc">You have a clean slate. Return books on time to avoid fines.</div>
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <h3 className="card-title">⚠️ Pending Fines ({pending.length})</h3>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Book</th><th>Borrow Date</th><th>Return Date</th><th>Days Overdue</th><th>Amount</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {pending.map(f => (
                      <tr key={f.slug}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{f.borrowing?.book?.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ISBN: {f.borrowing?.book?.isbn}</div>
                        </td>
                        <td style={{ fontSize: 13 }}>{new Date(f.borrowing?.borrow_date).toLocaleDateString()}</td>
                        <td style={{ fontSize: 13 }}>{f.borrowing?.return_date ? new Date(f.borrowing.return_date).toLocaleDateString() : '—'}</td>
                        <td><span className="badge badge-danger">{f.borrowing?.days_overdue ?? '?'}d</span></td>
                        <td><span style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 16 }}>KES {Number(f.amount).toLocaleString()}</span></td>
                        <td>
                          <button className="btn btn-accent btn-sm" onClick={() => { setPayModal({ fine: f }); setGateway('mpesa'); setPhone(''); }}>
                            💳 Pay Now
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Paid / Waived */}
          {(paid.length > 0 || waived.length > 0) && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📋 Payment History</h3>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Book</th><th>Amount</th><th>Status</th><th>Method</th><th>Date</th></tr></thead>
                  <tbody>
                    {[...paid, ...waived].map(f => (
                      <tr key={f.slug}>
                        <td style={{ fontWeight: 500, fontSize: 13 }}>{f.borrowing?.book?.title}</td>
                        <td>KES {Number(f.amount).toLocaleString()}</td>
                        <td>
                          {f.status === 'paid'
                            ? <span className="badge badge-success">✅ Paid</span>
                            : <span className="badge badge-warning">🤝 Waived</span>}
                        </td>
                        <td style={{ textTransform: 'capitalize', fontSize: 13 }}>{f.payment_method || f.waive_reason || '—'}</td>
                        <td style={{ fontSize: 13 }}>{f.paid_at ? new Date(f.paid_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">💳 Pay Fine</h3>
              <button className="modal-close" onClick={() => setPayModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--bg)', padding: '14px 16px', borderRadius: 'var(--radius)', marginBottom: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{payModal.fine.borrowing?.book?.title}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--danger)' }}>
                  KES {Number(payModal.fine.amount).toLocaleString()}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Payment Method</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {GATEWAYS.map(g => (
                    <label key={g.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', border: `2px solid ${gateway === g.id ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)', cursor: 'pointer',
                      background: gateway === g.id ? 'rgba(200,146,42,0.05)' : 'white',
                      transition: 'var(--transition)',
                    }}>
                      <input type="radio" name="gateway" value={g.id} checked={gateway === g.id} onChange={() => setGateway(g.id)} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{g.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {gateway === 'mpesa' && (
                <div className="form-group">
                  <label className="form-label">M-Pesa Phone Number *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. 0712345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                  <div className="form-hint">You will receive an STK push on this number</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPayModal(null)}>Cancel</button>
              <button className="btn btn-accent" disabled={paying} onClick={handlePay}>
                {paying ? '⏳ Processing…' : `💳 Pay KES ${Number(payModal.fine.amount).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}