import { useState, useEffect } from 'react';
import { transactionsAPI } from '../../services/api';

export default function LibrarianTransactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gateway, setGateway] = useState('');
  const [status, setStatus] = useState('');

  const load = () => {
    setLoading(true);
    transactionsAPI.getAll({ gateway: gateway || undefined, status: status || undefined })
      .then(r => setItems(r.data.results || r.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [gateway, status]);

  const statusBadge = {
    success: <span className="badge badge-success">✅ Success</span>,
    pending: <span className="badge badge-warning">⏳ Pending</span>,
    failed: <span className="badge badge-danger">❌ Failed</span>,
    refunded: <span className="badge badge-info">↩️ Refunded</span>,
  };

  const total = items.filter(t => t.status === 'success').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">💳 Transactions</h1><p className="page-subtitle">All payment transactions</p></div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>
            KES {total.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total collected (filtered)</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select className="form-control" style={{ width: 160 }} value={gateway} onChange={e => setGateway(e.target.value)}>
          <option value="">All Gateways</option>
          <option value="mpesa">M-Pesa</option>
          <option value="paypal">PayPal</option>
          <option value="stripe">Stripe</option>
        </select>
        <select className="form-control" style={{ width: 160 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <table className="table">
              <thead>
                <tr><th>Reference</th><th>Student</th><th>Gateway</th><th>Amount</th><th>Currency</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No transactions found</td></tr>
                ) : items.map(t => (
                  <tr key={t.slug}>
                    <td style={{ fontSize: 11, fontFamily: 'monospace', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.gateway_transaction_id || t.slug}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{t.user?.full_name}</div>
                    </td>
                    <td>
                      <span className={`badge ${t.gateway === 'mpesa' ? 'badge-success' : t.gateway === 'paypal' ? 'badge-info' : 'badge-primary'}`} style={{ textTransform: 'capitalize' }}>
                        {t.gateway === 'mpesa' ? '📱' : t.gateway === 'paypal' ? '🅿️' : '💳'} {t.gateway}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{Number(t.amount).toLocaleString()}</td>
                    <td style={{ fontSize: 12 }}>{t.currency}</td>
                    <td>{statusBadge[t.status]}</td>
                    <td style={{ fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}