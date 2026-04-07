import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber, searchFilter, generateId, getTripProfitability, exportToCSV } from '../utils/helpers';
import Modal from '../components/common/Modal';
import { Plus, Search, Download, Edit2, Trash2, TrendingUp } from 'lucide-react';

export default function Routes() {
  const { routes, trips, income, expenses, lookup, addItem, updateItem, deleteItem } = useApp();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const routeStats = useMemo(() => routes.map(r => {
    const routeTrips = trips.filter(t => t.route_id === r.id);
    const completed = routeTrips.filter(t => t.status === 'completed');
    let totalIncome = 0, totalExpenses = 0;
    completed.forEach(t => { const p = getTripProfitability(t, income, expenses); totalIncome += p.income; totalExpenses += p.expenses; });
    return { ...r, tripCount: routeTrips.length, completedCount: completed.length, totalIncome, totalExpenses, profit: totalIncome - totalExpenses, avgProfit: completed.length > 0 ? (totalIncome - totalExpenses) / completed.length : 0 };
  }), [routes, trips, income, expenses]);

  const filtered = useMemo(() => searchFilter(routeStats, search, ['name', 'origin', 'destination']), [routeStats, search]);

  const openAdd = () => { setForm({}); setModal('add'); };
  const openEdit = (r) => { setForm({ ...r }); setModal('edit'); };
  const closeModal = () => { setModal(null); setForm({}); };
  const save = () => { const data = { ...form, distance_km: +form.distance_km || 0, estimated_fuel_liters: +form.estimated_fuel_liters || 0, estimated_tolls: +form.estimated_tolls || 0, estimated_duration_hours: +form.estimated_duration_hours || 0 }; if (modal === 'add') addItem('routes', { ...data, id: generateId('r') }); else updateItem('routes', data); closeModal(); };

  return (
    <div>
      <div className="page-header"><h1>Routes</h1>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => exportToCSV(filtered, 'routes', [
            { label: 'Name', accessor: r => r.name }, { label: 'Distance', accessor: r => r.distance_km },
            { label: 'Trips', accessor: r => r.tripCount }, { label: 'Profit', accessor: r => r.profit },
          ])}><Download size={16}/> Export</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Add Route</button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar"><div className="table-toolbar-left"><div className="search-input"><Search size={15}/><input placeholder="Search routes..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div></div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>Route</th><th>Distance</th><th>Est. Fuel</th><th>Est. Tolls</th><th>Duration</th><th>Trips</th><th>Total Profit</th><th>Avg Profit/Trip</th><th>Actions</th></tr></thead>
            <tbody>{filtered.map(r => (
              <tr key={r.id}>
                <td className="primary">{r.name}</td>
                <td className="numeric">{formatNumber(r.distance_km)} km</td>
                <td className="numeric">{formatNumber(r.estimated_fuel_liters)} L</td>
                <td className="numeric">{formatCurrency(r.estimated_tolls)}</td>
                <td>{r.estimated_duration_hours}h</td>
                <td className="numeric">{r.tripCount}</td>
                <td className={`numeric ${r.profit >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(r.profit)}</td>
                <td className={`numeric ${r.avgProfit >= 0 ? 'positive' : 'negative'}`}>{formatCurrency(r.avgProfit)}</td>
                <td><div style={{display:'flex',gap:4}}>
                  <button className="btn-icon" onClick={()=>openEdit(r)}><Edit2 size={16}/></button>
                  <button className="btn-icon" onClick={()=>deleteItem('routes',r.id)}><Trash2 size={16}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} routes</span></div>
      </div>

      {modal && <Modal title={modal==='add'?'Add Route':'Edit Route'} onClose={closeModal}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
        <div className="form-grid">
          <div className="form-group full"><label className="form-label">Route Name</label><input className="form-input" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. JHB → Durban" /></div>
          <div className="form-group"><label className="form-label">Origin</label><input className="form-input" value={form.origin||''} onChange={e=>setForm({...form,origin:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Destination</label><input className="form-input" value={form.destination||''} onChange={e=>setForm({...form,destination:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Distance (km)</label><input className="form-input" type="number" value={form.distance_km||''} onChange={e=>setForm({...form,distance_km:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Est. Fuel (L)</label><input className="form-input" type="number" value={form.estimated_fuel_liters||''} onChange={e=>setForm({...form,estimated_fuel_liters:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Est. Tolls (R)</label><input className="form-input" type="number" value={form.estimated_tolls||''} onChange={e=>setForm({...form,estimated_tolls:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Est. Duration (hrs)</label><input className="form-input" type="number" value={form.estimated_duration_hours||''} onChange={e=>setForm({...form,estimated_duration_hours:e.target.value})}/></div>
          <div className="form-group full"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
        </div>
      </Modal>}
    </div>
  );
}
