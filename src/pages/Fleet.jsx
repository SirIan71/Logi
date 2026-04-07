import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, formatNumber, searchFilter, generateId, daysUntil, exportToCSV } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { Plus, Search, Download, Edit2, Trash2, Eye, Wrench, AlertTriangle, Shield } from 'lucide-react';

export default function Fleet() {
  const { vehicles, maintenance, vehicleDocuments, trips, fuelRecords, lookup, addItem, updateItem, deleteItem } = useApp();
  const drivers = useApp().users.filter(u => u.role === 'driver');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('vehicles'); // vehicles | maintenance | documents
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [selected, setSelected] = useState(null);

  // Vehicle stats
  const vehicleStats = useMemo(() => vehicles.map(v => {
    const vTrips = trips.filter(t => t.vehicle_id === v.id);
    const vFuel = fuelRecords.filter(f => f.vehicle_id === v.id);
    const vMaint = maintenance.filter(m => m.vehicle_id === v.id);
    const nextService = vMaint.reduce((nearest, m) => {
      const d = daysUntil(m.next_due_date);
      return d < nearest.days ? { days: d, date: m.next_due_date, type: m.service_type } : nearest;
    }, { days: Infinity, date: null, type: null });
    const driver = lookup('users', v.assigned_driver_id);
    const totalFuelCost = vFuel.reduce((s, f) => s + f.cost, 0);
    const docs = vehicleDocuments.filter(d => d.vehicle_id === v.id);
    const expiringDocs = docs.filter(d => daysUntil(d.expiry_date) <= 60);
    return { ...v, tripCount: vTrips.length, totalFuelCost, driverName: driver?.name || 'Unassigned', nextService, expiringDocs };
  }), [vehicles, trips, fuelRecords, maintenance, vehicleDocuments, lookup]);

  const filteredVehicles = useMemo(() => searchFilter(vehicleStats, search, ['registration', 'make', 'model', 'driverName']), [vehicleStats, search]);
  const filteredMaint = useMemo(() => searchFilter(maintenance, search, ['service_type', 'description', 'vendor']).sort((a, b) => new Date(b.service_date) - new Date(a.service_date)), [maintenance, search]);

  const alerts = useMemo(() => {
    const list = [];
    vehicleStats.forEach(v => {
      if (v.nextService.days <= 0) list.push({ type: 'danger', text: `${v.registration} — ${v.nextService.type} OVERDUE (${Math.abs(v.nextService.days)} days)` });
      else if (v.nextService.days <= 30) list.push({ type: 'warning', text: `${v.registration} — ${v.nextService.type} due in ${v.nextService.days} days` });
      v.expiringDocs.forEach(d => {
        const days = daysUntil(d.expiry_date);
        list.push({ type: days <= 0 ? 'danger' : 'warning', text: `${v.registration} — ${d.doc_type} ${days <= 0 ? 'EXPIRED' : `expires in ${days} days`}` });
      });
    });
    return list;
  }, [vehicleStats]);

  const openAddVehicle = () => { setForm({ status: 'active', year: 2024 }); setModal('addVehicle'); };
  const openEditVehicle = (v) => { setForm({ ...v }); setModal('editVehicle'); };
  const openViewVehicle = (v) => { setSelected(v); setModal('viewVehicle'); };
  const openAddMaint = () => { setForm({ type: 'scheduled', service_date: new Date().toISOString().split('T')[0] }); setModal('addMaint'); };
  const closeModal = () => { setModal(null); setSelected(null); setForm({}); };

  const saveVehicle = () => {
    const data = { ...form, year: +form.year, capacity_tons: +form.capacity_tons, current_odometer: +form.current_odometer, tank_capacity_liters: +form.tank_capacity_liters };
    if (modal === 'addVehicle') addItem('vehicles', { ...data, id: generateId('v') });
    else updateItem('vehicles', data);
    closeModal();
  };

  const saveMaint = () => {
    const data = { ...form, cost: +form.cost, odometer_at_service: +form.odometer_at_service, next_due_km: +form.next_due_km };
    addItem('maintenance', { ...data, id: generateId('m') });
    closeModal();
  };

  return (
    <div>
      <div className="page-header"><h1>Fleet Management</h1>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={openAddMaint}><Wrench size={16}/> Log Service</button>
          <button className="btn btn-primary" onClick={openAddVehicle}><Plus size={16}/> Add Vehicle</button>
        </div>
      </div>

      {alerts.length > 0 && <div className="alerts-panel" style={{marginBottom:20}}>
        <div className="alerts-panel-title"><AlertTriangle size={16} style={{display:'inline',verticalAlign:'middle',marginRight:6}}/> Fleet Alerts ({alerts.length})</div>
        {alerts.slice(0,5).map((a, i) => <div key={i} className="alert-item"><div className={`alert-dot ${a.type}`}/><div className="alert-text">{a.text}</div></div>)}
        {alerts.length > 5 && <div style={{fontSize:12,color:'var(--text-muted)',paddingTop:8}}>+ {alerts.length - 5} more alerts</div>}
      </div>}

      <div className="tabs">
        <button className={`tab${tab==='vehicles'?' active':''}`} onClick={()=>setTab('vehicles')}>Vehicles ({vehicles.length})</button>
        <button className={`tab${tab==='maintenance'?' active':''}`} onClick={()=>setTab('maintenance')}>Maintenance ({maintenance.length})</button>
      </div>

      {tab === 'vehicles' && <div className="table-container">
        <div className="table-toolbar"><div className="table-toolbar-left"><div className="search-input"><Search size={15}/><input placeholder="Search vehicles..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div></div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>Registration</th><th>Vehicle</th><th>Year</th><th>Capacity</th><th>Odometer</th><th>Driver</th><th>Trips</th><th>Fuel Cost</th><th>Next Service</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{filteredVehicles.map(v => (
              <tr key={v.id}>
                <td className="primary">{v.registration}</td>
                <td>{v.make} {v.model}</td>
                <td>{v.year}</td>
                <td className="numeric">{v.capacity_tons}t</td>
                <td className="numeric">{formatNumber(v.current_odometer)} km</td>
                <td>{v.driverName}</td>
                <td className="numeric">{v.tripCount}</td>
                <td className="numeric">{formatCurrency(v.totalFuelCost)}</td>
                <td>{v.nextService.date ? <span style={{color: v.nextService.days <= 0 ? 'var(--color-danger)' : v.nextService.days <= 30 ? 'var(--color-warning)' : 'var(--text-secondary)', fontWeight: v.nextService.days <= 30 ? 600 : 400}}>{v.nextService.days <= 0 ? `Overdue ${Math.abs(v.nextService.days)}d` : `${v.nextService.days}d`}</span> : '—'}</td>
                <td><StatusBadge status={v.status}/></td>
                <td><div style={{display:'flex',gap:4}}>
                  <button className="btn-icon" onClick={()=>openViewVehicle(v)}><Eye size={16}/></button>
                  <button className="btn-icon" onClick={()=>openEditVehicle(v)}><Edit2 size={16}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>}

      {tab === 'maintenance' && <div className="table-container">
        <div className="table-toolbar"><div className="table-toolbar-left"><div className="search-input"><Search size={15}/><input placeholder="Search maintenance..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div></div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>Vehicle</th><th>Type</th><th>Service</th><th>Date</th><th>Cost</th><th>Odometer</th><th>Next Due</th><th>Vendor</th><th>Actions</th></tr></thead>
            <tbody>{filteredMaint.map(m => {
              const v = lookup('vehicles', m.vehicle_id);
              const days = daysUntil(m.next_due_date);
              return (
                <tr key={m.id}>
                  <td className="primary">{v?.registration||'—'}</td>
                  <td><StatusBadge status={m.type}/></td>
                  <td>{m.service_type}</td>
                  <td>{formatDate(m.service_date)}</td>
                  <td className="numeric">{formatCurrency(m.cost)}</td>
                  <td className="numeric">{formatNumber(m.odometer_at_service)} km</td>
                  <td><span style={{color: days <= 0 ? 'var(--color-danger)' : days <= 30 ? 'var(--color-warning)' : 'var(--text-secondary)', fontWeight: 600}}>{formatDate(m.next_due_date)} {days <= 0 ? '⚠️' : ''}</span></td>
                  <td>{m.vendor}</td>
                  <td><button className="btn-icon" onClick={()=>deleteItem('maintenance',m.id)}><Trash2 size={16}/></button></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>}

      {modal === 'viewVehicle' && selected && <Modal title={`${selected.registration} — ${selected.make} ${selected.model}`} onClose={closeModal}>
        <div className="detail-grid">
          <div><div className="detail-label">Registration</div><div className="detail-value">{selected.registration}</div></div>
          <div><div className="detail-label">Make / Model</div><div className="detail-value">{selected.make} {selected.model}</div></div>
          <div><div className="detail-label">Year</div><div className="detail-value">{selected.year}</div></div>
          <div><div className="detail-label">Capacity</div><div className="detail-value">{selected.capacity_tons} tons</div></div>
          <div><div className="detail-label">Odometer</div><div className="detail-value">{formatNumber(selected.current_odometer)} km</div></div>
          <div><div className="detail-label">Tank</div><div className="detail-value">{selected.tank_capacity_liters} L</div></div>
          <div><div className="detail-label">Driver</div><div className="detail-value">{selected.driverName}</div></div>
          <div><div className="detail-label">Status</div><div className="detail-value"><StatusBadge status={selected.status}/></div></div>
          <div><div className="detail-label">Total Trips</div><div className="detail-value" style={{fontSize:20,fontWeight:700}}>{selected.tripCount}</div></div>
          <div><div className="detail-label">Total Fuel Cost</div><div className="detail-value" style={{fontSize:20,fontWeight:700,color:'var(--color-warning)'}}>{formatCurrency(selected.totalFuelCost)}</div></div>
        </div>
      </Modal>}

      {(modal === 'addVehicle' || modal === 'editVehicle') && <Modal title={modal==='addVehicle'?'Add Vehicle':'Edit Vehicle'} onClose={closeModal}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={saveVehicle}>Save</button></>}>
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Registration</label><input className="form-input" value={form.registration||''} onChange={e=>setForm({...form,registration:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Make</label><input className="form-input" value={form.make||''} onChange={e=>setForm({...form,make:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Model</label><input className="form-input" value={form.model||''} onChange={e=>setForm({...form,model:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Year</label><input className="form-input" type="number" value={form.year||''} onChange={e=>setForm({...form,year:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Capacity (tons)</label><input className="form-input" type="number" value={form.capacity_tons||''} onChange={e=>setForm({...form,capacity_tons:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Odometer (km)</label><input className="form-input" type="number" value={form.current_odometer||''} onChange={e=>setForm({...form,current_odometer:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Tank (L)</label><input className="form-input" type="number" value={form.tank_capacity_liters||''} onChange={e=>setForm({...form,tank_capacity_liters:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Assigned Driver</label>
            <select className="form-select" value={form.assigned_driver_id||''} onChange={e=>setForm({...form,assigned_driver_id:e.target.value||null})}><option value="">Unassigned</option>{drivers.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status||'active'} onChange={e=>setForm({...form,status:e.target.value})}><option value="active">Active</option><option value="maintenance">In Maintenance</option><option value="decommissioned">Decommissioned</option></select></div>
        </div>
      </Modal>}

      {modal === 'addMaint' && <Modal title="Log Maintenance Service" onClose={closeModal}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={saveMaint}>Save</button></>}>
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Vehicle</label><select className="form-select" value={form.vehicle_id||''} onChange={e=>setForm({...form,vehicle_id:e.target.value})}><option value="">Select</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.registration}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.type||'scheduled'} onChange={e=>setForm({...form,type:e.target.value})}><option value="scheduled">Scheduled</option><option value="unscheduled">Unscheduled</option><option value="emergency">Emergency</option></select></div>
          <div className="form-group"><label className="form-label">Service Type</label><input className="form-input" value={form.service_type||''} onChange={e=>setForm({...form,service_type:e.target.value})} placeholder="e.g. Oil Service"/></div>
          <div className="form-group"><label className="form-label">Cost (R)</label><input className="form-input" type="number" value={form.cost||''} onChange={e=>setForm({...form,cost:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Service Date</label><input className="form-input" type="date" value={form.service_date||''} onChange={e=>setForm({...form,service_date:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Odometer at Service</label><input className="form-input" type="number" value={form.odometer_at_service||''} onChange={e=>setForm({...form,odometer_at_service:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Next Due (km)</label><input className="form-input" type="number" value={form.next_due_km||''} onChange={e=>setForm({...form,next_due_km:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Next Due Date</label><input className="form-input" type="date" value={form.next_due_date||''} onChange={e=>setForm({...form,next_due_date:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Vendor</label><input className="form-input" value={form.vendor||''} onChange={e=>setForm({...form,vendor:e.target.value})}/></div>
          <div className="form-group full"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})}/></div>
        </div>
      </Modal>}
    </div>
  );
}
