import { useState, useEffect } from 'react';
import { transactionsAPI } from '../../services/api';

export default function StudentTransactions() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { transactionsAPI.getAll().then(r => setTxns(r.data.results || r.data)).finally(() => setLoading(false)); }, []);
  const statusBadge = { success: <span className="badge badge-success">✅ Success</span>, pending: <span className="badge badge-warning">⏳ Pending</span>, failed: <span className="badge badge-danger">❌ Failed</span>, refunded: <span className="badge badge-info">↩️ Refunded</span> };
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">📋 My Transactions</h1><p className="page-subtitle">Payment history for fines</p></div></div>
      <div className="card">
        <div className="table-container">
          {txns.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💳</div><div className="empty-title">No transactions yet</div></div>
          ) : (
            <table className="table">
              <thead><tr><th>Transaction ID</th><th>Gateway</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {txns.map(t => (
                  <tr key={t.slug}>
                    <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{t.gateway_transaction_id || t.slug}</td>
                    <td style={{ textTransform: 'capitalize' }}>{t.gateway}</td>
                    <td style={{ fontWeight: 600 }}>{t.currency} {Number(t.amount).toLocaleString()}</td>
                    <td>{statusBadge[t.status]}</td>
                    <td style={{ fontSize: 13 }}>{new Date(t.created_at).toLocaleDateString()}</td>
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