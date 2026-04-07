import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, searchFilter, generateId, exportToCSV } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { Plus, Search, Download, Edit2, Trash2 } from 'lucide-react';

const statusTabs = ['all', 'paid', 'partially_paid', 'unpaid'];

export default function Income() {
  const { income, trips, clients, lookup, addItem, updateItem, deleteItem } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const filtered = useMemo(() => {
    let data = statusFilter === 'all' ? income : income.filter(i => i.payment_status === statusFilter);
    return searchFilter(data, search, ['invoice_number', 'notes'])
      .sort((a, b) => new Date(b.due_date) - new Date(a.due_date));
  }, [income, search, statusFilter]);

  const totals = useMemo(() => ({
    total: income.reduce((s, i) => s + i.amount, 0),
    received: income.reduce((s, i) => s + i.amount_paid, 0),
    outstanding: income.reduce((s, i) => s + (i.amount - i.amount_paid), 0),
  }), [income]);

  const openAdd = () => { setForm({ payment_status: 'unpaid', amount: 0, amount_paid: 0 }); setModal('add'); };
  const openEdit = (item) => { setForm({ ...item }); setModal('edit'); };
  const closeModal = () => { setModal(null); setForm({}); };

  const save = () => {
    const data = { ...form, amount: +form.amount, amount_paid: +form.amount_paid };
    if (+data.amount_paid >= +data.amount) data.payment_status = 'paid';
    else if (+data.amount_paid > 0) data.payment_status = 'partially_paid';
    else data.payment_status = 'unpaid';
    if (modal === 'add') addItem('income', { ...data, id: generateId('i') });
    else updateItem('income', data);
    closeModal();
  };

  const handleExport = () => exportToCSV(filtered, 'income', [
    { label: 'Invoice', accessor: r => r.invoice_number }, { label: 'Client', accessor: r => lookup('clients', r.client_id)?.company_name },
    { label: 'Amount', accessor: r => r.amount }, { label: 'Paid', accessor: r => r.amount_paid },
    { label: 'Status', accessor: r => r.payment_status }, { label: 'Due Date', accessor: r => r.due_date },
  ]);

  return (
    <div>
      <div className="page-header">
        <h1>Income</h1>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handleExport}><Download size={16}/> Export</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Record Income</button>
        </div>
      </div>

      <div className="kpi-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:20}}>
        <div className="kpi-card" style={{'--kpi-color':'var(--color-info)','--kpi-bg':'var(--color-info-bg)'}}><div className="kpi-value">{formatCurrency(totals.total)}</div><div className="kpi-label">Total Invoiced</div></div>
        <div className="kpi-card" style={{'--kpi-color':'var(--color-success)','--kpi-bg':'var(--color-success-bg)'}}><div className="kpi-value">{formatCurrency(totals.received)}</div><div className="kpi-label">Total Received</div></div>
        <div className="kpi-card" style={{'--kpi-color':'var(--color-danger)','--kpi-bg':'var(--color-danger-bg)'}}><div className="kpi-value">{formatCurrency(totals.outstanding)}</div><div className="kpi-label">Outstanding</div></div>
      </div>

      <div className="tabs">
        {statusTabs.map(s => <button key={s} className={`tab${statusFilter===s?' active':''}`} onClick={() => setStatusFilter(s)}>
          {s === 'all' ? `All (${income.length})` : `${s.replace(/_/g,' ')} (${income.filter(i=>i.payment_status===s).length})`}
        </button>)}
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left"><div className="search-input"><Search size={15}/><input placeholder="Search invoices..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
          <div className="table-toolbar-right"><span style={{fontSize:12,color:'var(--text-muted)'}}>{filtered.length} records</span></div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>Invoice</th><th>Client</th><th>Trip</th><th>Amount</th><th>Paid</th><th>Outstanding</th><th>Status</th><th>Due Date</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={9} className="table-empty">No records found</td></tr> : filtered.map(i => {
                const trip = lookup('trips', i.trip_id);
                return (
                  <tr key={i.id}>
                    <td className="primary">{i.invoice_number}</td>
                    <td>{lookup('clients', i.client_id)?.company_name || '—'}</td>
                    <td>{trip ? `${trip.origin}→${trip.destination}` : '—'}</td>
                    <td className="numeric">{formatCurrency(i.amount)}</td>
                    <td className="numeric positive">{formatCurrency(i.amount_paid)}</td>
                    <td className="numeric negative">{formatCurrency(i.amount - i.amount_paid)}</td>
                    <td><StatusBadge status={i.payment_status}/></td>
                    <td>{formatDate(i.due_date)}</td>
                    <td><div style={{display:'flex',gap:4}}>
                      <button className="btn-icon" onClick={()=>openEdit(i)}><Edit2 size={16}/></button>
                      <button className="btn-icon" onClick={()=>deleteItem('income',i.id)}><Trash2 size={16}/></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} of {income.length} records</span></div>
      </div>

      {modal && <Modal title={modal==='add'?'Record Income':'Edit Income'} onClose={closeModal}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Invoice Number</label><input className="form-input" value={form.invoice_number||''} onChange={e=>setForm({...form,invoice_number:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Client</label>
            <select className="form-select" value={form.client_id||''} onChange={e=>setForm({...form,client_id:e.target.value})}>
              <option value="">Select</option>{clients.map(c=><option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Trip</label>
            <select className="form-select" value={form.trip_id||''} onChange={e=>setForm({...form,trip_id:e.target.value})}>
              <option value="">Select</option>{trips.map(t=><option key={t.id} value={t.id}>{t.origin}→{t.destination} ({formatDate(t.departure_date)})</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Amount</label><input className="form-input" type="number" value={form.amount||''} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Amount Paid</label><input className="form-input" type="number" value={form.amount_paid||''} onChange={e=>setForm({...form,amount_paid:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Due Date</label><input className="form-input" type="date" value={form.due_date||''} onChange={e=>setForm({...form,due_date:e.target.value})}/></div>
          <div className="form-group full"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
        </div>
      </Modal>}
    </div>
  );
}
