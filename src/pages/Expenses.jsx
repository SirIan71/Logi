import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, searchFilter, generateId, exportToCSV } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { Plus, Search, Download, Edit2, Trash2 } from 'lucide-react';

export default function Expenses() {
  const { expenses, expenseCategories, trips, vehicles, lookup, addItem, updateItem, deleteItem } = useApp();
  const drivers = useApp().users.filter(u => u.role === 'driver');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [redeemFilter, setRedeemFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const filtered = useMemo(() => {
    let data = expenses;
    if (catFilter !== 'all') data = data.filter(e => e.category_id === catFilter);
    if (redeemFilter === 'redeemable') data = data.filter(e => e.is_redeemable);
    if (redeemFilter === 'non-redeemable') data = data.filter(e => !e.is_redeemable);
    return searchFilter(data, search, ['notes'])
      .sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
  }, [expenses, search, catFilter, redeemFilter]);

  const totals = useMemo(() => ({
    total: expenses.reduce((s, e) => s + e.amount, 0),
    redeemable: expenses.filter(e => e.is_redeemable).reduce((s, e) => s + e.amount, 0),
    redeemed: expenses.filter(e => e.is_redeemed).reduce((s, e) => s + e.amount, 0),
    pending: expenses.filter(e => e.approval_status === 'pending').reduce((s, e) => s + e.amount, 0),
  }), [expenses]);

  const openAdd = () => { setForm({ approval_status: 'pending', is_redeemable: false, is_redeemed: false, expense_date: new Date().toISOString().split('T')[0] }); setModal('add'); };
  const openEdit = (e) => { setForm({ ...e }); setModal('edit'); };
  const closeModal = () => { setModal(null); setForm({}); };

  const save = () => {
    const data = { ...form, amount: +form.amount };
    if (modal === 'add') addItem('expenses', { ...data, id: generateId('e') });
    else updateItem('expenses', data);
    closeModal();
  };

  const handleExport = () => exportToCSV(filtered, 'expenses', [
    { label: 'Date', accessor: r => r.expense_date },
    { label: 'Category', accessor: r => lookup('expenseCategories', r.category_id)?.name },
    { label: 'Amount', accessor: r => r.amount },
    { label: 'Vehicle', accessor: r => lookup('vehicles', r.vehicle_id)?.registration },
    { label: 'Redeemable', accessor: r => r.is_redeemable ? 'Yes' : 'No' },
    { label: 'Status', accessor: r => r.approval_status },
    { label: 'Notes', accessor: r => r.notes },
  ]);

  return (
    <div>
      <div className="page-header">
        <h1>Expenses</h1>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handleExport}><Download size={16}/> Export</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Add Expense</button>
        </div>
      </div>

      <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
        <div className="kpi-card" style={{'--kpi-color':'var(--color-danger)','--kpi-bg':'var(--color-danger-bg)'}}><div className="kpi-value">{formatCurrency(totals.total)}</div><div className="kpi-label">Total Expenses</div></div>
        <div className="kpi-card" style={{'--kpi-color':'var(--color-purple)','--kpi-bg':'var(--color-purple-bg)'}}><div className="kpi-value">{formatCurrency(totals.redeemable)}</div><div className="kpi-label">Redeemable</div></div>
        <div className="kpi-card" style={{'--kpi-color':'var(--color-success)','--kpi-bg':'var(--color-success-bg)'}}><div className="kpi-value">{formatCurrency(totals.redeemed)}</div><div className="kpi-label">Redeemed</div></div>
        <div className="kpi-card" style={{'--kpi-color':'var(--color-warning)','--kpi-bg':'var(--color-warning-bg)'}}><div className="kpi-value">{formatCurrency(totals.pending)}</div><div className="kpi-label">Pending Approval</div></div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-input"><Search size={15}/><input placeholder="Search expenses..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <select className="filter-select" value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {expenseCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="filter-select" value={redeemFilter} onChange={e=>setRedeemFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="redeemable">Redeemable Only</option>
              <option value="non-redeemable">Non-Redeemable</option>
            </select>
          </div>
          <span style={{fontSize:12,color:'var(--text-muted)'}}>{filtered.length} expenses</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Vehicle</th><th>Trip</th><th>Redeemable</th><th>Approval</th><th>Notes</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={9} className="table-empty">No expenses found</td></tr> :
              filtered.map(e => {
                const cat = lookup('expenseCategories', e.category_id);
                const trip = lookup('trips', e.trip_id);
                return (
                  <tr key={e.id}>
                    <td>{formatDate(e.expense_date)}</td>
                    <td className="primary">{cat?.name||'—'}</td>
                    <td className="numeric">{formatCurrency(e.amount)}</td>
                    <td>{lookup('vehicles', e.vehicle_id)?.registration||'—'}</td>
                    <td>{trip?`${trip.origin}→${trip.destination}`:'—'}</td>
                    <td>{e.is_redeemable ? <span style={{color:'var(--color-purple)',fontWeight:600}}>Yes{e.is_redeemed?' ✓':''}</span> : '—'}</td>
                    <td><StatusBadge status={e.approval_status}/></td>
                    <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{e.notes}</td>
                    <td><div style={{display:'flex',gap:4}}>
                      <button className="btn-icon" onClick={()=>openEdit(e)}><Edit2 size={16}/></button>
                      <button className="btn-icon" onClick={()=>deleteItem('expenses',e.id)}><Trash2 size={16}/></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} of {expenses.length} expenses</span></div>
      </div>

      {modal && <Modal title={modal==='add'?'Add Expense':'Edit Expense'} onClose={closeModal}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Category</label>
            <select className="form-select" value={form.category_id||''} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Select</option>
              {expenseCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Amount</label><input className="form-input" type="number" value={form.amount||''} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Vehicle</label>
            <select className="form-select" value={form.vehicle_id||''} onChange={e=>setForm({...form,vehicle_id:e.target.value})}><option value="">Select</option>
              {vehicles.map(v=><option key={v.id} value={v.id}>{v.registration}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Trip</label>
            <select className="form-select" value={form.trip_id||''} onChange={e=>setForm({...form,trip_id:e.target.value})}><option value="">None</option>
              {trips.map(t=><option key={t.id} value={t.id}>{t.origin}→{t.destination}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Driver</label>
            <select className="form-select" value={form.driver_id||''} onChange={e=>setForm({...form,driver_id:e.target.value})}><option value="">Select</option>
              {drivers.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.expense_date||''} onChange={e=>setForm({...form,expense_date:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Approval</label>
            <select className="form-select" value={form.approval_status||'pending'} onChange={e=>setForm({...form,approval_status:e.target.value})}>
              <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="form-group" style={{display:'flex',flexDirection:'column',gap:10,justifyContent:'flex-end'}}>
            <div className="form-checkbox-row"><input type="checkbox" className="form-checkbox" checked={form.is_redeemable||false} onChange={e=>setForm({...form,is_redeemable:e.target.checked})}/><label className="form-label" style={{margin:0}}>Redeemable</label></div>
            {form.is_redeemable && <div className="form-checkbox-row"><input type="checkbox" className="form-checkbox" checked={form.is_redeemed||false} onChange={e=>setForm({...form,is_redeemed:e.target.checked})}/><label className="form-label" style={{margin:0}}>Redeemed</label></div>}
          </div>
          <div className="form-group full"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
        </div>
      </Modal>}
    </div>
  );
}
