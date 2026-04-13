import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getTripProfitability } from '../utils/helpers';

export default function Dashboard() {
  const { trips, income, expenses, vehicles, clients, lookup } = useApp();

  const stats = useMemo(() => {
    const actualIncome = income.filter(i => i.payment_status === 'paid').reduce((s, i) => s + i.amount_paid, 0);
    const projectedIncome = income.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const outstanding = income.reduce((s, i) => s + (i.amount - i.amount_paid), 0);
    const redeemable = expenses.filter(e => e.is_redeemable && !e.is_redeemed).reduce((s, e) => s + e.amount, 0);
    const completedTrips = trips.filter(t => t.status === 'completed').slice(0, 4);
    const fleetActive = vehicles.filter(v => v.status === 'active').length;
    return { actualIncome, projectedIncome, totalExpenses, netProfit: actualIncome - totalExpenses, outstanding, redeemable, completedTrips, fleetActive };
  }, [trips, income, expenses, vehicles]);

  // Client revenue dynamic
  const topClients = useMemo(() => {
    const data = {};
    income.forEach(i => {
      const c = lookup('clients', i.client_id);
      const name = c?.company_name || 'Unknown';
      data[name] = (data[name] || 0) + i.amount;
    });
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const total = sorted.reduce((sum, item) => sum + item[1], 0) || 1;
    return sorted.map(([name, amount], idx) => {
       const colors = ['bg-primary', 'bg-secondary', 'bg-primary-container'];
       return { name, percent: Math.round((amount / total) * 100), color: colors[idx] };
    });
  }, [income, lookup]);

  // Revenue vs Expenses Trend
  const revenueTrend = useMemo(() => {
    const monthlyData = {};
    const now = new Date('2026-04-15'); // Reference against system seed data date center
    
    // Pre-fill last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthStr = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        monthlyData[key] = { month: monthStr, rev: 0, exp: 0 };
    }

    income.forEach(i => {
       const dateStr = i.payment_date || i.due_date;
       if (!dateStr) return;
       const d = new Date(dateStr);
       const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
       if (monthlyData[key]) monthlyData[key].rev += i.amount;
    });

    expenses.forEach(e => {
       const dateStr = e.expense_date;
       if (!dateStr) return;
       const d = new Date(dateStr);
       const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
       if (monthlyData[key]) monthlyData[key].exp += e.amount;
    });

    const dataArray = Object.values(monthlyData);
    const maxVal = Math.max(...dataArray.flatMap(v => [v.rev, v.exp]), 1000);

    return dataArray.map(item => ({
        month: item.month,
        rLevel: `${Math.max(5, Math.round((item.rev / maxVal) * 100))}%`,
        eLevel: `${Math.max(5, Math.round((item.exp / maxVal) * 100))}%`,
        rev: item.rev,
        exp: item.exp
    }));
  }, [income, expenses]);

  return (
    <>
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-primary">Logistics Overview</h2>
          <p className="text-on-surface-variant font-body">Performance tracking for the current operational cycle.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-transparent hover:border-outline-variant/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/5 rounded-lg">
              <span className="material-symbols-outlined text-primary">trending_up</span>
            </div>
            <span className="text-xs font-bold text-secondary bg-secondary-container px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-sm text-on-surface-variant font-medium">Projected Income</p>
          <h3 className="text-2xl font-headline font-extrabold text-primary mt-1">{formatCurrency(stats.projectedIncome)}</h3>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-transparent hover:border-outline-variant/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/5 rounded-lg">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
            </div>
            <span className="text-xs font-bold text-secondary bg-secondary-container px-2 py-1 rounded-full">+8%</span>
          </div>
          <p className="text-sm text-on-surface-variant font-medium">Actual Income</p>
          <h3 className="text-2xl font-headline font-extrabold text-primary mt-1">{formatCurrency(stats.actualIncome)}</h3>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-transparent hover:border-outline-variant/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error/5 rounded-lg">
              <span className="material-symbols-outlined text-error">receipt_long</span>
            </div>
            <span className="text-xs font-bold text-error bg-error-container px-2 py-1 rounded-full">+5%</span>
          </div>
          <p className="text-sm text-on-surface-variant font-medium">Total Expenses</p>
          <h3 className="text-2xl font-headline font-extrabold text-primary mt-1">{formatCurrency(stats.totalExpenses)}</h3>
        </div>

        <div className="bg-primary p-6 rounded-xl shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <span className="material-symbols-outlined text-secondary-fixed">insights</span>
              </div>
              <span className="text-xs font-bold text-primary bg-secondary-fixed px-2 py-1 rounded-full">{stats.netProfit >= 0 ? '+' : '-'}15%</span>
            </div>
            <p className="text-sm text-white/70 font-medium">Net Profit</p>
            <h3 className="text-2xl font-headline font-extrabold text-white mt-1">{formatCurrency(stats.netProfit)}</h3>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-[120px]">monitoring</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-low p-6 rounded-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">pending_actions</span>
              </div>
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-wider">Accounts Receivable</p>
                <h4 className="text-xl font-headline font-bold text-primary">Pending Income</h4>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-headline font-extrabold text-primary">{formatCurrency(stats.outstanding)}</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary">stars</span>
              </div>
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-wider">Loyalty Credits</p>
                <h4 className="text-xl font-headline font-bold text-primary">Redeemable</h4>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-headline font-extrabold text-primary">{formatCurrency(stats.redeemable)}</span>
            </div>
          </div>
          <div className="bg-secondary-fixed p-6 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-on-secondary-fixed text-xs font-bold uppercase tracking-wider">Fleet Status</p>
              <h4 className="text-on-secondary-fixed text-xl font-headline font-extrabold">{stats.fleetActive}/{vehicles.length} Active</h4>
            </div>
            <div className="w-14 h-14 bg-on-secondary-fixed/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-on-secondary-fixed text-3xl">local_shipping</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-headline font-extrabold text-primary">Revenue vs Expenses</h3>
              <p className="text-sm text-on-surface-variant">Performance analysis (Last 6 Months)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-xs font-medium text-outline">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-error"></div>
                <span className="text-xs font-medium text-outline">Expenses</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-4 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
              {[0,1,2,3].map(i => <div key={i} className="border-b border-on-surface w-full"></div>)}
            </div>
            
            {revenueTrend.map(col => (
               <div key={col.month} className="flex-1 flex flex-col items-center gap-2 group" title={`Revenue: ${formatCurrency(col.rev)} | Expenses: ${formatCurrency(col.exp)}`}>
                 <div className="w-full flex justify-center items-end gap-1 h-full">
                   <div className="w-4 bg-primary/20 rounded-t-sm transition-all" style={{height: col.eLevel}}></div>
                   <div className="w-4 bg-primary rounded-t-sm transition-all group-hover:bg-primary-container" style={{height: col.rLevel}}></div>
                 </div>
                 <span className="text-[10px] font-bold text-outline">{col.month}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm flex flex-col">
          <h3 className="text-xl font-headline font-extrabold text-primary mb-6">Client Revenue</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#003539" strokeWidth="4" strokeDasharray="35 65"></circle>
                <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#516600" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="-35"></circle>
                <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#084D53" strokeWidth="4" strokeDasharray="20 80" strokeDashoffset="-60"></circle>
                <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#BFC8C9" strokeWidth="4" strokeDasharray="20 80" strokeDashoffset="-80"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold font-headline text-primary">{clients.length}</span>
                <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Top Clients</span>
              </div>
            </div>
            <div className="w-full space-y-3">
              {topClients.map((tc, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${tc.color}`}></div>
                    <span className="text-xs font-medium text-on-surface-variant">{tc.name}</span>
                  </div>
                  <span className="text-xs font-bold text-primary">{tc.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-sm overflow-hidden relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-headline font-extrabold text-primary">Trip Profitability</h3>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-secondary bg-secondary-container px-3 py-1 rounded-full">{stats.completedTrips.length} Recent</span>
            </div>
          </div>
          
          <div className="space-y-6">
            {stats.completedTrips.map((t, idx) => {
              const prof = getTripProfitability(t, income, expenses);
              const percent = prof.income > 0 ? Math.round((prof.profit / prof.income) * 100) : 0;
              const barColor = idx === 1 ? 'bg-secondary' : percent < 50 ? 'bg-primary/40' : 'bg-primary';
              return (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-primary uppercase">Route: {t.origin.slice(0,3)} → {t.destination.slice(0,3)}</span>
                    <span className="text-xs font-bold text-primary">{formatCurrency(prof.profit)} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                    <div className={`${barColor} h-full rounded-full transition-all duration-500`} style={{width: `${Math.max(percent, 0)}%`}}></div>
                  </div>
                </div>
              );
            })}
            
            {stats.completedTrips.length === 0 && (
               <p className="text-sm text-outline">No recent completed trips found.</p>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-outline-variant/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">history</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Last Audit</p>
                <p className="text-sm font-bold text-primary">{new Date().toLocaleString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit', hour12: false})}</p>
              </div>
            </div>
            <button className="text-primary text-xs font-bold underline decoration-secondary underline-offset-4">View All Reports</button>
          </div>
        </div>
      </div>
    </>
  );
}
