import { useState, useEffect } from 'react';
import { finesAPI } from '../../services/api';

const GATEWAYS = [
  { id: 'mpesa',  label: 'M-Pesa',       icon: 'bi-phone',                desc: 'Pay via Safaricom M-Pesa STK Push', currency: 'KES' },
  { id: 'paypal', label: 'PayPal',        icon: 'bi-paypal',               desc: 'Pay with PayPal account',           currency: 'USD' },
  { id: 'stripe', label: 'Card (Stripe)', icon: 'bi-credit-card-2-front',  desc: 'Visa / Mastercard / Amex',          currency: 'KES' },
];

const STATUS_BADGE = {
  paid:   <span className="badge badge-success"><i className="bi bi-check-circle"  style={{marginRight:4}}/>Paid</span>,
  waived: <span className="badge badge-warning"><i className="bi bi-shield-check"  style={{marginRight:4}}/>Waived</span>,
};

export default function StudentFines() {
  const [fines,    setFines]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [payModal, setPayModal] = useState(null);
  const [gateway,  setGateway]  = useState('mpesa');
  const [phone,    setPhone]    = useState('');
  const [paying,   setPaying]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };
  const load = () => { finesAPI.getAll().then(r => setFines(r.data.results || r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handlePay = async () => {
    if (gateway === 'mpesa' && !phone) { showToast('Please enter your M-Pesa phone number.', 'danger'); return; }
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
        showToast('M-Pesa STK push sent! Check your phone to complete payment.');
        setPayModal(null); setTimeout(load, 5000);
      } else if (gateway === 'paypal' && res.data.gateway_data?.approval_url) {
        window.location.href = res.data.gateway_data.approval_url;
      } else if (gateway === 'stripe') {
        showToast('Stripe payment initiated.', 'info'); setPayModal(null);
      }
    } catch (err) {
      showToast(err.response?.data?.detail || 'Payment failed. Please try again.', 'danger');
    } finally { setPaying(false); }
  };

  const pending      = fines.filter(f => f.status === 'pending');
  const paid         = fines.filter(f => f.status === 'paid');
  const waived       = fines.filter(f => f.status === 'waived');
  const totalPending = pending.reduce((s, f) => s + Number(f.amount), 0);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      {/* ── Toast ── */}
      {toast && (
        <div className={`alert alert-${toast.type}`} style={{ position: 'fixed', top: 80, right: 24, zIndex: 300, minWidth: 320, boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`} />
          {toast.msg}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title"><i className="bi bi-credit-card-2-front" style={{ marginRight: 8 }} />My Fines</h1>
          <p className="page-subtitle">Manage and pay your library fines</p>
        </div>
        {totalPending > 0 && (
          <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: '10px 18px', color: 'var(--danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bi bi-exclamation-triangle-fill" />Total Pending: KES {totalPending.toLocaleString()}
          </div>
        )}
      </div>

      {pending.length === 0 && paid.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="bi bi-check-circle" style={{ color: 'var(--success)' }} /></div>
          <div className="empty-title">No fines!</div>
          <div className="empty-desc">You have a clean slate. Return books on time to avoid fines.</div>
        </div>
      ) : (
        <>
          {/* ── Pending fines table ── */}
          {pending.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <h3 className="card-title">
                  <i className="bi bi-exclamation-triangle" style={{ marginRight: 8, color: 'var(--danger)' }} />
                  Pending Fines ({pending.length})
                </h3>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead><tr>
                    <th><i className="bi bi-book-half"      style={{marginRight:5}}/>Book</th>
                    <th><i className="bi bi-calendar-plus"  style={{marginRight:5}}/>Borrow Date</th>
                    <th><i className="bi bi-calendar2-check"style={{marginRight:5}}/>Return Date</th>
                    <th><i className="bi bi-clock-history"  style={{marginRight:5}}/>Days Overdue</th>
                    <th><i className="bi bi-cash-coin"      style={{marginRight:5}}/>Amount</th>
                    <th><i className="bi bi-credit-card"    style={{marginRight:5}}/>Action</th>
                  </tr></thead>
                  <tbody>
                    {pending.map(f => (
                      <tr key={f.slug}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{f.borrowing?.book?.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ISBN: {f.borrowing?.book?.isbn}</div>
                        </td>
                        <td style={{ fontSize: 13 }}>{new Date(f.borrowing?.borrow_date).toLocaleDateString()}</td>
                        <td style={{ fontSize: 13 }}>{f.borrowing?.return_date ? new Date(f.borrowing.return_date).toLocaleDateString() : '—'}</td>
                        <td>
                          <span className="badge badge-danger">
                            <i className="bi bi-clock-history" style={{ marginRight: 3 }} />{f.borrowing?.days_overdue ?? '?'}d
                          </span>
                        </td>
                        <td><span style={{ fontWeight: 700, color: 'var(--danger)', fontSize: 16 }}>KES {Number(f.amount).toLocaleString()}</span></td>
                        <td>
                          <button className="btn btn-accent btn-sm" style={{ gap: 5 }}
                            onClick={() => { setPayModal({ fine: f }); setGateway('mpesa'); setPhone(''); }}>
                            <i className="bi bi-credit-card" />Pay Now
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Payment history table ── */}
          {(paid.length > 0 || waived.length > 0) && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title"><i className="bi bi-receipt" style={{ marginRight: 8 }} />Payment History</h3>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead><tr>
                    <th><i className="bi bi-book-half"   style={{marginRight:5}}/>Book</th>
                    <th><i className="bi bi-cash-coin"   style={{marginRight:5}}/>Amount</th>
                    <th><i className="bi bi-info-circle" style={{marginRight:5}}/>Status</th>
                    <th><i className="bi bi-credit-card" style={{marginRight:5}}/>Method</th>
                    <th><i className="bi bi-calendar3"   style={{marginRight:5}}/>Date</th>
                  </tr></thead>
                  <tbody>
                    {[...paid, ...waived].map(f => (
                      <tr key={f.slug}>
                        <td style={{ fontWeight: 500, fontSize: 13 }}>{f.borrowing?.book?.title}</td>
                        <td>KES {Number(f.amount).toLocaleString()}</td>
                        <td>{STATUS_BADGE[f.status]}</td>
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

      {/* ── Payment modal ── */}
      {payModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title"><i className="bi bi-credit-card-2-front" style={{ marginRight: 8 }} />Pay Fine</h3>
              <button className="modal-close" onClick={() => setPayModal(null)}><i className="bi bi-x-lg" /></button>
            </div>

            <div className="modal-body">
              {/* Amount display */}
              <div style={{ background: 'var(--bg)', padding: '14px 16px', borderRadius: 'var(--radius)', marginBottom: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{payModal.fine.borrowing?.book?.title}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--danger)' }}>
                  KES {Number(payModal.fine.amount).toLocaleString()}
                </div>
              </div>

              {/* Gateway picker */}
              <div className="form-group">
                <label className="form-label"><i className="bi bi-credit-card-2-front" style={{ marginRight: 6 }} />Select Payment Method</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {GATEWAYS.map(g => (
                    <label key={g.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                      padding: '12px 16px', borderRadius: 'var(--radius)', transition: 'var(--transition)',
                      border: `2px solid ${gateway === g.id ? 'var(--accent)' : 'var(--border)'}`,
                      background: gateway === g.id ? 'rgba(200,146,42,.05)' : 'white',
                    }}>
                      <input type="radio" name="gateway" value={g.id} checked={gateway === g.id} onChange={() => setGateway(g.id)} />
                      <i className={`bi ${g.icon}`} style={{ fontSize: 20, color: gateway === g.id ? 'var(--accent)' : 'var(--text-muted)' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{g.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* M-Pesa phone input */}
              {gateway === 'mpesa' && (
                <div className="form-group">
                  <label className="form-label"><i className="bi bi-phone" style={{ marginRight: 6 }} />M-Pesa Phone Number *</label>
                  <div style={{ position: 'relative' }}>
                    <i className="bi bi-telephone" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', fontSize: 14, pointerEvents: 'none' }} />
                    <input className="form-control" style={{ paddingLeft: 32 }} placeholder="e.g. 0712345678" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div className="form-hint"><i className="bi bi-info-circle" style={{ marginRight: 4 }} />You will receive an STK push on this number</div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPayModal(null)}>Cancel</button>
              <button className="btn btn-accent" style={{ gap: 7 }} disabled={paying} onClick={handlePay}>
                {paying
                  ? <><i className="bi bi-arrow-repeat spin" />Processing…</>
                  : <><i className="bi bi-credit-card" />Pay KES {Number(payModal.fine.amount).toLocaleString()}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin .8s linear infinite}`}</style>
    </div>
  );
}