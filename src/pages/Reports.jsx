import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatNumber, getTripProfitability } from '../utils/helpers';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FileText, TrendingUp, Truck, Users, MapPin, Fuel } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);
const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1E293B', titleColor: '#F1F5F9', bodyColor: '#94A3B8', borderColor: '#334155', borderWidth: 1, cornerRadius: 8 }}, scales: { x: { grid: { color: '#1e293b44' }, ticks: { color: '#64748B' }}, y: { grid: { color: '#1e293b44' }, ticks: { color: '#64748B' }}}};

export default function Reports() {
  const { trips, income, expenses, vehicles, clients, fuelRecords, routes, lookup } = useApp();
  const [report, setReport] = useState('profitability');

  // Profitability by route
  const routeProfit = useMemo(() => {
    const data = {};
    trips.filter(t => t.status === 'completed').forEach(t => {
      const r = lookup('routes', t.route_id);
      const name = r?.name || 'Unknown';
      const p = getTripProfitability(t, income, expenses);
      if (!data[name]) data[name] = { income: 0, expenses: 0 };
      data[name].income += p.income;
      data[name].expenses += p.expenses;
    });
    const entries = Object.entries(data).sort((a, b) => (b[1].income - b[1].expenses) - (a[1].income - a[1].expenses));
    return {
      labels: entries.map(e => e[0]),
      datasets: [
        { label: 'Income', data: entries.map(e => e[1].income), backgroundColor: '#10B981', borderRadius: 6 },
        { label: 'Expenses', data: entries.map(e => e[1].expenses), backgroundColor: '#EF4444', borderRadius: 6 },
      ]
    };
  }, [trips, income, expenses, lookup]);

  // Expense breakdown by category
  const expenseBreakdown = useMemo(() => {
    const data = {};
    expenses.forEach(e => {
      const cat = lookup('expenseCategories', e.category_id);
      const name = cat?.name || 'Other';
      data[name] = (data[name] || 0) + e.amount;
    });
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map(e => e[0]),
      datasets: [{ data: entries.map(e => e[1]), backgroundColor: ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#EC4899','#14B8A6','#F97316','#6366F1'] }]
    };
  }, [expenses, lookup]);

  // Vehicle utilization
  const vehicleUtil = useMemo(() => {
    const data = vehicles.filter(v => v.status !== 'decommissioned').map(v => {
      const t = trips.filter(tr => tr.vehicle_id === v.id);
      return { reg: v.registration, trips: t.length, completed: t.filter(tr => tr.status === 'completed').length };
    }).sort((a, b) => b.trips - a.trips);
    return {
      labels: data.map(d => d.reg),
      datasets: [{ label: 'Trips', data: data.map(d => d.trips), backgroundColor: '#3B82F6', borderRadius: 6 }]
    };
  }, [vehicles, trips]);

  // Driver activity (using data from context)
  const driverActivity = useMemo(() => null, []);

  const reports = [
    { id: 'profitability', icon: TrendingUp, label: 'Route Profitability' },
    { id: 'expenses', icon: FileText, label: 'Expense Breakdown' },
    { id: 'vehicles', icon: Truck, label: 'Vehicle Utilization' },
    { id: 'fuel', icon: Fuel, label: 'Fuel Analysis' },
  ];

  return (
    <div>
      <div className="page-header"><h1>Reports</h1></div>

      <div className="tabs" style={{marginBottom:24}}>
        {reports.map(r => <button key={r.id} className={`tab${report===r.id?' active':''}`} onClick={()=>setReport(r.id)}>
          <span style={{display:'flex',alignItems:'center',gap:6}}><r.icon size={14}/> {r.label}</span>
        </button>)}
      </div>

      {report === 'profitability' && <div>
        <div className="chart-card" style={{marginBottom:20}}>
          <div className="chart-card-header"><span className="chart-card-title">Route Profitability Comparison</span></div>
          <div style={{height:350}}><Bar data={routeProfit} options={{...chartOpts, plugins: {...chartOpts.plugins, legend: {display:true, labels:{color:'#94A3B8',usePointStyle:true,padding:16}}}}}/></div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Route</th><th>Total Income</th><th>Total Expenses</th><th>Net Profit</th><th>Margin</th></tr></thead>
            <tbody>{routeProfit.labels.map((name, i) => {
              const inc = routeProfit.datasets[0].data[i];
              const exp = routeProfit.datasets[1].data[i];
              return <tr key={name}><td className="primary">{name}</td><td className="numeric positive">{formatCurrency(inc)}</td><td className="numeric negative">{formatCurrency(exp)}</td><td className="numeric" style={{color: inc-exp>=0?'var(--color-success)':'var(--color-danger)',fontWeight:700}}>{formatCurrency(inc-exp)}</td><td className="numeric">{inc > 0 ? ((inc-exp)/inc*100).toFixed(1) + '%' : '—'}</td></tr>;
            })}</tbody>
          </table>
        </div>
      </div>}

      {report === 'expenses' && <div className="charts-grid">
        <div className="chart-card"><div className="chart-card-header"><span className="chart-card-title">Expense Distribution</span></div>
          <div style={{height:350,display:'flex',justifyContent:'center'}}><Doughnut data={expenseBreakdown} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:'#94A3B8',usePointStyle:true,padding:12}},tooltip:chartOpts.plugins.tooltip},cutout:'60%'}}/></div>
        </div>
        <div className="chart-card"><div className="chart-card-header"><span className="chart-card-title">Expense by Category</span></div>
          <div style={{padding:8}}>
            {expenseBreakdown.labels.map((name, i) => <div key={name} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border-subtle)'}}>
              <span style={{display:'flex',alignItems:'center',gap:8}}><span style={{width:10,height:10,borderRadius:'50%',background:expenseBreakdown.datasets[0].backgroundColor[i]}}/>{name}</span>
              <span style={{fontWeight:600}}>{formatCurrency(expenseBreakdown.datasets[0].data[i])}</span>
            </div>)}
          </div>
        </div>
      </div>}

      {report === 'vehicles' && <div className="chart-card">
        <div className="chart-card-header"><span className="chart-card-title">Vehicle Utilization (Total Trips)</span></div>
        <div style={{height:350}}><Bar data={vehicleUtil} options={chartOpts}/></div>
      </div>}

      {report === 'fuel' && <div className="chart-card">
        <div className="chart-card-header"><span className="chart-card-title">Fuel Cost by Vehicle</span></div>
        <div style={{height:350}}><Bar data={{
          labels: vehicles.filter(v=>v.status!=='decommissioned').map(v=>v.registration),
          datasets: [{label:'Fuel Cost',data:vehicles.filter(v=>v.status!=='decommissioned').map(v=>fuelRecords.filter(f=>f.vehicle_id===v.id).reduce((s,f)=>s+f.cost,0)),backgroundColor:'#F59E0B',borderRadius:6}]
        }} options={chartOpts}/></div>
      </div>}
    </div>
  );
}
