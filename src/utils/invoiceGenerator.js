/**
 * Invoice generation utility.
 * Generates invoices for completed months where all client trips are completed.
 */
import { generateId } from './helpers';

/**
 * Check which months have ended and all trips completed for each client.
 * Returns a list of { client_id, month } pairs that are ready for invoicing.
 */
export function getInvoiceableMonths(trips, income, clients) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Collect invoiced trip IDs & client-month combinations from existing income database records
  const existingInvoices = new Set();
  const invoicedTripIds = new Set();

  (income || []).forEach(i => {
    if (i.invoice_month && i.client_id) {
      existingInvoices.add(`${i.client_id}::${i.invoice_month}`);
    }
    if (i.trip_id) {
      invoicedTripIds.add(i.trip_id);
    }
    if (Array.isArray(i.trip_details)) {
      i.trip_details.forEach(td => {
        if (td.id) invoicedTripIds.add(td.id);
        if (td.trip_id) invoicedTripIds.add(td.trip_id);
      });
    }
  });

  // Group completed trips by client + month (skipping already invoiced trips)
  const clientMonths = {};
  trips.forEach(t => {
    if (!t.client_id || !t.departure_date) return;
    if (invoicedTripIds.has(t.id) || invoicedTripIds.has(t.trip_id)) return;

    const month = t.departure_date.substring(0, 7); // "YYYY-MM"
    if (month >= currentMonth) return;
    const key = `${t.client_id}::${month}`;
    if (!clientMonths[key]) clientMonths[key] = { client_id: t.client_id, month, trips: [], allCompleted: true };
    clientMonths[key].trips.push(t);
    if (t.status !== 'completed') clientMonths[key].allCompleted = false;
  });

  // Filter: only months where ALL trips are completed
  const ready = Object.values(clientMonths).filter(cm => cm.allCompleted && cm.trips.length > 0);

  return ready.filter(cm => !existingInvoices.has(`${cm.client_id}::${cm.month}`));
}

/**
 * Generate invoice records for the given invoiceable months.
 * Accumulates freight trip rates and attaches redeemable expenses.
 */
export function generateInvoices(invoiceableMonths, clients, existingIncomeCount, expenses = [], expenseCategories = []) {
  const year = new Date().getFullYear();
  let counter = existingIncomeCount;

  return invoiceableMonths.map(cm => {
    counter++;
    const client = clients.find(c => c.id === cm.client_id);
    if (!client) return null;

    // Calculate freight amount based on client rate
    let freightAmount = 0;
    if (client.rate_type === 'per_ton') {
      freightAmount = cm.trips.reduce((s, t) => s + (Number(t.cargo_weight_tons) || 0), 0) * (Number(client.rate_amount) || 0);
    } else {
      freightAmount = cm.trips.length * (Number(client.rate_amount) || 0);
    }

    // Identify redeemable expenses linked to these trips
    const tripIds = new Set(cm.trips.map(t => t.id || t.trip_id));
    const redeemableList = (expenses || []).filter(e => e.is_redeemable && e.trip_id && tripIds.has(e.trip_id));
    const redeemableTotal = redeemableList.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const totalAmount = freightAmount + redeemableTotal;

    // Due date: payment_terms_days after month end
    const [y, m] = cm.month.split('-').map(Number);
    const monthEnd = new Date(y, m, 0); // Last day of month m in year y
    const dueDate = new Date(monthEnd);
    dueDate.setDate(dueDate.getDate() + (client.payment_terms_days || 30));

    const monthLabel = new Date(y, m - 1, 1).toLocaleDateString('en-UK', { month: 'long', year: 'numeric' });

    return {
      id: generateId('i'),
      client_id: cm.client_id,
      trip_id: null,
      invoice_number: `INV-${year}-${String(counter).padStart(3, '0')}`,
      invoice_month: cm.month,
      amount: totalAmount,
      freight_amount: freightAmount,
      redeemable_amount: redeemableTotal,
      amount_paid: 0,
      payment_status: 'unpaid',
      payment_date: null,
      due_date: dueDate.toISOString().split('T')[0],
      notes: `Auto-generated invoice for ${cm.trips.length} trip(s) in ${monthLabel}${redeemableTotal > 0 ? ` (Includes KES ${redeemableTotal.toLocaleString()} redeemable expenses)` : ''}`,
      created_at: new Date().toISOString(),
      generated_at: new Date().toISOString(),
      trip_details: cm.trips.map(t => ({
        trip_id: t.id || t.trip_id,
        origin: t.origin,
        destination: t.destination,
        cargo_type: t.cargo_type,
        cargo_weight_tons: t.cargo_weight_tons,
        departure_date: t.departure_date,
      })),
      redeemable_details: redeemableList.map(e => {
        const cat = (expenseCategories || []).find(c => c.id === e.category_id);
        return {
          id: e.id,
          category_name: cat ? cat.name : (e.notes || 'Reimbursable Expense'),
          amount: e.amount,
          notes: e.notes,
          expense_date: e.expense_date,
          trip_id: e.trip_id,
        };
      }),
    };
  }).filter(Boolean);
}
