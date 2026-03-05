import { useState, useEffect } from 'react';
import { transactionsAPI } from '../../services/api';

const STATUS_BADGE = {
  success:  <span className="badge badge-success"><i className="bi bi-check-circle" style={{marginRight:4}}/>Success</span>,
  pending:  <span className="badge badge-warning"><i className="bi bi-hourglass-split" style={{marginRight:4}}/>Pending</span>,
  failed:   <span className="badge badge-danger"><i className="bi bi-x-circle" style={{marginRight:4}}/>Failed</span>,
  refunded: <span className="badge badge-info"><i className="bi bi-arrow-counterclockwise" style={{marginRight:4}}/>Refunded</span>,
};

const GATEWAY_STYLE = {
  mpesa:  { icon:'bi-phone',                cls:'badge-success', label:'M-Pesa' },
  paypal: { icon:'bi-paypal',               cls:'badge-info',    label:'PayPal' },
  stripe: { icon:'bi-credit-card-2-front',  cls:'badge-primary', label:'Stripe' },
};

export default function LibrarianTransactions() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [gateway, setGateway] = useState('');
  const [status, setStatus]   = useState('');

  const load = () => { setLoading(true); transactionsAPI.getAll({ gateway: gateway || undefined, status: status || undefined }).then(r => setItems(r.data.results || r.data)).finally(() => setLoading(false)); };
  useEffect(load, [gateway, status]);

  const total = items.filter(t => t.status === 'success').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><i className="bi bi-cash-coin" style={{ marginRight:8 }}/>Transactions</h1>
          <p className="page-subtitle">All payment transactions</p>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color:'var(--success)', display:'flex', alignItems:'center', gap:6 }}>
            <i className="bi bi-check-circle-fill" style={{ fontSize:18 }}/>KES {total.toLocaleString()}
          </div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>Total collected (filtered)</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <select className="form-control" style={{ width:170 }} value={gateway} onChange={e => setGateway(e.target.value)}>
          <option value="">All Gateways</option>
          <option value="mpesa">M-Pesa</option>
          <option value="paypal">PayPal</option>
          <option value="stripe">Stripe</option>
        </select>
        <select className="form-control" style={{ width:160 }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-center"><div className="spinner"/></div> : (
            <table className="table">
              <thead>
                <tr>
                  <th><i className="bi bi-hash" style={{marginRight:5}}/>Reference</th>
                  <th><i className="bi bi-person-fill" style={{marginRight:5}}/>Student</th>
                  <th><i className="bi bi-credit-card-2-front" style={{marginRight:5}}/>Gateway</th>
                  <th><i className="bi bi-cash-coin" style={{marginRight:5}}/>Amount</th>
                  <th><i className="bi bi-currency-exchange" style={{marginRight:5}}/>Currency</th>
                  <th><i className="bi bi-info-circle" style={{marginRight:5}}/>Status</th>
                  <th><i className="bi bi-calendar3" style={{marginRight:5}}/>Date</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
                      <i className="bi bi-receipt" style={{ fontSize:32, opacity:.3, display:'block', marginBottom:8 }}/>No transactions found
                    </td>
                  </tr>
                ) : items.map(t => {
                  const gw = GATEWAY_STYLE[t.gateway] || { icon:'bi-credit-card', cls:'badge-default', label: t.gateway };
                  return (
                    <tr key={t.slug}>
                      <td style={{ fontSize:11, fontFamily:'monospace', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {t.gateway_transaction_id || t.slug}
                      </td>
                      <td><div style={{ fontWeight:500, fontSize:13 }}>{t.user?.full_name}</div></td>
                      <td>
                        <span className={`badge ${gw.cls}`} style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
                          <i className={`bi ${gw.icon}`}/>{gw.label}
                        </span>
                      </td>
                      <td style={{ fontWeight:700 }}>{Number(t.amount).toLocaleString()}</td>
                      <td style={{ fontSize:12 }}>{t.currency}</td>
                      <td>{STATUS_BADGE[t.status]}</td>
                      <td style={{ fontSize:12 }}>{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}