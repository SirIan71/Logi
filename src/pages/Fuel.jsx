import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, formatNumber, searchFilter, generateId, exportToCSV } from '../utils/helpers';
import { useFuelPrices } from '../utils/useFuelPrices';
import Modal from '../components/common/Modal';
import { Plus, Search, Download, Edit2, Trash2, AlertTriangle, RefreshCw, Fuel as FuelIcon } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend);
const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1E293B', titleColor: '#F1F5F9', bodyColor: '#94A3B8', borderColor: '#334155', borderWidth: 1, padding: 10, cornerRadius: 8 }}, scales: { x: { grid: { color: '#1e293b44' }, ticks: { color: '#64748B', font: { size: 11 }}}, y: { grid: { color: '#1e293b44' }, ticks: { color: '#64748B', font: { size: 11 }}}}};

export default function Fuel() {
  const { fuelRecords, vehicles, trips, lookup, addItem, updateItem, deleteItem } = useApp();
  const drivers = useApp().users.filter(u => u.role === 'driver');
  const { prices: fuelPrices, loading: pricesLoading, refresh: refreshPrices, updateRates } = useFuelPrices();
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [rateForm, setRateForm] = useState({});

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
  const openRateUpdate = () => {
    setRateForm({
      super_petrol: fuelPrices?.super_petrol || '',
      diesel: fuelPrices?.diesel || '',
      kerosene: fuelPrices?.kerosene || '',
      effective_from: fuelPrices?.effective_from || '',
      effective_to: fuelPrices?.effective_to || '',
      location: fuelPrices?.location || 'Nairobi',
    });
    setModal('updateRates');
  };
  const closeModal = () => { setModal(null); setForm({}); setRateForm({}); };

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

  const saveRates = () => {
    updateRates({
      super_petrol: +rateForm.super_petrol,
      diesel: +rateForm.diesel,
      kerosene: +rateForm.kerosene,
      effective_from: rateForm.effective_from,
      effective_to: rateForm.effective_to,
      location: rateForm.location,
    });
    closeModal();
  };

  // Formatted last update time
  const lastUpdated = fuelPrices?.fetched_at
    ? new Date(fuelPrices.fetched_at).toLocaleString('en-UK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

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

      {/* ── Live Kenya Fuel Rates Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface-container-low) 0%, var(--surface-container) 100%)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.04 }}>
          <FuelIcon size={160} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-warning)', fontSize: 20 }}>local_gas_station</span>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-warning)' }}>
                Kenya Fuel Rates (EPRA)
              </h3>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: 'var(--color-success-bg)', color: 'var(--color-success)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {pricesLoading ? 'Loading...' : 'Live'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
              {fuelPrices?.location || 'Nairobi'} • Effective {fuelPrices?.effective_from || '—'} to {fuelPrices?.effective_to || '—'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-icon"
              onClick={refreshPrices}
              title="Refresh rates"
              style={{ opacity: pricesLoading ? 0.5 : 1 }}
              disabled={pricesLoading}
            >
              <RefreshCw size={16} style={{ animation: pricesLoading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={openRateUpdate}
              style={{ fontSize: 11, padding: '4px 12px' }}
            >
              Update Rates
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 12, padding: '16px 20px',
            borderLeft: '4px solid #F59E0B',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Super Petrol</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B', fontFamily: 'var(--font-headline)' }}>
              KES {fuelPrices?.super_petrol ? formatNumber(fuelPrices.super_petrol, 2) : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>per litre</div>
          </div>
          <div style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 12, padding: '16px 20px',
            borderLeft: '4px solid #3B82F6',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Diesel</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#3B82F6', fontFamily: 'var(--font-headline)' }}>
              KES {fuelPrices?.diesel ? formatNumber(fuelPrices.diesel, 2) : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>per litre</div>
          </div>
          <div style={{
            background: 'var(--surface-container-lowest)',
            borderRadius: 12, padding: '16px 20px',
            borderLeft: '4px solid #8B5CF6',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 4 }}>Kerosene</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#8B5CF6', fontFamily: 'var(--font-headline)' }}>
              KES {fuelPrices?.kerosene ? formatNumber(fuelPrices.kerosene, 2) : '—'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>per litre</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Source: {fuelPrices?.source || 'EPRA Kenya'} • Last checked: {lastUpdated}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Auto-refreshes daily at midnight
          </span>
        </div>
      </div>

      <div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:20}}>
        <div className="kpi-card" style={{'--kpi-color':'var(--color-warning)','--kpi-bg':'var(--color-warning-bg)'}}><div className="kpi-value">{formatCurrency(totals.totalCost)}</div><div className="kpi-label">Total Fuel Cost</div></div>
        <div className="kpi-card" style={{'--kpi-color':'var(--color-info)','--kpi-bg':'var(--color-info-bg)'}}><div className="kpi-value">{formatNumber(totals.totalLiters)} L</div><div className="kpi-label">Total Liters</div></div>
        <div className="kpi-card" style={{'--kpi-color':'var(--color-success)','--kpi-bg':'var(--color-success-bg)'}}><div className="kpi-value">KES {formatNumber(totals.avgPricePerLiter, 2)}/L</div><div className="kpi-label">Avg Price/Liter (Actual)</div></div>
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
            <thead><tr><th>Date</th><th>Vehicle</th><th>Liters</th><th>Cost</th><th>Price/L</th><th>Odometer</th><th>Station</th><th>Trip</th><th>Actions</th></tr></thead>
            <tbody>{filtered.length === 0 ? <tr><td colSpan={9} className="table-empty">No records</td></tr> :
              filtered.map(f => { const trip = lookup('trips', f.trip_id); const pricePerL = f.liters > 0 ? f.cost / f.liters : 0; return (
                <tr key={f.id}>
                  <td>{formatDate(f.date)}</td>
                  <td className="primary">{lookup('vehicles', f.vehicle_id)?.registration||'—'}</td>
                  <td className="numeric">{formatNumber(f.liters)} L</td>
                  <td className="numeric">{formatCurrency(f.cost)}</td>
                  <td className="numeric" style={{
                    color: fuelPrices?.diesel && pricePerL > fuelPrices.diesel * 1.05
                      ? 'var(--color-danger)'
                      : 'var(--text-secondary)',
                    fontWeight: fuelPrices?.diesel && pricePerL > fuelPrices.diesel * 1.05 ? 600 : 400,
                  }}>
                    KES {formatNumber(pricePerL, 2)}
                  </td>
                  <td className="numeric">{formatNumber(f.odometer_reading)} km</td>
                  <td>{f.station}</td>
                  <td>{trip?`${trip.origin}→${trip.destination}`:'—'}</td>
                  <td><div style={{display:'flex',gap:4}}>
                    <button className="btn-icon" onClick={()=>openEdit(f)}><Edit2 size={16}/></button>
                    <button className="btn-icon" onClick={()=>deleteItem('fuelRecords',f.id)}><Trash2 size={16}/></button>
                  </div></td>
                </tr>
              ); })
            }
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} records</span></div>
      </div>

      {/* Record / Edit Fuel Modal */}
      {(modal === 'add' || modal === 'edit') && <Modal title={modal==='add'?'Record Fuel':'Edit Fuel Record'} onClose={closeModal}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Vehicle</label><select className="form-select" value={form.vehicle_id||''} onChange={e=>setForm({...form,vehicle_id:e.target.value})}><option value="">Select</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.registration}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Trip</label><select className="form-select" value={form.trip_id||''} onChange={e=>setForm({...form,trip_id:e.target.value})}><option value="">None</option>{trips.map(t=><option key={t.id} value={t.id}>{t.origin}→{t.destination}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Liters</label><input className="form-input" type="number" value={form.liters||''} onChange={e=>setForm({...form,liters:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Cost (KES)</label><input className="form-input" type="number" value={form.cost||''} onChange={e=>setForm({...form,cost:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Odometer Reading</label><input className="form-input" type="number" value={form.odometer_reading||''} onChange={e=>setForm({...form,odometer_reading:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Station</label><input className="form-input" value={form.station||''} onChange={e=>setForm({...form,station:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.date||''} onChange={e=>setForm({...form,date:e.target.value})}/></div>
          {form.liters > 0 && form.cost > 0 && (
            <div className="form-group">
              <label className="form-label">Price per Litre</label>
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'var(--surface-container-high)',
                fontSize: 16, fontWeight: 700,
                color: fuelPrices?.diesel && (+form.cost / +form.liters) > fuelPrices.diesel * 1.05
                  ? 'var(--color-danger)' : 'var(--color-success)',
              }}>
                KES {formatNumber(+form.cost / +form.liters, 2)}/L
                {fuelPrices?.diesel && (
                  <span style={{ fontSize: 10, marginLeft: 8, color: 'var(--text-muted)', fontWeight: 400 }}>
                    (EPRA Diesel: KES {formatNumber(fuelPrices.diesel, 2)})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>}

      {/* Update EPRA Rates Modal */}
      {modal === 'updateRates' && <Modal title="Update EPRA Fuel Rates" onClose={closeModal}
        footer={<><button className="btn btn-secondary" onClick={closeModal}>Cancel</button><button className="btn btn-primary" onClick={saveRates}>Save Rates</button></>}>
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: 'var(--color-info-bg)', color: 'var(--color-info)', fontSize: 12 }}>
          <strong>ℹ️ Manual Update:</strong> Enter the latest EPRA-published rates. These prices are typically updated around the 14th of each month on <a href="https://www.epra.go.ke" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>epra.go.ke</a>
        </div>
        <div className="form-grid">
          <div className="form-group"><label className="form-label">Super Petrol (KES/L)</label><input className="form-input" type="number" step="0.01" value={rateForm.super_petrol||''} onChange={e=>setRateForm({...rateForm,super_petrol:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Diesel (KES/L)</label><input className="form-input" type="number" step="0.01" value={rateForm.diesel||''} onChange={e=>setRateForm({...rateForm,diesel:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Kerosene (KES/L)</label><input className="form-input" type="number" step="0.01" value={rateForm.kerosene||''} onChange={e=>setRateForm({...rateForm,kerosene:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={rateForm.location||''} onChange={e=>setRateForm({...rateForm,location:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Effective From</label><input className="form-input" type="date" value={rateForm.effective_from||''} onChange={e=>setRateForm({...rateForm,effective_from:e.target.value})}/></div>
          <div className="form-group"><label className="form-label">Effective To</label><input className="form-input" type="date" value={rateForm.effective_to||''} onChange={e=>setRateForm({...rateForm,effective_to:e.target.value})}/></div>
        </div>
      </Modal>}
    </div>
  );
}
