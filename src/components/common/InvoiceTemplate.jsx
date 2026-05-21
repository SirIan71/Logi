/**
 * InvoiceTemplate — A printable invoice component matching SIRIAN system design.
 * Opens in a new window for printing/PDF export.
 */
import logoUrl from '../../assets/logo.png';
import { formatCurrency, formatDate, formatNumber } from '../../utils/helpers';

/**
 * Render an invoice into a new print window.
 * @param {Object} invoice - The income record
 * @param {Object} client - The client object
 * @param {Array} tripDetails - Array of trip objects for this invoice
 * @param {Object} options - { companyName, companyAddress, companyPhone, companyEmail }
 */
export function printInvoice(invoice, client, tripDetails, options = {}) {
  const {
    companyName = 'Kinetic Cargo',
    companyTagline = 'LOGISTICS OS',
    companyAddress = 'P.O Box 12345-00100, Nairobi, Kenya',
    companyPhone = '+254 700 000 000',
    companyEmail = 'accounts@kineticcargo.co.ke',
    companyPin = 'P051234567A',
  } = options;

  const rateTypeLabel = client?.rate_type === 'per_ton' ? 'Per Ton' : 'Per Trip';
  const rateAmount = client?.rate_amount || 0;
  const invoiceMonth = invoice.invoice_month
    ? new Date(invoice.invoice_month + '-01').toLocaleDateString('en-UK', { month: 'long', year: 'numeric' })
    : '—';

  // Build line items from trip details
  const lineItems = (tripDetails || invoice.trip_details || []).map((t, idx) => {
    let qty, unit, unitPrice, lineTotal;
    if (client?.rate_type === 'per_ton') {
      qty = t.cargo_weight_tons || 0;
      unit = 'Tons';
      unitPrice = rateAmount;
      lineTotal = qty * unitPrice;
    } else {
      qty = 1;
      unit = 'Trip';
      unitPrice = rateAmount;
      lineTotal = unitPrice;
    }
    return {
      no: idx + 1,
      description: `${t.origin} → ${t.destination} (${t.cargo_type || 'Cargo'})`,
      date: t.departure_date,
      qty,
      unit,
      unitPrice,
      lineTotal,
    };
  });

  const subtotal = lineItems.reduce((s, li) => s + li.lineTotal, 0);
  const vat = 0; // VAT exempt or adjust as needed
  const total = invoice.amount || subtotal + vat;
  const amountPaid = invoice.amount_paid || 0;
  const balance = total - amountPaid;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoice_number}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --primary: #003539;
      --primary-container: #084D53;
      --secondary: #516600;
      --secondary-fixed: #C8E64C;
      --surface: #F7FAF9;
      --surface-container: #EBEEED;
      --on-surface: #181C1C;
      --on-surface-variant: #404849;
      --outline: #70797A;
      --outline-variant: #BFC8C9;
      --error: #BA1A1A;
      --success: #16A34A;
      --warning: #F59E0B;
    }

    @page {
      size: A4;
      margin: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--on-surface);
      background: white;
      font-size: 12px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .invoice-page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 32px 40px;
      background: white;
      position: relative;
    }

    /* ── Header ── */
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 3px solid var(--primary);
    }

    .company-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .company-logo {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      object-fit: contain;
    }

    .company-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 26px;
      font-weight: 900;
      color: var(--primary);
      letter-spacing: 1px;
      line-height: 1.1;
    }

    .company-tagline {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 3px;
      color: var(--secondary);
      text-transform: uppercase;
      margin-top: 2px;
    }

    .invoice-title-block {
      text-align: right;
    }

    .invoice-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 36px;
      font-weight: 900;
      color: var(--primary);
      letter-spacing: 2px;
      line-height: 1;
    }

    .invoice-number {
      font-size: 14px;
      font-weight: 700;
      color: var(--primary-container);
      margin-top: 4px;
    }

    .invoice-status {
      display: inline-block;
      padding: 4px 16px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 8px;
    }

    .status-unpaid { background: #FEF3C7; color: #92400E; }
    .status-paid { background: #DCFCE7; color: #166534; }
    .status-partially_paid { background: #FEF3C7; color: #92400E; }

    /* ── Info Grid ── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 36px;
    }

    .info-block {}

    .info-block-label {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--outline);
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--outline-variant);
    }

    .info-block-content {
      font-size: 12px;
      color: var(--on-surface);
      line-height: 1.7;
    }

    .info-block-content strong {
      font-weight: 700;
      color: var(--primary);
      font-size: 14px;
    }

    /* ── Invoice Meta ── */
    .invoice-meta {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
      padding: 16px 20px;
      background: var(--surface);
      border-radius: 12px;
      border: 1px solid var(--outline-variant);
    }

    .meta-item {}

    .meta-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--outline);
      margin-bottom: 2px;
    }

    .meta-value {
      font-size: 13px;
      font-weight: 600;
      color: var(--on-surface);
    }

    /* ── Table ── */
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    .invoice-table thead {
      background: var(--primary);
    }

    .invoice-table th {
      padding: 10px 14px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: white;
      border: none;
    }

    .invoice-table th:last-child,
    .invoice-table td:last-child {
      text-align: right;
    }

    .invoice-table td {
      padding: 10px 14px;
      font-size: 11.5px;
      border-bottom: 1px solid var(--outline-variant);
      color: var(--on-surface-variant);
    }

    .invoice-table tbody tr:nth-child(even) {
      background: #F7FAF905;
    }

    .invoice-table tbody tr:last-child td {
      border-bottom: 2px solid var(--primary);
    }

    .td-numeric {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }

    /* ── Totals ── */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 36px;
    }

    .totals-table {
      width: 280px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 12px;
      color: var(--on-surface-variant);
    }

    .totals-row.subtotal {
      border-bottom: 1px solid var(--outline-variant);
    }

    .totals-row.total {
      border-top: 2px solid var(--primary);
      padding-top: 12px;
      margin-top: 4px;
    }

    .totals-row.total .totals-label,
    .totals-row.total .totals-value {
      font-size: 18px;
      font-weight: 800;
      color: var(--primary);
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .totals-row.balance {
      background: var(--primary);
      color: white;
      padding: 10px 14px;
      border-radius: 8px;
      margin-top: 8px;
    }

    .totals-row.balance .totals-label,
    .totals-row.balance .totals-value {
      font-weight: 700;
      font-size: 14px;
      color: white;
    }

    .totals-label { font-weight: 500; }
    .totals-value { font-weight: 700; }

    /* ── Notes & Footer ── */
    .invoice-notes {
      margin-bottom: 32px;
      padding: 16px 20px;
      background: var(--surface);
      border-radius: 10px;
      border-left: 4px solid var(--secondary);
    }

    .invoice-notes-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--secondary);
      margin-bottom: 6px;
    }

    .invoice-notes-text {
      font-size: 11px;
      color: var(--on-surface-variant);
      line-height: 1.6;
    }

    .invoice-footer {
      position: absolute;
      bottom: 32px;
      left: 40px;
      right: 40px;
      text-align: center;
      padding-top: 16px;
      border-top: 1px solid var(--outline-variant);
    }

    .footer-text {
      font-size: 10px;
      color: var(--outline);
      line-height: 1.6;
    }

    .footer-brand {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 800;
      color: var(--primary);
      font-size: 11px;
    }

    /* ── Print styles ── */
    @media print {
      body { background: white; }
      .invoice-page { 
        width: 100%;
        padding: 20mm 15mm;
        margin: 0;
      }
      .no-print { display: none !important; }
    }

    /* ── Print button (hidden on print) ── */
    .print-toolbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: var(--primary);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    }

    .print-toolbar-text {
      color: white;
      font-size: 14px;
      font-weight: 600;
    }

    .print-btn {
      padding: 8px 24px;
      background: var(--secondary-fixed);
      color: var(--primary);
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .print-btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="print-toolbar no-print">
    <span class="print-toolbar-text">Invoice Preview — ${invoice.invoice_number}</span>
    <div style="display:flex;gap:8px">
      <button class="print-btn" onclick="window.print()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Print / Save PDF
      </button>
      <button class="print-btn" style="background:#BFC8C9;color:#003539" onclick="window.close()">Close</button>
    </div>
  </div>

  <div style="margin-top: 56px" class="no-print"></div>

  <div class="invoice-page">
    <!-- Header -->
    <div class="invoice-header">
      <div class="company-info">
        <img src="${logoUrl}" alt="Logo" class="company-logo" />
        <div>
          <div class="company-name">${companyName}</div>
          <div class="company-tagline">${companyTagline}</div>
        </div>
      </div>
      <div class="invoice-title-block">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">${invoice.invoice_number}</div>
        <div class="invoice-status status-${invoice.payment_status}">
          ${(invoice.payment_status || 'unpaid').replace(/_/g, ' ')}
        </div>
      </div>
    </div>

    <!-- Addresses -->
    <div class="info-grid">
      <div class="info-block">
        <div class="info-block-label">From</div>
        <div class="info-block-content">
          <strong>${companyName}</strong><br>
          ${companyAddress}<br>
          Tel: ${companyPhone}<br>
          Email: ${companyEmail}<br>
          KRA PIN: ${companyPin}
        </div>
      </div>
      <div class="info-block">
        <div class="info-block-label">Bill To</div>
        <div class="info-block-content">
          <strong>${client?.company_name || '—'}</strong><br>
          ${client?.address || '—'}<br>
          Contact: ${client?.contact_person || '—'}<br>
          Email: ${client?.email || '—'}<br>
          Phone: ${client?.phone || '—'}
        </div>
      </div>
    </div>

    <!-- Invoice Meta -->
    <div class="invoice-meta">
      <div class="meta-item">
        <div class="meta-label">Invoice Date</div>
        <div class="meta-value">${new Date(invoice.generated_at || new Date()).toLocaleDateString('en-UK', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Due Date</div>
        <div class="meta-value">${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-UK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Period</div>
        <div class="meta-value">${invoiceMonth}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Rate</div>
        <div class="meta-value">KES ${rateAmount.toLocaleString()} ${rateTypeLabel}</div>
      </div>
    </div>

    <!-- Line Items -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th style="width:30px">#</th>
          <th>Description</th>
          <th>Date</th>
          <th>Qty</th>
          <th>Unit</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems.map(li => `
          <tr>
            <td>${li.no}</td>
            <td>${li.description}</td>
            <td>${li.date ? new Date(li.date).toLocaleDateString('en-UK', { day: '2-digit', month: 'short' }) : '—'}</td>
            <td class="td-numeric">${typeof li.qty === 'number' ? li.qty.toLocaleString('en-UK', { maximumFractionDigits: 1 }) : li.qty}</td>
            <td>${li.unit}</td>
            <td class="td-numeric">KES ${li.unitPrice.toLocaleString()}</td>
            <td class="td-numeric">KES ${li.lineTotal.toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-table">
        <div class="totals-row subtotal">
          <span class="totals-label">Subtotal</span>
          <span class="totals-value">KES ${subtotal.toLocaleString()}</span>
        </div>
        <div class="totals-row">
          <span class="totals-label">VAT (0%)</span>
          <span class="totals-value">KES ${vat.toLocaleString()}</span>
        </div>
        <div class="totals-row total">
          <span class="totals-label">Total</span>
          <span class="totals-value">KES ${total.toLocaleString()}</span>
        </div>
        ${amountPaid > 0 ? `
        <div class="totals-row">
          <span class="totals-label">Paid</span>
          <span class="totals-value" style="color:var(--success)">- KES ${amountPaid.toLocaleString()}</span>
        </div>
        ` : ''}
        <div class="totals-row balance">
          <span class="totals-label">Balance Due</span>
          <span class="totals-value">KES ${balance.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div class="invoice-notes">
      <div class="invoice-notes-title">Payment Terms</div>
      <div class="invoice-notes-text">
        Payment is due within ${client?.payment_terms_days || 30} days of the invoice date.<br>
        Please reference <strong>${invoice.invoice_number}</strong> on all payments.<br>
        ${invoice.notes ? `<br>Note: ${invoice.notes}` : ''}
      </div>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <div class="footer-text">
        <span class="footer-brand">${companyName}</span> • ${companyAddress} • ${companyPhone} • ${companyEmail}
      </div>
      <div class="footer-text" style="margin-top:4px">
        This is a computer-generated invoice. Thank you for your business.
      </div>
    </div>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=1100');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * InvoicePreview component for use within modals.
 * Renders a compact preview of the invoice.
 */
export default function InvoicePreview({ invoice, client, tripDetails }) {
  const rateTypeLabel = client?.rate_type === 'per_ton' ? 'Per Ton' : 'Per Trip';
  const rateAmount = client?.rate_amount || 0;
  const trips = tripDetails || invoice?.trip_details || [];

  const lineItems = trips.map((t, idx) => {
    let qty, lineTotal;
    if (client?.rate_type === 'per_ton') {
      qty = t.cargo_weight_tons || 0;
      lineTotal = qty * rateAmount;
    } else {
      qty = 1;
      lineTotal = rateAmount;
    }
    return { no: idx + 1, route: `${t.origin} → ${t.destination}`, cargo: t.cargo_type, qty, lineTotal };
  });

  const total = invoice?.amount || lineItems.reduce((s, li) => s + li.lineTotal, 0);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#003539' }}>{invoice?.invoice_number}</div>
          <div style={{ fontSize: 12, color: '#70797A' }}>
            {invoice?.invoice_month
              ? new Date(invoice.invoice_month + '-01').toLocaleDateString('en-UK', { month: 'long', year: 'numeric' })
              : '—'}
          </div>
        </div>
        <div style={{
          padding: '4px 12px', borderRadius: 16, fontSize: 11, fontWeight: 700,
          background: invoice?.payment_status === 'paid' ? '#DCFCE7' : '#FEF3C7',
          color: invoice?.payment_status === 'paid' ? '#166534' : '#92400E',
        }}>
          {(invoice?.payment_status || 'unpaid').replace(/_/g, ' ').toUpperCase()}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#70797A', textTransform: 'uppercase', letterSpacing: 1 }}>Client</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{client?.company_name || '—'}</div>
        <div style={{ fontSize: 12, color: '#404849' }}>Rate: KES {formatNumber(rateAmount)} {rateTypeLabel}</div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 12 }}>
        <thead>
          <tr style={{ background: '#003539', color: 'white' }}>
            <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700 }}>#</th>
            <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700 }}>Route</th>
            <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700 }}>Qty</th>
            <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map(li => (
            <tr key={li.no} style={{ borderBottom: '1px solid #BFC8C9' }}>
              <td style={{ padding: '6px 10px' }}>{li.no}</td>
              <td style={{ padding: '6px 10px' }}>{li.route}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>
                {client?.rate_type === 'per_ton' ? `${li.qty}t` : li.qty}
              </td>
              <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>
                {formatCurrency(li.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{
        display: 'flex', justifyContent: 'space-between', padding: '10px 14px',
        background: '#003539', color: 'white', borderRadius: 8, fontWeight: 800, fontSize: 16,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
