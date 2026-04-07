import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber, getTripProfitability, daysUntil } from '../utils/helpers';
import {
  TrendingUp, TrendingDown, DollarSign, Receipt, BarChart3,
  Truck, Package, Fuel, AlertTriangle, Users, MapPin
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Filler, Tooltip, Legend
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);

const chartOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1E293B', titleColor: '#F1F5F9', bodyColor: '#94A3B8', borderColor: '#334155', borderWidth: 1, padding: 10, cornerRadius: 8 } },
  scales: { x: { grid: { color: '#1e293b44' }, ticks: { color: '#64748B', font: { size: 11 } } }, y: { grid: { color: '#1e293b44' }, ticks: { color: '#64748B', font: { size: 11 } } } }
};

export default function Dashboard() {
  const { trips, income, expenses, vehicles, clients, fuelRecords, maintenance, routes, lookup } = useApp();

  const stats = useMemo(() => {
    const actualIncome = income.filter(i => i.payment_status === 'paid').reduce((s, i) => s + i.amount_paid, 0);
    const projectedIncome = income.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const outstanding = income.reduce((s, i) => s + (i.amount - i.amount_paid), 0);
    const redeemable = expenses.filter(e => e.is_redeemable && !e.is_redeemed).reduce((s, e) => s + e.amount, 0);
    const activeTrips = trips.filter(t => t.status === 'in_progress').length;
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const fleetActive = vehicles.filter(v => v.status === 'active').length;
    const dueMaintenance = maintenance.filter(m => daysUntil(m.next_due_date) <= 30).length;
    return { actualIncome, projectedIncome, totalExpenses, netProfit: actualIncome - totalExpenses, outstanding, redeemable, activeTrips, completedTrips, fleetActive, dueMaintenance };
  }, [trips, income, expenses, vehicles, maintenance]);

  // Trip profitability data
  const tripProfitData = useMemo(() => {
    const completed = trips.filter(t => t.status === 'completed').slice(0, 8);
    return {
      labels: completed.map(t => `${t.origin.slice(0,3)}→${t.destination.slice(0,3)}`),
      datasets: [
        { label: 'Income', data: completed.map(t => getTripProfitability(t, income, expenses).income), backgroundColor: '#10B981', borderRadius: 6 },
        { label: 'Expenses', data: completed.map(t => getTripProfitability(t, income, expenses).expenses), backgroundColor: '#EF4444', borderRadius: 6 },
      ]
    };
  }, [trips, income, expenses]);

  // Revenue trend (mock monthly data)
  const revenueTrend = useMemo(() => ({
    labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    datasets: [
      { label: 'Revenue', data: [320000, 380000, 410000, 365000, 425000, stats.actualIncome || 271000], borderColor: '#3B82F6', backgroundColor: '#3b82f622', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#3B82F6' },
      { label: 'Expenses', data: [210000, 240000, 195000, 230000, 265000, stats.totalExpenses || 165750], borderColor: '#EF4444', backgroundColor: '#ef444422', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#EF4444' },
    ]
  }), [stats]);

  // Client revenue distribution
  const clientRevenue = useMemo(() => {
    const data = {};
    income.forEach(i => {
      const c = lookup('clients', i.client_id);
      const name = c?.company_name || 'Unknown';
      data[name] = (data[name] || 0) + i.amount;
    });
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    return {
      labels: sorted.map(s => s[0]),
      datasets: [{ data: sorted.map(s => s[1]), backgroundColor: ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444','#06B6D4'] }]
    };
  }, [income, lookup]);

  // Fuel by vehicle
  const fuelByVehicle = useMemo(() => {
    const data = {};
    fuelRecords.forEach(f => {
      const v = lookup('vehicles', f.vehicle_id);
      const reg = v?.registration || f.vehicle_id;
      data[reg] = (data[reg] || 0) + f.cost;
    });
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map(e => e[0]),
      datasets: [{ label: 'Fuel Cost', data: entries.map(e => e[1]), backgroundColor: '#F59E0B', borderRadius: 6 }]
    };
  }, [fuelRecords, lookup]);

  // Alerts
  const alerts = useMemo(() => {
    const list = [];
    maintenance.forEach(m => {
      const days = daysUntil(m.next_due_date);
      const v = lookup('vehicles', m.vehicle_id);
      if (days < 0) list.push({ type: 'danger', text: `${v?.registration} — ${m.service_type} overdue by ${Math.abs(days)} days`, time: m.next_due_date });
      else if (days <= 30) list.push({ type: 'warning', text: `${v?.registration} — ${m.service_type} due in ${days} days`, time: m.next_due_date });
    });
    income.filter(i => i.payment_status === 'unpaid').forEach(i => {
      const c = lookup('clients', i.client_id);
      list.push({ type: 'danger', text: `${i.invoice_number} — ${formatCurrency(i.amount)} unpaid from ${c?.company_name}`, time: i.due_date });
    });
    trips.filter(t => t.status === 'delayed').forEach(t => {
      list.push({ type: 'warning', text: `Trip ${t.origin}→${t.destination} is delayed`, time: t.departure_date });
    });
    return list.slice(0, 8);
  }, [maintenance, income, trips, lookup]);

  const kpis = [
    { label: 'Projected Income', value: formatCurrency(stats.projectedIncome), icon: TrendingUp, color: 'var(--color-info)', bg: 'var(--color-info-bg)', trend: '+12%', up: true },
    { label: 'Actual Income', value: formatCurrency(stats.actualIncome), icon: DollarSign, color: 'var(--color-success)', bg: 'var(--color-success-bg)', trend: '+8%', up: true },
    { label: 'Total Expenses', value: formatCurrency(stats.totalExpenses), icon: Receipt, color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', trend: '+5%', up: false },
    { label: 'Net Profit', value: formatCurrency(stats.netProfit), icon: BarChart3, color: stats.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', bg: stats.netProfit >= 0 ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', trend: '+15%', up: true },
    { label: 'Outstanding', value: formatCurrency(stats.outstanding), icon: AlertTriangle, color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
    { label: 'Redeemable', value: formatCurrency(stats.redeemable), icon: Receipt, color: 'var(--color-purple)', bg: 'var(--color-purple-bg)' },
    { label: 'Active Trips', value: stats.activeTrips, icon: Package, color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
    { label: 'Fleet Active', value: `${stats.fleetActive}/${vehicles.length}`, icon: Truck, color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  ];

  return (
    <div>
      <div className="kpi-grid">
        {kpis.map((kpi, i) => (
          <div key={i} className="kpi-card" style={{ '--kpi-color': kpi.color, '--kpi-bg': kpi.bg }}>
            <div className="kpi-header">
              <div className="kpi-icon"><kpi.icon size={20}/></div>
              {kpi.trend && (
                <div className={`kpi-trend ${kpi.up ? 'up' : 'down'}`}>
                  {kpi.up ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} {kpi.trend}
                </div>
              )}
            </div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-label">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-header"><span className="chart-card-title">Revenue vs Expenses</span></div>
          <div style={{height:280}}><Line data={revenueTrend} options={{...chartOpts, plugins: {...chartOpts.plugins, legend: {display:true, labels:{color:'#94A3B8',usePointStyle:true,pointStyle:'circle',padding:16,font:{size:11}}}}}} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-card-header"><span className="chart-card-title">Trip Profitability</span></div>
          <div style={{height:280}}><Bar data={tripProfitData} options={{...chartOpts, plugins: {...chartOpts.plugins, legend: {display:true, labels:{color:'#94A3B8',usePointStyle:true,pointStyle:'circle',padding:16,font:{size:11}}}}}} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-card-header"><span className="chart-card-title">Client Revenue</span></div>
          <div style={{height:280, display:'flex', justifyContent:'center'}}><Doughnut data={clientRevenue} options={{responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'right',labels:{color:'#94A3B8',usePointStyle:true,pointStyle:'circle',padding:12,font:{size:11}}},tooltip:chartOpts.plugins.tooltip}, cutout:'65%'}} /></div>
        </div>
        <div className="chart-card">
          <div className="chart-card-header"><span className="chart-card-title">Fuel Cost by Vehicle</span></div>
          <div style={{height:280}}><Bar data={fuelByVehicle} options={chartOpts} /></div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="alerts-panel">
          <div className="alerts-panel-title">⚡ Alerts & Notifications</div>
          {alerts.length === 0 ? <p style={{color:'var(--text-muted)',fontSize:13}}>No alerts at this time</p> : alerts.map((a, i) => (
            <div key={i} className="alert-item">
              <div className={`alert-dot ${a.type}`}/>
              <div>
                <div className="alert-text">{a.text}</div>
                <div className="alert-time">{a.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="alerts-panel">
          <div className="alerts-panel-title">📊 Quick Stats</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginTop:'8px'}}>
            <div><div className="detail-label">Completed Trips</div><div className="detail-value" style={{fontSize:24,fontWeight:800}}>{stats.completedTrips}</div></div>
            <div><div className="detail-label">Active Clients</div><div className="detail-value" style={{fontSize:24,fontWeight:800}}>{clients.filter(c=>c.status==='active').length}</div></div>
            <div><div className="detail-label">Due Maintenance</div><div className="detail-value" style={{fontSize:24,fontWeight:800,color:'var(--color-warning)'}}>{stats.dueMaintenance}</div></div>
            <div><div className="detail-label">Routes Managed</div><div className="detail-value" style={{fontSize:24,fontWeight:800}}>{routes.length}</div></div>
            <div><div className="detail-label">Total Fuel Cost</div><div className="detail-value" style={{fontSize:18,fontWeight:700}}>{formatCurrency(fuelRecords.reduce((s,f)=>s+f.cost,0))}</div></div>
            <div><div className="detail-label">Avg Trip Profit</div><div className="detail-value" style={{fontSize:18,fontWeight:700,color:'var(--color-success)'}}>{formatCurrency(trips.filter(t=>t.status==='completed').reduce((s,t)=>s+getTripProfitability(t,income,expenses).profit,0)/(stats.completedTrips||1))}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
