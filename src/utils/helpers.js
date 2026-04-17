// Utility functions for SIRIAN
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatNumber = (num, decimals = 0) => {
  if (num == null) return '—';
  return new Intl.NumberFormat('en-ZA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
};

export const getStatusColor = (status) => {
  const map = {
    completed: 'var(--color-success)', paid: 'var(--color-success)', active: 'var(--color-success)', approved: 'var(--color-success)',
    in_progress: '#8b5cf6', partially_paid: '#fbbf24', pending: '#800000',
    scheduled: '#0ea5e9', maintenance: '#fbbf24',
    unpaid: 'var(--color-danger)', delayed: 'var(--color-danger)', overdue: 'var(--color-danger)', rejected: 'var(--color-danger)',
    cancelled: 'var(--color-muted)', decommissioned: 'var(--color-muted)', inactive: 'var(--color-muted)',
  };
  return map[status] || 'var(--color-muted)';
};

export const getStatusLabel = (status) => {
  return status ? status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';
};

export const generateId = (prefix = '') => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const searchFilter = (items, query, fields) => {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(item => fields.some(f => {
    const val = f.split('.').reduce((o, k) => o?.[k], item);
    return val && String(val).toLowerCase().includes(q);
  }));
};

export const exportToCSV = (data, filename, columns) => {
  const header = columns.map(c => c.label).join(',');
  const rows = data.map(row => columns.map(c => {
    const val = c.accessor(row);
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  }).join(','));
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};

export const getTripProfitability = (trip, incomeData, expensesData) => {
  const tripIncomes = incomeData.filter(i => i.trip_id === trip.id);
  const tripIncome = tripIncomes.reduce((s, i) => s + i.amount, 0);
  const tripPaid = tripIncomes.reduce((s, i) => s + (i.amount_paid || 0), 0);
  const tripExpenses = expensesData.filter(e => e.trip_id === trip.id).reduce((s, e) => s + e.amount, 0);
  const isPaid = tripIncomes.length > 0 && tripPaid >= tripIncome;
  return { income: tripIncome, expenses: tripExpenses, profit: tripIncome - tripExpenses, margin: tripIncome > 0 ? ((tripIncome - tripExpenses) / tripIncome * 100) : 0, isPaid };
};

export const daysUntil = (dateStr) => {
  if (!dateStr) return Infinity;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
