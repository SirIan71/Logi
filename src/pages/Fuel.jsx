import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, formatNumber, searchFilter, generateId, exportToCSV } from '../utils/helpers';
import Modal from '../components/common/Modal';
import { Plus, Search, Download, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend);
const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1E293B', titleColor: '#F1F5F9', bodyColor: '#94A3B8', borderColor: '#334155', borderWidth: 1, padding: 10, cornerRadius: 8 }}, scales: { x: { grid: { color: '#1e293b44' }, ticks: { color: '#64748B', font: { size: 11 }}}, y: { grid: { color: '#1e293b44' }, ticks: { color: '#64748B', font: { size: 11 }}}}};

export default function Fuel() {
  const { fuelRecords, vehicles, trips, lookup, addItem, updateItem, deleteItem } = useApp();
  const drivers = useApp().users.filter(u => u.role === 'driver');
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const filtered = useMemo(() => {
    let data = vehicleFilter === 'all' ? fuelRecords : fuelRecords.filter(f => f.vehicle_id === vehicleFilter);
    return searchFilter(data, search, ['station'])
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [fuelRecords, search, vehicleFilter]);

  const totals = useMemo(() => {
    const totalLiters = fuelRecords.reduce((s, f) => s + f.liters, 0);
    const totalCost = fuelRecords.reduce((s, f) => s + f.cost, 0);
    const avgPricePerLiter = totalCost / (totalLiters || 1);
    return { totalLiters, totalCost, avgPricePerLiter, records: fuelRecords.length };
  }, [fuelRecords]);

  // Efficiency per vehicle
  const efficiency = useMemo(() => {
    const vehicleData = {};
    fuelRecords.forEach(f => {
      if (!vehicleData[f.vehicle_id]) vehicleData[f.vehicle_id] = { liters: 0, cost: 0, records: [] };
      vehicleData[f.vehicle_id].liters += f.liters;
      vehicleData[f.vehicle_id].cost += f.cost;
      vehicleData[f.vehicle_id].records.push(f);
    });
    return Object.entries(vehicleData).map(([vid, d]) => {
      const v = lookup('vehicles', vid);
      const recs = d.records.sort((a, b) => a.odometer_reading - b.odometer_reading);
      const distance = recs.length > 1 ? recs[recs.length - 1].odometer_reading - recs[0].odometer_reading : 0;
      return { vehicle: v?.registration || vid, liters: d.liters, cost: d.cost, distance, kmPerLiter: distance / (d.liters || 1), costPerKm: d.cost / (distance || 1) };
    }).sort((a, b) => a.kmPerLiter - b.kmPerLiter);
  }, [fuelRecords, lookup]);

  // Anomaly detection: flag if km/L is less than 60% of fleet average
  const fleetAvgKmL = efficiency.length > 0 ? efficiency.reduce((s, e) => s + e.kmPerLiter, 0) / efficiency.length : 0;
  const anomalies = efficiency.filter(e => e.kmPerLiter < fleetAvgKmL * 0.6 && e.distance > 0);

  // Fuel cost trend by date
  const fuelTrend = useMemo(() => {
    const byDate = {};
    fuelRecords.forEach(f => { byDate[f.date] = (byDate[f.date] || 0) + f.cost; });
    const sorted = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0]));
    return {
      labels: sorted.map(s => formatDate(s[0])),
      datasets: [{ label: 'Fuel Cost', data: sorted.map(s => s[1]), borderColor: '#F59E0B', backgroundColor: '#f59e0b22', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#F59E0B' }]
    };
  }, [fuelRecords]);

  const efficiencyChart = useMemo(() => ({
    labels: efficiency.map(e => e.vehicle),
    datasets: [{ label: 'km/L', data: efficiency.map(e => +e.kmPerLiter.toFixed(2)), backgroundColor: efficiency.map(e => e.kmPerLiter < fleetAvgKmL * 0.6 ? '#EF4444' : '#10B981'), borderRadius: 6 }]
  }), [efficiency, fleetAvgKmL]);

  const openAdd = () => { setForm({ date: new Date().toISOString().split('T')[0] }); setModal('add'); };
  const openEdit = (f) => { setForm({ ...f }); setModal('edit'); };
  const closeModal = () => { setModal(null); setForm({}); };
  const save = () => { 
    const data = { ...form, liters: +form.liters, cost: +form.cost, odometer_reading: +form.odometer_reading }; 
    if (modal === 'add') addItem('fuelRecords', { ...data, id: generateId('f') }); 
    else updateItem('fuelRecords', data); 
    
    // Update vehicle odometer
    if (data.vehicle_id && data.odometer_reading) {
      const v = lookup('vehicles', data.vehicle_id);
      if (v && data.odometer_reading > (v.current_odometer || 0)) {
        updateItem('vehicles', { ...v, current_odometer: data.odometer_reading });
      }
    }
    
    closeModal(); 
  };

  return (
    <div>
      <div className="page-header"><h1>Fuel Tracking</h1>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => exportToCSV(filtered, 'fuel', [
            { label: 'Date', accessor: r => r.date }, { label: 'Vehicle', accessor: r => lookup('vehicles', r.vehicle_id)?.registration },
            { label: 'Liters', accessor: r => r.liters }, { label: 'Cost', accessor: r => r.cost },
            { label: 'Odometer', accessor: r => r.odometer_reading }, { label: 'Station', accessor: r => r.station },
          ])}><Download size={16}/> Export</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/> Record Fuel</button>
        </div>
      </div>

      <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
        <div className="kpi-card" style={{'--kpi-color':'var(--color-warning)','--kpi-bg':'var(--color-warning-bg)'}}><div className="kpi-value">{formatCurrency(totals.totalCost)}</div><div className="kpi-label">Total Fuel Cost</div></div>
        <div className="kpi-card" style={{'--kpi-color':'var(--color-info)','--kpi-bg':'var(--color-info-bg)'}}><div className="kpi-value">{formatNumber(totals.totalLiters)} L</div><div className="kpi-label">Total Liters</div></div>
        <div className="kpi-card" style={{'--kpi-color':'var(--color-success)','--kpi-bg':'var(--color-success-bg)'}}><div className="kpi-value">R{formatNumber(totals.avgPricePerLiter, 2)}/L</div><div className="kpi-label">Avg Price/Liter</div></div>
        <div className="kpi-card" style={{'--kpi-color': anomalies.length > 0 ? 'var(--color-danger)' : 'var(--color-success)','--kpi-bg': anomalies.length > 0 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)'}}><div className="kpi-value">{anomalies.length}</div><div className="kpi-label">Fuel Anomalies</div></div>
      </div>

      {anomalies.length > 0 && <div className="alerts-panel" style={{marginBottom: 20, borderColor: 'var(--color-danger)', borderWidth: 1}}>
        <div className="alerts-panel-title" style={{color:'var(--color-danger)'}}><AlertTriangle size={16} style={{display:'inline',verticalAlign:'middle',marginRight:6}}/> Fuel Anomaly Detected</div>
        {anomalies.map((a, i) => <div key={i} className="alert-item"><div className="alert-dot danger"/><div className="alert-text"><strong>{a.vehicle}</strong> — {formatNumber(a.kmPerLiter, 2)} km/L (fleet avg: {formatNumber(fleetAvgKmL, 2)} km/L). Possible fuel waste or theft.</div></div>)}
      </div>}

      <div className="charts-grid" style={{marginBottom:20}}>
        <div className="chart-card"><div className="chart-card-header"><span className="chart-card-title">Fuel Cost Trend</span></div><div style={{height:250}}><Line data={fuelTrend} options={chartOpts}/></div></div>
        <div className="chart-card"><div className="chart-card-header"><span className="chart-card-title">Fuel Efficiency by Vehicle (km/L)</span></div><div style={{height:250}}><Bar data={efficiencyChart} options={chartOpts}/></div></div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-input"><Search size={15}/><input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <select className="filter-select" value={vehicleFilter} onChange={e=>setVehicleFilter(e.target.value)}>
              <option value="all">All Vehicles</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.registration}</option>)}
            </select>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Vehicle</th><th>Liters</th><th>Cost</th><th>Odometer</th><th>Station</th><th>Trip</th><th>Actions</th></tr></thead>
            <tbody>{filtered.length === 0 ? <tr><td colSpan={8} className="table-empty">No records</td></tr> :
              filtered.map(f => { const trip = lookup('trips', f.trip_id); return (
                <tr key={f.id}>
                  <td>{formatDate(f.date)}</td>
                  <td className="primary">{lookup('vehicles', f.vehicle_id)?.registration||'—'}</td>
                  <td className="numeric">{formatNumber(f.liters)} L</td>
                  <td className="numeric">{formatCurrency(f.cost)}</td>
                  <td className="numeric">{formatNumber(f.odometer_reading)} km</td>
                  <td>{f.station}</td>
                  <td>{trip?`${trip.origin}→${trip.destination}`:'—'}</td>
                  <td><div style={{display:'flex',gap:4}}>
                    <button className="btn-icon" onClick={()=>openEdit(f)}><Edit2 size={16}/></button>
                    <button className="btn-icon" onClick={()=>deleteItem('fuelRecords',f.id)}><Trash2 size={16}/></button>
                  </div></td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} records</span></div>
      </div>

      {modal && <Modal title={modal==='add'?'Record Fuel':'Edit Fuel Record'} onClose={closeModal}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Vehicle</label><select className="form-select" value={form.vehicle_id||''} onChange={e=>setForm({...form,vehicle_id:e.target.value})}><option value="">Select</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.registration}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Trip</label><select className="form-select" value={form.trip_id||''} onChange={e=>setForm({...form,trip_id:e.target.value})}><option value="">None</option>{trips.map(t=><option key={t.id} value={t.id}>{t.origin}→{t.destination}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Liters</label><input className="form-input" type="number" value={form.liters||''} onChange={e=>setForm({...form,liters:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Cost (R)</label><input className="form-input" type="number" value={form.cost||''} onChange={e=>setForm({...form,cost:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Odometer Reading</label><input className="form-input" type="number" value={form.odometer_reading||''} onChange={e=>setForm({...form,odometer_reading:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Station</label><input className="form-input" value={form.station||''} onChange={e=>setForm({...form,station:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.date||''} onChange={e=>setForm({...form,date:e.target.value})}/></div>
        </div>
      </Modal>}
    </div>
  );
}
