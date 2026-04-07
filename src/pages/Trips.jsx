import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, searchFilter, generateId, getTripProfitability, exportToCSV } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { Plus, Search, Download, Eye, Edit2, Trash2 } from 'lucide-react';

const statuses = ['all', 'scheduled', 'in_progress', 'completed', 'delayed', 'cancelled'];

export default function Trips() {
  const { trips, routes, vehicles, clients, income, expenses, lookup, addItem, updateItem, deleteItem } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'view' | null
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});

  const drivers = useApp().users.filter(u => u.role === 'driver');

  const filtered = useMemo(() => {
    let data = statusFilter === 'all' ? trips : trips.filter(t => t.status === statusFilter);
    return searchFilter(data, search, ['origin', 'destination', 'cargo_type', 'status'])
      .sort((a, b) => new Date(b.departure_date) - new Date(a.departure_date));
  }, [trips, search, statusFilter]);

  const openAdd = () => { setForm({ status: 'scheduled', departure_date: new Date().toISOString().split('T')[0] }); setModal('add'); };
  const openEdit = (t) => { setForm({ ...t }); setSelected(t); setModal('edit'); };
  const openView = (t) => { setSelected(t); setModal('view'); };
  const closeModal = () => { setModal(null); setSelected(null); setForm({}); };

  const saveTrip = () => {
    if (modal === 'add') {
      addItem('trips', { ...form, id: generateId('t') });
    } else {
      updateItem('trips', form);
    }
    closeModal();
  };

  const handleDelete = (id) => { if (confirm('Delete this trip?')) deleteItem('trips', id); };

  const handleExport = () => exportToCSV(filtered, 'trips', [
    { label: 'Origin', accessor: r => r.origin }, { label: 'Destination', accessor: r => r.destination },
    { label: 'Client', accessor: r => lookup('clients', r.client_id)?.company_name },
    { label: 'Vehicle', accessor: r => lookup('vehicles', r.vehicle_id)?.registration },
    { label: 'Status', accessor: r => r.status }, { label: 'Departure', accessor: r => r.departure_date },
  ]);

  const formFields = (
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Route</label>
        <select className="form-select" value={form.route_id||''} onChange={e => { const r = lookup('routes', e.target.value); setForm({...form, route_id: e.target.value, origin: r?.origin||form.origin, destination: r?.destination||form.destination, estimated_distance_km: r?.distance_km||form.estimated_distance_km}); }}>
          <option value="">Select route</option>{routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <div className="form-group"><label className="form-label">Client</label>
        <select className="form-select" value={form.client_id||''} onChange={e => setForm({...form, client_id: e.target.value})}>
          <option value="">Select client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
        </select>
      </div>
      <div className="form-group"><label className="form-label">Origin</label><input className="form-input" value={form.origin||''} onChange={e => setForm({...form, origin: e.target.value})} /></div>
      <div className="form-group"><label className="form-label">Destination</label><input className="form-input" value={form.destination||''} onChange={e => setForm({...form, destination: e.target.value})} /></div>
      <div className="form-group"><label className="form-label">Vehicle</label>
        <select className="form-select" value={form.vehicle_id||''} onChange={e => setForm({...form, vehicle_id: e.target.value})}>
          <option value="">Select vehicle</option>{vehicles.filter(v=>v.status==='active').map(v => <option key={v.id} value={v.id}>{v.registration} — {v.make} {v.model}</option>)}
        </select>
      </div>
      <div className="form-group"><label className="form-label">Driver</label>
        <select className="form-select" value={form.driver_id||''} onChange={e => setForm({...form, driver_id: e.target.value})}>
          <option value="">Select driver</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className="form-group"><label className="form-label">Cargo Type</label><input className="form-input" value={form.cargo_type||''} onChange={e => setForm({...form, cargo_type: e.target.value})} /></div>
      <div className="form-group"><label className="form-label">Cargo Weight (tons)</label><input className="form-input" type="number" value={form.cargo_weight_tons||''} onChange={e => setForm({...form, cargo_weight_tons: +e.target.value})} /></div>
      <div className="form-group"><label className="form-label">Departure Date</label><input className="form-input" type="date" value={form.departure_date||''} onChange={e => setForm({...form, departure_date: e.target.value})} /></div>
      <div className="form-group"><label className="form-label">Status</label>
        <select className="form-select" value={form.status||'scheduled'} onChange={e => setForm({...form, status: e.target.value})}>
          {statuses.filter(s=>s!=='all').map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>
      <div className="form-group full"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes||''} onChange={e => setForm({...form, notes: e.target.value})} /></div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Trips</h1>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handleExport}><Download size={16}/> Export</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> New Trip</button>
        </div>
      </div>

      <div className="tabs">
        {statuses.map(s => (
          <button key={s} className={`tab${statusFilter===s?' active':''}`} onClick={() => setStatusFilter(s)}>
            {s === 'all' ? `All (${trips.length})` : `${s.replace(/_/g,' ')} (${trips.filter(t=>t.status===s).length})`}
          </button>
        ))}
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-input"><Search size={15}/><input placeholder="Search trips..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
          <div className="table-toolbar-right"><span style={{fontSize:12,color:'var(--text-muted)'}}>{filtered.length} trips</span></div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr>
              <th>Route</th><th>Client</th><th>Vehicle</th><th>Driver</th><th>Cargo</th><th>Departure</th><th>Status</th><th>Profit</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={9} className="table-empty">No trips found</td></tr> : filtered.map(t => {
                const prof = getTripProfitability(t, income, expenses);
                return (
                  <tr key={t.id}>
                    <td className="primary">{t.origin} → {t.destination}</td>
                    <td>{lookup('clients', t.client_id)?.company_name || '—'}</td>
                    <td>{lookup('vehicles', t.vehicle_id)?.registration || '—'}</td>
                    <td>{lookup('users', t.driver_id)?.name || '—'}</td>
                    <td>{t.cargo_type}</td>
                    <td>{formatDate(t.departure_date)}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className={`numeric ${prof.profit >= 0 ? 'positive' : 'negative'}`}>{prof.income > 0 ? formatCurrency(prof.profit) : '—'}</td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="btn-icon" onClick={() => openView(t)} title="View"><Eye size={16}/></button>
                        <button className="btn-icon" onClick={() => openEdit(t)} title="Edit"><Edit2 size={16}/></button>
                        <button className="btn-icon" onClick={() => handleDelete(t.id)} title="Delete"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} of {trips.length} trips</span></div>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'New Trip' : 'Edit Trip'} onClose={closeModal}
          footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={saveTrip}>Save Trip</button></>}>
          {formFields}
        </Modal>
      )}

      {modal === 'view' && selected && (
        <Modal title="Trip Details" onClose={closeModal}>
          {(() => { const prof = getTripProfitability(selected, income, expenses); return (
            <div className="detail-grid">
              <div><div className="detail-label">Route</div><div className="detail-value">{selected.origin} → {selected.destination}</div></div>
              <div><div className="detail-label">Status</div><div className="detail-value"><StatusBadge status={selected.status}/></div></div>
              <div><div className="detail-label">Client</div><div className="detail-value">{lookup('clients', selected.client_id)?.company_name}</div></div>
              <div><div className="detail-label">Vehicle</div><div className="detail-value">{lookup('vehicles', selected.vehicle_id)?.registration}</div></div>
              <div><div className="detail-label">Driver</div><div className="detail-value">{lookup('users', selected.driver_id)?.name}</div></div>
              <div><div className="detail-label">Cargo</div><div className="detail-value">{selected.cargo_type} — {selected.cargo_weight_tons}t</div></div>
              <div><div className="detail-label">Departure</div><div className="detail-value">{formatDate(selected.departure_date)}</div></div>
              <div><div className="detail-label">Arrival</div><div className="detail-value">{formatDate(selected.arrival_date)}</div></div>
              <div><div className="detail-label">Distance</div><div className="detail-value">{selected.actual_distance_km || selected.estimated_distance_km} km</div></div>
              <div><div className="detail-label">Income</div><div className="detail-value" style={{color:'var(--color-success)'}}>{formatCurrency(prof.income)}</div></div>
              <div><div className="detail-label">Expenses</div><div className="detail-value" style={{color:'var(--color-danger)'}}>{formatCurrency(prof.expenses)}</div></div>
              <div><div className="detail-label">Profit</div><div className="detail-value" style={{color: prof.profit>=0?'var(--color-success)':'var(--color-danger)', fontWeight:700, fontSize:18}}>{formatCurrency(prof.profit)}</div></div>
            </div>
          ); })()}
        </Modal>
      )}
    </div>
  );
}
