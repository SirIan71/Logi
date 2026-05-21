import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, searchFilter, generateId, exportToCSV, formatNumber } from '../utils/helpers';
import { getInvoiceableMonths, generateInvoices } from '../utils/invoiceGenerator';
import InvoicePreview, { printInvoice } from '../components/common/InvoiceTemplate';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { Plus, Search, Download, Edit2, Trash2, FileText, Printer, Zap, Eye } from 'lucide-react';

const statusTabs = ['all', 'paid', 'partially_paid', 'unpaid'];

export default function Income() {
  const { income, trips, clients, lookup, addItem, updateItem, deleteItem } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [generatedInvoices, setGeneratedInvoices] = useState([]);
  const [autoGenNotice, setAutoGenNotice] = useState(null);

  // ── Auto-generate invoices on mount (once per session) ──
  useEffect(() => {
    const sessionKey = 'sirian_invoice_gen_checked';
    const alreadyChecked = sessionStorage.getItem(sessionKey);
    if (alreadyChecked) return;
    sessionStorage.setItem(sessionKey, 'true');

    const invoiceable = getInvoiceableMonths(trips, income, clients);
    if (invoiceable.length > 0) {
      const newInvoices = generateInvoices(invoiceable, clients, income.length);
      if (newInvoices.length > 0) {
        setAutoGenNotice(newInvoices);
      }
    }
  }, [trips, income, clients]);

  // ── Accept auto-generated invoices ──
  const acceptAutoGen = async () => {
    if (!autoGenNotice) return;
    for (const inv of autoGenNotice) {
      await addItem('income', inv);
    }
    setAutoGenNotice(null);
  };

  const dismissAutoGen = () => setAutoGenNotice(null);

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

  // ── Manual generation check ──
  const invoiceable = useMemo(() =>
    getInvoiceableMonths(trips, income, clients),
    [trips, income, clients]
  );

  const handleGenerate = () => {
    const newInvoices = generateInvoices(invoiceable, clients, income.length);
    setGeneratedInvoices(newInvoices);
    setModal('generate');
  };

  const confirmGenerate = async () => {
    for (const inv of generatedInvoices) {
      await addItem('income', inv);
    }
    setGeneratedInvoices([]);
    setModal(null);
  };

  const openAdd = () => {
    setForm({
      payment_status: 'unpaid', amount: 0, amount_paid: 0,
      invoice_number: `INV-${new Date().getFullYear()}-${String(income.length + 1).padStart(3, '0')}`,
    });
    setModal('add');
  };
  const openEdit = (item) => { setForm({ ...item }); setModal('edit'); };
  const closeModal = () => { setModal(null); setForm({}); setPreviewInvoice(null); setGeneratedInvoices([]); };

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

  const handlePrint = (inv) => {
    const client = lookup('clients', inv.client_id);
    const tripDetails = inv.trip_details || trips.filter(t => t.client_id === inv.client_id && t.departure_date?.startsWith(inv.invoice_month));
    printInvoice(inv, client, tripDetails);
  };

  const handlePreview = (inv) => {
    setPreviewInvoice(inv);
    setModal('preview');
  };

  return (
    <div>
      <div className="page-header"><h1>Income</h1>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handleExport}><Download size={16}/> Export</button>
          {invoiceable.length > 0 && (
            <button className="btn btn-primary" onClick={handleGenerate} style={{
              background: 'linear-gradient(135deg, #003539, #084D53)',
              position: 'relative', overflow: 'hidden',
            }}>
              <Zap size={16}/> Generate Invoices
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#F59E0B', color: '#003539',
                width: 22, height: 22, borderRadius: '50%',
                fontSize: 11, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{invoiceable.length}</span>
            </button>
          )}
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Record Income</button>
        </div>
      </div>

      {/* Auto-generation notice */}
      {autoGenNotice && (
        <div style={{
          background: 'linear-gradient(135deg, #003539 0%, #084D53 100%)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 20,
          color: 'white', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', opacity: 0.08 }}>
            <FileText size={120} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(200, 230, 76, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={22} color="#C8E64C" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                {autoGenNotice.length} Invoice{autoGenNotice.length > 1 ? 's' : ''} Ready
              </h3>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
                All trips for the following period(s) are completed. Invoices have been auto-generated.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, position: 'relative', zIndex: 1 }}>
            {autoGenNotice.map((inv, idx) => (
              <div key={idx} style={{
                padding: '6px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.1)',
                fontSize: 12, fontWeight: 600,
              }}>
                {lookup('clients', inv.client_id)?.company_name || 'Client'} — {
                  new Date(inv.invoice_month + '-01').toLocaleDateString('en-UK', { month: 'short', year: 'numeric' })
                } — {formatCurrency(inv.amount)}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1 }}>
            <button onClick={acceptAutoGen} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: '#C8E64C', color: '#003539',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}>
              ✓ Accept & Save
            </button>
            <button onClick={dismissAutoGen} style={{
              padding: '8px 20px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.3)', background: 'transparent',
              color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

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
            <thead><tr><th>Invoice</th><th>Client</th><th>Period / Trip</th><th>Expected Amount</th><th>Paid</th><th>Outstanding</th><th>Status</th><th>Due Date</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={9} className="table-empty">No records found</td></tr> : filtered.map(i => {
                const trip = lookup('trips', i.trip_id);
                return (
                  <tr key={i.id}>
                    <td className="primary">{i.invoice_number}</td>
                    <td>{lookup('clients', i.client_id)?.company_name || '—'}</td>
                    <td>{i.invoice_month ? new Date(i.invoice_month + '-01').toLocaleDateString('en-ZA', {month: 'short', year: 'numeric'}) : (trip ? `${trip.origin}→${trip.destination}` : '—')}</td>
                    <td className="numeric">{formatCurrency(i.amount)}</td>
                    <td className="numeric positive">{formatCurrency(i.amount_paid)}</td>
                    <td className="numeric negative">{formatCurrency(i.amount - i.amount_paid)}</td>
                    <td><StatusBadge status={i.payment_status}/></td>
                    <td>{formatDate(i.due_date)}</td>
                    <td><div style={{display:'flex',gap:4}}>
                      <button className="btn-icon" title="Preview" onClick={()=>handlePreview(i)}><Eye size={16}/></button>
                      <button className="btn-icon" title="Print Invoice" onClick={()=>handlePrint(i)}><Printer size={16}/></button>
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

      {/* ── Record / Edit Modal ── */}
      {(modal === 'add' || modal === 'edit') && <Modal title={modal==='add'?'Record Income':'Edit Income'} onClose={closeModal}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Invoice Number</label><input className="form-input" value={form.invoice_number||''} onChange={e=>setForm({...form,invoice_number:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Client</label>
            <select className="form-select" value={form.client_id||''} onChange={e=>{
               const client_id = e.target.value;
               let amount = form.amount || 0;
               if (client_id && form.invoice_month) {
                 const c = clients.find(cl=>cl.id===client_id);
                 const clientTrips = trips.filter(t=>t.client_id===client_id && t.departure_date?.startsWith(form.invoice_month));
                 if(c?.rate_type==='per_ton') amount = clientTrips.reduce((s,t)=>s + (t.cargo_weight_tons||0),0) * (c.rate_amount||0);
                 else amount = clientTrips.length * (c.rate_amount||0);
               }
               setForm({...form, client_id, amount});
            }}>
              <option value="">Select</option>{clients.map(c=><option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Invoice Month</label>
            <input className="form-input" type="month" value={form.invoice_month||''} onChange={e=>{
               const invoice_month = e.target.value;
               let amount = form.amount || 0;
               if (form.client_id && invoice_month) {
                 const c = clients.find(cl=>cl.id===form.client_id);
                 const clientTrips = trips.filter(t=>t.client_id===form.client_id && t.departure_date?.startsWith(invoice_month));
                 if(c?.rate_type==='per_ton') amount = clientTrips.reduce((s,t)=>s + (t.cargo_weight_tons||0),0) * (c.rate_amount||0);
                 else amount = clientTrips.length * (c.rate_amount||0);
               }
               setForm({...form, invoice_month, amount});
            }}/>
          </div>
          <div className="form-group"><label className="form-label">Expected Amount</label><input className="form-input" type="number" value={form.amount||''} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Amount Paid</label><input className="form-input" type="number" value={form.amount_paid||''} onChange={e=>setForm({...form,amount_paid:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Due Date</label><input className="form-input" type="date" value={form.due_date||''} onChange={e=>setForm({...form,due_date:e.target.value})}/></div>
          <div className="form-group full"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
        </div>
      </Modal>}

      {/* ── Invoice Preview Modal ── */}
      {modal === 'preview' && previewInvoice && <Modal
        title={`Invoice ${previewInvoice.invoice_number}`}
        onClose={closeModal}
        footer={<>
          <button className="btn btn-secondary" onClick={closeModal}>Close</button>
          <button className="btn btn-primary" onClick={() => handlePrint(previewInvoice)}>
            <Printer size={16}/> Print / PDF
          </button>
        </>}
      >
        <InvoicePreview
          invoice={previewInvoice}
          client={lookup('clients', previewInvoice.client_id)}
          tripDetails={previewInvoice.trip_details || trips.filter(t =>
            t.client_id === previewInvoice.client_id && t.departure_date?.startsWith(previewInvoice.invoice_month)
          )}
        />
      </Modal>}

      {/* ── Generate Invoices Confirmation Modal ── */}
      {modal === 'generate' && <Modal
        title="Generate Invoices"
        onClose={closeModal}
        footer={<>
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
          <button className="btn btn-primary" onClick={confirmGenerate}>
            <FileText size={16}/> Generate {generatedInvoices.length} Invoice{generatedInvoices.length > 1 ? 's' : ''}
          </button>
        </>}
      >
        <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: 'var(--color-info-bg)', color: 'var(--color-info)', fontSize: 12 }}>
          <strong>ℹ️ Auto-Generation:</strong> The following invoices will be created for completed months where all trips are finished. Amounts are calculated based on each client's rate.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {generatedInvoices.map((inv, idx) => {
            const client = lookup('clients', inv.client_id);
            return (
              <div key={idx} style={{
                padding: 16, borderRadius: 12,
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{inv.invoice_number}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                      {new Date(inv.invoice_month + '-01').toLocaleDateString('en-UK', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#003539' }}>{formatCurrency(inv.amount)}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong>{client?.company_name || '—'}</strong> — {inv.trip_details?.length || 0} trip(s)
                  {client?.rate_type === 'per_ton' ? ` • ${formatNumber(inv.trip_details?.reduce((s,t) => s + (t.cargo_weight_tons||0), 0) || 0)} tons @ KES ${formatNumber(client?.rate_amount)}/ton` : ` @ KES ${formatNumber(client?.rate_amount || 0)}/trip`}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Due: {formatDate(inv.due_date)}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>}
    </div>
  );
}
