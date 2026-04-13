import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, searchFilter, generateId, exportToCSV } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { Plus, Search, Download, Edit2, Trash2, Eye } from 'lucide-react';

export default function Clients() {
  const { clients, trips, income, expenses, lookup, addItem, updateItem, deleteItem } = useApp();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});

  const clientStats = useMemo(() => clients.map(c => {
    const ct = trips.filter(t => t.client_id === c.id);
    const ci = income.filter(i => i.client_id === c.id);
    const totalRevenue = ci.reduce((s, i) => s + i.amount, 0);
    const totalPaid = ci.reduce((s, i) => s + i.amount_paid, 0);
    const outstanding = totalRevenue - totalPaid;
    const redeemable = expenses.filter(e => e.is_redeemable && e.trip_id && ct.some(t => t.id === e.trip_id)).reduce((s, e) => s + e.amount, 0);
    const rateTypeStr = c.rate_type === 'per_ton' ? 'Per Ton' : 'Per Trip';
    const rateDisplay = c.rate_amount ? `${formatCurrency(c.rate_amount)} ${rateTypeStr}` : '—';
    return { ...c, tripCount: ct.length, totalRevenue, totalPaid, outstanding, redeemable, profit: totalRevenue - redeemable, rateDisplay };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue), [clients, trips, income, expenses]);

  const filtered = useMemo(() => searchFilter(clientStats, search, ['company_name', 'contact_person', 'email']), [clientStats, search]);

  const openAdd = () => { setForm({ status: 'active', payment_terms_days: 30 }); setModal('add'); };
  const openEdit = (c) => { setForm({ ...c }); setModal('edit'); };
  const openView = (c) => { setSelected(c); setModal('view'); };
  const closeModal = () => { setModal(null); setSelected(null); setForm({}); };
  const save = () => { if (modal === 'add') addItem('clients', { ...form, id: generateId('c') }); else updateItem('clients', form); closeModal(); };

  return (
    <div>
      <div className="page-header"><h1>Clients</h1>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => exportToCSV(filtered, 'clients', [
            { label: 'Company', accessor: r => r.company_name }, { label: 'Contact', accessor: r => r.contact_person },
            { label: 'Revenue', accessor: r => r.totalRevenue }, { label: 'Outstanding', accessor: r => r.outstanding },
            { label: 'Trips', accessor: r => r.tripCount }, { label: 'Status', accessor: r => r.status },
          ])}><Download size={16}/> Export</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Add Client</button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar"><div className="table-toolbar-left"><div className="search-input"><Search size={15}/><input placeholder="Search clients..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div></div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>Company</th><th>Contact</th><th>Phone</th><th>Rate Card</th><th>Trips</th><th>Revenue</th><th>Outstanding</th><th>Redeemable</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map(c => (
              <tr key={c.id}>
                <td className="primary">{c.company_name}</td>
                <td>{c.contact_person}</td>
                <td>{c.phone}</td>
                <td>{c.rateDisplay}</td>
                <td className="numeric">{c.tripCount}</td>
                <td className="numeric positive">{formatCurrency(c.totalRevenue)}</td>
                <td className={`numeric ${c.outstanding>0?'negative':''}`}>{formatCurrency(c.outstanding)}</td>
                <td className="numeric" style={{color:'var(--color-purple)'}}>{formatCurrency(c.redeemable)}</td>
                <td><StatusBadge status={c.status}/></td>
                <td><div style={{display:'flex',gap:4}}>
                  <button className="btn-icon" onClick={()=>openView(c)}><Eye size={16}/></button>
                  <button className="btn-icon" onClick={()=>openEdit(c)}><Edit2 size={16}/></button>
                  <button className="btn-icon" onClick={()=>deleteItem('clients',c.id)}><Trash2 size={16}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} clients</span></div>
      </div>

      {modal === 'view' && selected && <Modal title={selected.company_name} onClose={closeModal}>
        <div className="detail-grid">
          <div><div className="detail-label">Contact Person</div><div className="detail-value">{selected.contact_person}</div></div>
          <div><div className="detail-label">Email</div><div className="detail-value">{selected.email}</div></div>
          <div><div className="detail-label">Phone</div><div className="detail-value">{selected.phone}</div></div>
          <div><div className="detail-label">Address</div><div className="detail-value">{selected.address}</div></div>
          <div><div className="detail-label">Payment Terms</div><div className="detail-value">{selected.payment_terms_days} days</div></div>
          <div><div className="detail-label">Contract</div><div className="detail-value">{selected.contract_type}</div></div>
          <div><div className="detail-label">Total Revenue</div><div className="detail-value" style={{color:'var(--color-success)',fontSize:20,fontWeight:700}}>{formatCurrency(selected.totalRevenue)}</div></div>
          <div><div className="detail-label">Outstanding</div><div className="detail-value" style={{color:'var(--color-danger)',fontSize:20,fontWeight:700}}>{formatCurrency(selected.outstanding)}</div></div>
          <div><div className="detail-label">Total Trips</div><div className="detail-value" style={{fontSize:20,fontWeight:700}}>{selected.tripCount}</div></div>
          <div><div className="detail-label">Redeemable Expenses</div><div className="detail-value" style={{color:'var(--color-purple)',fontSize:20,fontWeight:700}}>{formatCurrency(selected.redeemable)}</div></div>
          <div><div className="detail-label">Rate Type</div><div className="detail-value">{selected.rate_type === 'per_ton' ? 'Per Ton' : 'Per Trip'}</div></div>
          <div><div className="detail-label">Rate Amount</div><div className="detail-value">{formatCurrency(selected.rate_amount || 0)}</div></div>
        </div>
      </Modal>}

      {(modal === 'add' || modal === 'edit') && <Modal title={modal==='add'?'Add Client':'Edit Client'} onClose={closeModal}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Company Name</label><input className="form-input" value={form.company_name||''} onChange={e=>setForm({...form,company_name:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Contact Person</label><input className="form-input" value={form.contact_person||''} onChange={e=>setForm({...form,contact_person:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
          <div className="form-group full"><label className="form-label">Address</label><input className="form-input" value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Payment Terms (days)</label><input className="form-input" type="number" value={form.payment_terms_days||''} onChange={e=>setForm({...form,payment_terms_days:+e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Contract Type</label><select className="form-select" value={form.contract_type||''} onChange={e=>setForm({...form,contract_type:e.target.value})}><option value="Per Trip">Per Trip</option><option value="Monthly">Monthly</option><option value="Contract">Contract</option></select></div>
          <div className="form-group"><label className="form-label">Rate Type</label><select className="form-select" value={form.rate_type||'per_trip'} onChange={e=>setForm({...form,rate_type:e.target.value})}><option value="per_trip">Per Trip</option><option value="per_ton">Per Ton</option></select></div>
          <div className="form-group"><label className="form-label">Rate Amount</label><input className="form-input" type="number" value={form.rate_amount||''} onChange={e=>setForm({...form,rate_amount:+e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status||'active'} onChange={e=>setForm({...form,status:e.target.value})}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>
      </Modal>}
    </div>
  );
}
