import { useState, useEffect } from 'react';
import { booksAPI, categoriesAPI, authorsAPI, publishersAPI } from '../../services/api';

const EMPTY = { title:'',isbn:'',author_ids:[],category_id:null,publisher_id:null,description:'',publication_year:'',edition:'',language:'English',pages:'',total_copies:1,location:'',condition:'good',fine_per_day:'5.00' };

export default function LibrarianBooks() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg,type='success')=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  const load = (q='') => {
    setLoading(true);
    Promise.all([booksAPI.getAll({search:q}),categoriesAPI.getAll(),authorsAPI.getAll(),publishersAPI.getAll()])
      .then(([bR,cR,aR,pR])=>{ setBooks(bR.data.results||bR.data); setCategories(cR.data.results||cR.data); setAuthors(aR.data.results||aR.data); setPublishers(pR.data.results||pR.data); })
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  const openEdit = (book) => { setForm({...book,author_ids:book.authors?.map(a=>a.id)||[],category_id:book.category?.id||null,publisher_id:book.publisher?.id||null}); setModal('edit'); };
  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal==='add') await booksAPI.create(form); else await booksAPI.update(form.slug,form);
      showToast(`Book ${modal==='add'?'added':'updated'}!`); setModal(null); load();
    } catch (err) { showToast(err.response?.data?.detail||'Save failed.','danger'); }
    finally { setSaving(false); }
  };
  const deleteBook = async (slug) => {
    if (!confirm('Delete this book?')) return;
    await booksAPI.delete(slug); showToast('Book deleted.','warning'); load();
  };
  const set = (k,v)=>setForm(f=>({...f,[k]:v}));

  return (
    <div>
      {toast && <div className={`alert alert-${toast.type}`} style={{position:'fixed',top:80,right:24,zIndex:300,minWidth:300,boxShadow:'var(--shadow-lg)',display:'flex',alignItems:'center',gap:8}}><i className={`bi ${toast.type==='success'?'bi-check-circle-fill':'bi-exclamation-circle-fill'}`}/>{toast.msg}</div>}

      <div className="page-header">
        <div><h1 className="page-title"><i className="bi bi-journals" style={{marginRight:8}}/>Books Catalog</h1><p className="page-subtitle">Manage the library collection</p></div>
        <button className="btn btn-primary" onClick={()=>{setForm(EMPTY);setModal('add');}}>
          <i className="bi bi-plus-circle" style={{marginRight:6}}/>Add Book
        </button>
      </div>

      <div className="card card-body" style={{marginBottom:20,display:'flex',gap:12,padding:'14px 20px',alignItems:'center'}}>
        <div style={{position:'relative'}}>
          <i className="bi bi-search" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#a0aec0',fontSize:14}}/>
          <input className="form-control" style={{maxWidth:340,paddingLeft:32}} placeholder="Search title, ISBN, author..." value={search}
            onChange={e=>{setSearch(e.target.value);if(!e.target.value)load();}} onKeyDown={e=>e.key==='Enter'&&load(search)} />
        </div>
        <button className="btn btn-primary" onClick={()=>load(search)}>Search</button>
        {search && <button className="btn btn-ghost" onClick={()=>{setSearch('');load();}}>Clear</button>}
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? <div className="loading-center"><div className="spinner"/></div> : books.length===0 ? (
            <div className="empty-state"><div className="empty-icon"><i className="bi bi-journals"/></div><div className="empty-title">No books found</div></div>
          ) : (
            <table className="table">
              <thead><tr>
                <th><i className="bi bi-book-half" style={{marginRight:5}}/>Title</th>
                <th><i className="bi bi-upc" style={{marginRight:5}}/>ISBN</th>
                <th><i className="bi bi-person-lines-fill" style={{marginRight:5}}/>Authors</th>
                <th><i className="bi bi-grid-3x3-gap" style={{marginRight:5}}/>Category</th>
                <th><i className="bi bi-stack" style={{marginRight:5}}/>Copies</th>
                <th><i className="bi bi-check2-circle" style={{marginRight:5}}/>Available</th>
                <th><i className="bi bi-cash-coin" style={{marginRight:5}}/>Fine/Day</th>
                <th><i className="bi bi-gear" style={{marginRight:5}}/>Actions</th>
              </tr></thead>
              <tbody>
                {books.map(b=>(
                  <tr key={b.slug}>
                    <td><div style={{fontWeight:500,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.title}</div></td>
                    <td style={{fontSize:12,fontFamily:'monospace'}}>{b.isbn}</td>
                    <td style={{fontSize:13}}>{b.authors?.map(a=>a.name).join(', ')||'—'}</td>
                    <td>{b.category?.name ? <span className="badge badge-default">{b.category.name}</span>:'—'}</td>
                    <td style={{textAlign:'center'}}>{b.total_copies}</td>
                    <td style={{textAlign:'center'}}><span className={`badge ${b.available_copies>0?'badge-success':'badge-danger'}`}>{b.available_copies}</span></td>
                    <td style={{fontSize:13}}>KES {b.fine_per_day}</td>
                    <td>
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn btn-ghost btn-sm" title="Edit" onClick={()=>openEdit(b)}><i className="bi bi-pencil"/></button>
                        <button className="btn btn-danger btn-sm" title="Delete" onClick={()=>deleteBook(b.slug)}><i className="bi bi-trash"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:680}}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modal==='add' ? <><i className="bi bi-plus-circle" style={{marginRight:8}}/>Add New Book</> : <><i className="bi bi-pencil" style={{marginRight:8}}/>Edit Book</>}
              </h3>
              <button className="modal-close" onClick={()=>setModal(null)}><i className="bi bi-x-lg"/></button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Title *</label>
                  <input className="form-control" value={form.title} onChange={e=>set('title',e.target.value)} required />
                </div>
                <div className="form-group"><label className="form-label">ISBN *</label><input className="form-control" value={form.isbn} onChange={e=>set('isbn',e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Language</label><input className="form-control" value={form.language} onChange={e=>set('language',e.target.value)} /></div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label className="form-label">Authors</label>
                  <select multiple className="form-control" style={{height:90}} value={form.author_ids?.map(String)} onChange={e=>set('author_ids',Array.from(e.target.selectedOptions).map(o=>parseInt(o.value)))}>
                    {authors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control" value={form.category_id||''} onChange={e=>set('category_id',e.target.value||null)}>
                    <option value="">— None —</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Publisher</label>
                  <select className="form-control" value={form.publisher_id||''} onChange={e=>set('publisher_id',e.target.value||null)}>
                    <option value="">— None —</option>{publishers.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Publication Year</label><input className="form-control" type="number" value={form.publication_year} onChange={e=>set('publication_year',e.target.value)} placeholder="2023" /></div>
                <div className="form-group"><label className="form-label">Edition</label><input className="form-control" value={form.edition} onChange={e=>set('edition',e.target.value)} placeholder="3rd" /></div>
                <div className="form-group"><label className="form-label">Total Copies</label><input className="form-control" type="number" min="1" value={form.total_copies} onChange={e=>set('total_copies',parseInt(e.target.value))} /></div>
                <div className="form-group"><label className="form-label">Fine Per Day (KES)</label><input className="form-control" type="number" step="0.01" value={form.fine_per_day} onChange={e=>set('fine_per_day',e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Shelf Location</label><input className="form-control" value={form.location} onChange={e=>set('location',e.target.value)} placeholder="Shelf A3" /></div>
                <div className="form-group">
                  <label className="form-label">Condition</label>
                  <select className="form-control" value={form.condition} onChange={e=>set('condition',e.target.value)}>
                    {['new','good','fair','poor'].map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}><label className="form-label">Description</label><textarea className="form-control" rows={3} value={form.description} onChange={e=>set('description',e.target.value)} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{gap:8}}>
                  {saving ? <><i className="bi bi-arrow-repeat spin"/>Saving…</> : <><i className="bi bi-floppy"/>Save Book</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin .8s linear infinite}`}</style>
    </div>
  );
}