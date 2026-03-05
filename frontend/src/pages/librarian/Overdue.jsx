import { useState, useEffect } from 'react';
import { borrowingsAPI } from '../../services/api';

export default function Overdue() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ borrowingsAPI.getOverdue().then(r=>setData(r.data)).finally(()=>setLoading(false)); },[]);
  if (loading) return <div className="loading-center"><div className="spinner"/></div>;
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><i className="bi bi-exclamation-triangle" style={{marginRight:8,color:'var(--danger)'}}/>Overdue Books</h1>
          <p className="page-subtitle">{data.length} book{data.length!==1?'s':''} overdue</p>
        </div>
      </div>
      <div className="card">
        <div className="table-container">
          {data.length===0 ? (
            <div className="empty-state">
              <div className="empty-icon"><i className="bi bi-check-circle" style={{color:'var(--success)'}}/></div>
              <div className="empty-title">No overdue books!</div>
            </div>
          ) : (
            <table className="table">
              <thead><tr>
                <th><i className="bi bi-person-fill" style={{marginRight:5}}/>Student</th>
                <th><i className="bi bi-book-half" style={{marginRight:5}}/>Book</th>
                <th><i className="bi bi-calendar-plus" style={{marginRight:5}}/>Borrowed</th>
                <th><i className="bi bi-calendar-x" style={{marginRight:5}}/>Due Date</th>
                <th><i className="bi bi-clock-history" style={{marginRight:5}}/>Days Overdue</th>
                <th><i className="bi bi-cash-coin" style={{marginRight:5}}/>Est. Fine</th>
              </tr></thead>
              <tbody>
                {data.map(b=>(
                  <tr key={b.slug}>
                    <td><div style={{fontWeight:500}}>{b.user?.full_name}</div><div style={{fontSize:12,color:'var(--text-muted)'}}>{b.user?.email}</div></td>
                    <td style={{fontSize:13}}>{b.book?.title}</td>
                    <td style={{fontSize:13}}>{new Date(b.borrow_date).toLocaleDateString()}</td>
                    <td style={{fontSize:13,color:'var(--danger)',fontWeight:600}}>{new Date(b.due_date).toLocaleDateString()}</td>
                    <td><span className="badge badge-danger"><i className="bi bi-clock-history" style={{marginRight:3}}/>{b.days_overdue} days</span></td>
                    <td style={{fontWeight:700,color:'var(--danger)'}}>KES {Number(b.calculated_fine).toLocaleString()}</td>
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