import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getTripProfitability } from '../utils/helpers';

export default function Dashboard() {
  const { trips, income, expenses, vehicles, clients, lookup } = useApp();

  const stats = useMemo(() => {
    const actualIncome = income.filter(i => i.payment_status === 'paid').reduce((s, i) => s + i.amount_paid, 0);
    const completedTripsAll = trips.filter(t => t.status === 'completed');
    const projectedIncome = completedTripsAll.reduce((s, t) => {
      const client = lookup('clients', t.client_id);
      if (!client || !client.rate_amount) return s;
      if (client.rate_type === 'per_ton') return s + (t.cargo_weight_tons || 0) * client.rate_amount;
      return s + client.rate_amount;
    }, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const outstanding = income.reduce((s, i) => s + (i.amount - i.amount_paid), 0);
    const redeemable = expenses.filter(e => e.is_redeemable && !e.is_redeemed).reduce((s, e) => s + e.amount, 0);
    const fleetActive = vehicles.filter(v => v.status === 'active').length;
    return { actualIncome, projectedIncome, totalExpenses, netProfit: actualIncome - totalExpenses, outstanding, redeemable, fleetActive };
  }, [trips, income, expenses, vehicles, clients, lookup]);

  // Client revenue dynamic — compute segments for doughnut + legend
  const clientRevenue = useMemo(() => {
    const data = {};
    income.forEach(i => {
      const c = lookup('clients', i.client_id);
      const name = c?.company_name || 'Unknown';
      data[name] = (data[name] || 0) + i.amount;
    });
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const totalAll = sorted.reduce((sum, item) => sum + item[1], 0) || 1;
    const uniqueClients = sorted.length;

    // Hex colors for SVG strokes + matching Tailwind-style inline colors for dots
    const segmentColors = ['#003539', '#516600', '#084D53', '#2C676D', '#86D3D7'];
    const MAX_SHOWN = 5;
    const top = sorted.slice(0, MAX_SHOWN);
    const othersAmount = sorted.slice(MAX_SHOWN).reduce((s, [, a]) => s + a, 0);

    const segments = top.map(([name, amount], idx) => ({
      name,
      amount,
      percent: Math.round((amount / totalAll) * 100),
      color: segmentColors[idx % segmentColors.length],
    }));

    if (othersAmount > 0) {
      segments.push({
        name: 'Others',
        amount: othersAmount,
        percent: Math.round((othersAmount / totalAll) * 100),
        color: '#BFC8C9',
      });
    }

    // Ensure percentages sum to 100
    const pctSum = segments.reduce((s, seg) => s + seg.percent, 0);
    if (pctSum !== 100 && segments.length > 0) {
      segments[0].percent += (100 - pctSum);
    }

    return { segments, uniqueClients };
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
              {[0, 1, 2, 3].map(i => <div key={i} className="border-b border-on-surface w-full"></div>)}
            </div>

            {revenueTrend.map(col => (
              <div key={col.month} className="flex-1 flex flex-col items-center gap-2 group" title={`Revenue: ${formatCurrency(col.rev)} | Expenses: ${formatCurrency(col.exp)}`}>
                <div className="w-full flex justify-center items-end gap-1 h-full">
                  <div className="w-4 bg-primary/20 rounded-t-sm transition-all" style={{ height: col.eLevel }}></div>
                  <div className="w-4 bg-primary rounded-t-sm transition-all group-hover:bg-primary-container" style={{ height: col.rLevel }}></div>
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
                {clientRevenue.segments.length === 0 ? (
                  <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#BFC8C9" strokeWidth="4" strokeDasharray="100 0" />
                ) : (
                  clientRevenue.segments.reduce((acc, seg, idx) => {
                    const circumference = 100;
                    const dashArray = `${seg.percent} ${circumference - seg.percent}`;
                    const offset = -acc.offset;
                    acc.circles.push(
                      <circle
                        key={idx}
                        cx="18" cy="18" fill="transparent" r="15.9"
                        stroke={seg.color}
                        strokeWidth="4"
                        strokeDasharray={dashArray}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
                      />
                    );
                    acc.offset += seg.percent;
                    return acc;
                  }, { circles: [], offset: 0 }).circles
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold font-headline text-primary">{clientRevenue.uniqueClients}</span>
                <span className="text-[10px] uppercase font-bold text-outline tracking-wider">
                  {clientRevenue.uniqueClients === 1 ? 'Client' : 'Clients'}
                </span>
              </div>
            </div>
            <div className="w-full space-y-3">
              {clientRevenue.segments.map((seg, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }}></div>
                    <span className="text-xs font-medium text-on-surface-variant">{seg.name}</span>
                  </div>
                  <span className="text-xs font-bold text-primary">{seg.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-sm overflow-hidden relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-headline font-extrabold text-primary">Route Profitability</h3>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-secondary bg-secondary-container px-3 py-1 rounded-full">
                {(() => {
                  const routeMap = {};
                  trips.filter(t => t.status === 'completed').forEach(t => {
                    const key = `${t.origin}→${t.destination}`;
                    routeMap[key] = true;
                  });
                  return Object.keys(routeMap).length;
                })()} Routes
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {(() => {
              // Aggregate completed trips by route
              const routeMap = {};
              trips.filter(t => t.status === 'completed').forEach(t => {
                const key = `${t.origin}→${t.destination}`;
                if (!routeMap[key]) routeMap[key] = { origin: t.origin, destination: t.destination, trips: [] };
                routeMap[key].trips.push(t);
              });

              // Calculate aggregate profitability per route
              const routes = Object.values(routeMap).map(r => {
                let totalIncome = 0, totalExpenses = 0;
                r.trips.forEach(t => {
                  const prof = getTripProfitability(t, income, expenses);
                  totalIncome += prof.income;
                  totalExpenses += prof.expenses;
                });
                const profit = totalIncome - totalExpenses;
                const margin = totalIncome > 0 ? Math.round((profit / totalIncome) * 100) : 0;
                return { ...r, totalIncome, totalExpenses, profit, margin, tripCount: r.trips.length };
              });

              // Sort by profit descending, show top 5
              routes.sort((a, b) => b.profit - a.profit);
              const topRoutes = routes.slice(0, 5);
              const barColors = ['bg-primary', 'bg-secondary', 'bg-primary-container', 'bg-primary/70', 'bg-secondary/70'];

              if (topRoutes.length === 0) {
                return <p className="text-sm text-outline">No completed routes found.</p>;
              }

              return topRoutes.map((r, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary uppercase">
                        {r.origin.slice(0, 3)} → {r.destination.slice(0, 3)}
                      </span>
                      <span className="text-[10px] font-medium text-outline bg-surface-container-high px-1.5 py-0.5 rounded">
                        {r.tripCount} trip{r.tripCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-primary">{formatCurrency(r.profit)} ({r.margin}%)</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`${barColors[idx % barColors.length]} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(r.margin, 0)}%` }}
                    ></div>
                  </div>
                </div>
              ));
            })()}
          </div>

          <div className="mt-8 pt-6 border-t border-outline-variant/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">history</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Last Audit</p>
                <p className="text-sm font-bold text-primary">{new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</p>
              </div>
            </div>
            <button className="text-primary text-xs font-bold underline decoration-secondary underline-offset-4">View All Reports</button>
          </div>
        </div>
      </div>
    </>
  );
}
