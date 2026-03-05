import { useState, useEffect } from 'react';
import { borrowingsAPI } from '../../services/api';

const STATUS_BADGE = {
  borrowed: <span className="badge badge-info"><i className="bi bi-arrow-left-right" style={{marginRight:3}}/>Borrowed</span>,
  returned: <span className="badge badge-success"><i className="bi bi-check-circle" style={{marginRight:3}}/>Returned</span>,
  overdue:  <span className="badge badge-danger"><i className="bi bi-exclamation-triangle" style={{marginRight:3}}/>Overdue</span>,
  lost:     <span className="badge badge-default"><i className="bi bi-x-circle" style={{marginRight:3}}/>Lost</span>,
};

export default function Borrowings() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const load = ()=>{ setLoading(true); borrowingsAPI.getAll({status}).then(r=>setData(r.data.results||r.data)).finally(()=>setLoading(false)); };
  useEffect(load,[status]);
  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title"><i className="bi bi-arrow-left-right" style={{marginRight:8}}/>All Borrowings</h1><p className="page-subtitle">Track all book borrowings</p></div>
        <select className="form-control" style={{width:160}} value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">All Status</option><option value="borrowed">Borrowed</option><option value="returned">Returned</option><option value="overdue">Overdue</option><option value="lost">Lost</option>
        </select>
      </div>
      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-center"><div className="spinner"/></div> : (
            <table className="table">
              <thead><tr>
                <th><i className="bi bi-person-fill" style={{marginRight:5}}/>Student</th>
                <th><i className="bi bi-book-half" style={{marginRight:5}}/>Book</th>
                <th><i className="bi bi-person-badge" style={{marginRight:5}}/>Issued By</th>
                <th><i className="bi bi-calendar-plus" style={{marginRight:5}}/>Borrow Date</th>
                <th><i className="bi bi-calendar-check" style={{marginRight:5}}/>Due Date</th>
                <th><i className="bi bi-calendar2-check" style={{marginRight:5}}/>Return Date</th>
                <th><i className="bi bi-info-circle" style={{marginRight:5}}/>Status</th>
                <th><i className="bi bi-cash-coin" style={{marginRight:5}}/>Fine</th>
              </tr></thead>
              <tbody>
                {data.map(b=>(
                  <tr key={b.slug}>
                    <td><div style={{fontWeight:500,fontSize:13}}>{b.user?.full_name}</div></td>
                    <td style={{fontSize:13,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.book?.title}</td>
                    <td style={{fontSize:12,color:'var(--text-muted)'}}>{b.issued_by?.full_name}</td>
                    <td style={{fontSize:12}}>{new Date(b.borrow_date).toLocaleDateString()}</td>
                    <td style={{fontSize:12}}>{new Date(b.due_date).toLocaleDateString()}</td>
                    <td style={{fontSize:12}}>{b.return_date?new Date(b.return_date).toLocaleDateString():'—'}</td>
                    <td>{STATUS_BADGE[b.is_overdue?'overdue':b.status]||b.status}</td>
                    <td style={{fontSize:13,color:b.calculated_fine>0?'var(--danger)':'inherit',fontWeight:b.calculated_fine>0?700:400}}>
                      {b.calculated_fine>0 ? `KES ${Number(b.calculated_fine).toLocaleString()}` : '—'}
                    </td>
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