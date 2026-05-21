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

  // Group completed trips by client + month
  const clientMonths = {};
  trips.forEach(t => {
    if (!t.client_id || !t.departure_date) return;
    const month = t.departure_date.substring(0, 7); // "YYYY-MM"
    // Only consider months that have ended (before current month)
    if (month >= currentMonth) return;
    const key = `${t.client_id}::${month}`;
    if (!clientMonths[key]) clientMonths[key] = { client_id: t.client_id, month, trips: [], allCompleted: true };
    clientMonths[key].trips.push(t);
    if (t.status !== 'completed') clientMonths[key].allCompleted = false;
  });

  // Filter: only months where ALL trips are completed
  const ready = Object.values(clientMonths).filter(cm => cm.allCompleted && cm.trips.length > 0);

  // Exclude already-invoiced client+month combinations
  const existingInvoices = new Set();
  income.forEach(i => {
    if (i.invoice_month && i.client_id) {
      existingInvoices.add(`${i.client_id}::${i.invoice_month}`);
    }
  });

  return ready.filter(cm => !existingInvoices.has(`${cm.client_id}::${cm.month}`));
}

/**
 * Generate invoice records for the given invoiceable months.
 */
export function generateInvoices(invoiceableMonths, clients, existingIncomeCount) {
  const year = new Date().getFullYear();
  let counter = existingIncomeCount;

  return invoiceableMonths.map(cm => {
    counter++;
    const client = clients.find(c => c.id === cm.client_id);
    if (!client) return null;

    // Calculate amount based on client rate
    let amount = 0;
    if (client.rate_type === 'per_ton') {
      amount = cm.trips.reduce((s, t) => s + (t.cargo_weight_tons || 0), 0) * (client.rate_amount || 0);
    } else {
      amount = cm.trips.length * (client.rate_amount || 0);
    }

    // Due date: payment_terms_days after month end
    const monthEnd = new Date(cm.month + '-01');
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0); // Last day of the invoice month
    const dueDate = new Date(monthEnd);
    dueDate.setDate(dueDate.getDate() + (client.payment_terms_days || 30));

    return {
      id: generateId('i'),
      client_id: cm.client_id,
      trip_id: null,
      invoice_number: `INV-${year}-${String(counter).padStart(3, '0')}`,
      invoice_month: cm.month,
      amount,
      amount_paid: 0,
      payment_status: 'unpaid',
      payment_date: null,
      due_date: dueDate.toISOString().split('T')[0],
      notes: `Auto-generated invoice for ${cm.trips.length} trip(s) in ${new Date(cm.month + '-01').toLocaleDateString('en-UK', { month: 'long', year: 'numeric' })}`,
      generated_at: new Date().toISOString(),
      trip_details: cm.trips.map(t => ({
        trip_id: t.id,
        origin: t.origin,
        destination: t.destination,
        cargo_type: t.cargo_type,
        cargo_weight_tons: t.cargo_weight_tons,
        departure_date: t.departure_date,
      })),
    };
  }).filter(Boolean);
}
