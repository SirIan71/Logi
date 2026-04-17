import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { searchFilter, generateId, exportToCSV } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { Plus, Search, Download, Edit2, Trash2, Eye } from 'lucide-react';

export default function Drivers() {
  const { users, trips, vehicles, lookup, addItem, updateItem, deleteItem } = useApp();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});

  const driversStats = useMemo(() => {
    const drivers = users.filter(u => u.role === 'driver');
    return drivers.map(d => {
      const dbTrips = trips.filter(t => t.driver_id === d.id);
      const vehicle = vehicles.find(v => v.assigned_driver_id === d.id);
      return { ...d, tripCount: dbTrips.length, assignedVehicle: vehicle ? vehicle.registration : 'None' };
    }).sort((a, b) => b.tripCount - a.tripCount);
  }, [users, trips, vehicles]);

  const filtered = useMemo(() => searchFilter(driversStats, search, ['name', 'email', 'phone', 'assignedVehicle']), [driversStats, search]);

  const openAdd = () => { setForm({ role: 'driver', is_active: true, assigned_vehicle_id: '' }); setModal('add'); };
  const openEdit = (d) => { const v = vehicles.find(veh => veh.assigned_driver_id === d.id); setForm({ ...d, assigned_vehicle_id: v ? v.id : '' }); setModal('edit'); };
  const openView = (d) => { setSelected(d); setModal('view'); };
  const closeModal = () => { setModal(null); setSelected(null); setForm({}); };
  const save = () => {
    const driverId = modal === 'add' ? generateId('d') : form.id;
    const { assigned_vehicle_id, ...driverObj } = form;
    if (modal === 'add') addItem('users', { ...driverObj, id: driverId }); else updateItem('users', driverObj);
    
    // Clear currently assigned vehicle(s) for this driver
    vehicles.forEach(v => {
      if (v.assigned_driver_id === driverId && v.id !== assigned_vehicle_id) {
        updateItem('vehicles', { ...v, assigned_driver_id: null });
      }
    });

    // Assign new vehicle
    if (assigned_vehicle_id) {
      const v = vehicles.find(veh => veh.id === assigned_vehicle_id);
      if (v && v.assigned_driver_id !== driverId) {
        updateItem('vehicles', { ...v, assigned_driver_id: driverId });
      }
    }
    closeModal();
  };

  return (
    <div>
      <div className="page-header"><h1>Drivers</h1>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => exportToCSV(filtered, 'drivers', [
            { label: 'Name', accessor: r => r.name }, { label: 'Phone', accessor: r => r.phone },
            { label: 'Vehicle', accessor: r => r.assignedVehicle }, { label: 'Trips', accessor: r => r.tripCount },
            { label: 'Status', accessor: r => r.is_active ? 'active' : 'inactive' },
          ])}><Download size={16}/> Export</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Add Driver</button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar"><div className="table-toolbar-left"><div className="search-input"><Search size={15}/><input placeholder="Search drivers..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div></div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Assigned Vehicle</th><th>Trips</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{filtered.length === 0 ? <tr><td colSpan={7} className="table-empty">No drivers found</td></tr> : filtered.map(d => (
              <tr key={d.id}>
                <td className="primary">{d.name}</td>
                <td>{d.email || '—'}</td>
                <td>{d.phone || '—'}</td>
                <td>{d.assignedVehicle}</td>
                <td className="numeric">{d.tripCount}</td>
                <td><StatusBadge status={d.is_active ? 'active' : 'inactive'}/></td>
                <td><div style={{display:'flex',gap:4}}>
                  <button className="btn-icon" onClick={()=>openView(d)}><Eye size={16}/></button>
                  <button className="btn-icon" onClick={()=>openEdit(d)}><Edit2 size={16}/></button>
                  <button className="btn-icon" onClick={()=>deleteItem('users',d.id)}><Trash2 size={16}/></button>
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} drivers</span></div>
      </div>

      {modal === 'view' && selected && <Modal title={selected.name} onClose={closeModal}>
        <div className="detail-grid">
          <div><div className="detail-label">Email</div><div className="detail-value">{selected.email || '—'}</div></div>
          <div><div className="detail-label">Phone</div><div className="detail-value">{selected.phone || '—'}</div></div>
          <div><div className="detail-label">Assigned Vehicle</div><div className="detail-value">{selected.assignedVehicle}</div></div>
          <div><div className="detail-label">Status</div><div className="detail-value"><StatusBadge status={selected.is_active ? 'active' : 'inactive'}/></div></div>
          <div><div className="detail-label">Total Trips</div><div className="detail-value" style={{fontSize:20,fontWeight:700}}>{selected.tripCount}</div></div>
        </div>
      </Modal>}

      {(modal === 'add' || modal === 'edit') && <Modal title={modal==='add'?'Add Driver':'Edit Driver'} onClose={closeModal}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.is_active ? 'active' : 'inactive'} onChange={e=>setForm({...form,is_active: e.target.value === 'active'})}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          <div className="form-group"><label className="form-label">Assigned Vehicle</label>
            <select className="form-select" value={form.assigned_vehicle_id || ''} onChange={e=>setForm({...form, assigned_vehicle_id: e.target.value})}>
              <option value="">None</option>
              {vehicles.filter(v => !v.assigned_driver_id || v.id === form.assigned_vehicle_id).map(v => <option key={v.id} value={v.id}>{v.registration} — {v.make} {v.model}</option>)}
            </select>
          </div>
        </div>
      </Modal>}
    </div>
  );
}
