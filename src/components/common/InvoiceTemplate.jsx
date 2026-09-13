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
 * @param {Object} options - { companyName, companyAddress, companyPhone, companyEmail, redeemableExpenses }
 */
export function printInvoice(invoice, client, tripDetails, options = {}) {
  const {
    companyName = 'Nory Logistics Ltd',
    companyTagline = 'LOGISTICS LTD',
    companyAddress = 'P.O Box 166-20406, Sotik, Kenya',
    companyPhone = '+254 717357535',
    companyEmail = 'accounts@norylogistics.co.ke',
    companyPin = 'P051234567A',
  } = options;

  let paymentSettings = {};
  try {
    const saved = localStorage.getItem('sirian_payment_info');
    if (saved) paymentSettings = JSON.parse(saved);
  } catch (e) {
    // ignore
  }

  const bankName = paymentSettings.bankName || 'I&M Bank Kenya';
  const bankAccountName = paymentSettings.bankAccountName || 'Nory Logistics Ltd';
  const bankAccountNumber = paymentSettings.bankAccountNumber || '0112 3948 5710 92';
  const branch = paymentSettings.branch || 'Nairobi Main Branch';
  const swiftCode = paymentSettings.swiftCode || 'EQBLKENN';
  const mpesaPaybill = paymentSettings.mpesaPaybill || '542542';
  const mpesaAccount = paymentSettings.mpesaAccount || 'NORY LOGISTICS';

  const rateTypeLabel = client?.rate_type === 'per_ton' ? 'Per Ton' : 'Per Trip';
  const rateAmount = client?.rate_amount || 0;
  const formatInvoiceMonth = (mStr) => {
    if (!mStr) return '—';
    if (typeof mStr === 'string' && mStr.includes('-')) {
      const [y, m] = mStr.split('-').map(Number);
      if (y && m) return new Date(y, m - 1, 1).toLocaleDateString('en-UK', { month: 'long', year: 'numeric' });
    }
    return mStr;
  };
  const invoiceMonth = formatInvoiceMonth(invoice.invoice_month);

  // Group trips by Cargo Type to form categories without route names (e.g. "Trips: 20 (Cargo)")
  const rawTrips = tripDetails || invoice.trip_details || [];
  const categorizedMap = {};

  rawTrips.forEach((t) => {
    const cargoType = t.cargo_type || 'Freight Services';
    const key = cargoType;

    if (!categorizedMap[key]) {
      categorizedMap[key] = {
        category: key,
        cargoType,
        tripCount: 0,
        totalTons: 0,
      };
    }
    categorizedMap[key].tripCount += 1;
    categorizedMap[key].totalTons += (Number(t.cargo_weight_tons) || 0);
  });

  const freightLineItems = Object.values(categorizedMap).map((g, idx) => {
    let qty, unit, unitPrice, lineTotal;
    if (client?.rate_type === 'per_ton') {
      qty = g.totalTons;
      unit = 'Tons';
      unitPrice = rateAmount;
      lineTotal = qty * unitPrice;
    } else {
      qty = g.tripCount;
      unit = 'Trips';
      unitPrice = rateAmount;
      lineTotal = qty * unitPrice;
    }
    return {
      no: idx + 1,
      description: `Trips: ${g.tripCount}${g.cargoType ? ` (${g.cargoType})` : ''}`,
      tripCount: g.tripCount,
      totalTons: g.totalTons,
      qty,
      unit,
      unitPrice,
      lineTotal,
    };
  });

  const totalTripCount = freightLineItems.reduce((s, li) => s + li.tripCount, 0);
  const freightSubtotal = freightLineItems.reduce((s, li) => s + li.lineTotal, 0);

  // Redeemable Items (Carwash, Tolls, Offloading, etc.)
  const redeemableItems = invoice.redeemable_details || options.redeemableExpenses || [];
  const redeemableSubtotal = redeemableItems.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const vat = 0;
  const total = invoice.amount || (freightSubtotal + redeemableSubtotal);
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
      background: #EAF0F0;
      padding: 24px 0;
      display: flex;
      justify-content: center;
    }

    .invoice-card {
      width: 210mm;
      min-height: 297mm;
      background: white;
      padding: 32px 36px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    @media print {
      body { background: white; padding: 0; }
      .invoice-card { box-shadow: none; width: 100%; min-height: 100vh; padding: 24px 28px; }
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 16px;
      margin-bottom: 20px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-logo {
      height: 48px;
      width: auto;
      object-fit: contain;
    }

    .brand-name {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 22px;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: -0.5px;
    }

    .brand-tagline {
      font-size: 10px;
      font-weight: 700;
      color: var(--on-surface-variant);
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .invoice-title-block {
      text-align: right;
    }

    .invoice-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 26px;
      font-weight: 900;
      color: var(--primary);
      letter-spacing: -1px;
    }

    .invoice-number {
      font-size: 13px;
      font-weight: 700;
      color: var(--on-surface-variant);
    }

    .invoice-status {
      display: inline-block;
      margin-top: 4px;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-paid { background: #DCFCE7; color: #166534; }
    .status-partially_paid { background: #FEF3C7; color: #92400E; }
    .status-unpaid { background: #FEE2E2; color: #991B1B; }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 20px;
    }

    .info-block-label {
      font-size: 10px;
      font-weight: 800;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }

    .info-block-content {
      font-size: 12px;
      line-height: 1.5;
      color: var(--on-surface);
    }

    .invoice-meta {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: var(--surface);
      border: 1px solid var(--outline-variant);
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }

    .meta-item { text-align: center; }
    .meta-label { font-size: 9px; font-weight: 700; color: var(--on-surface-variant); text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-value { font-size: 12px; font-weight: 700; color: var(--primary); margin-top: 2px; }

    .section-heading {
      font-size: 11px;
      font-weight: 800;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 8px;
    }

    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }

    .invoice-table th {
      background: var(--primary);
      color: white;
      padding: 8px 12px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .invoice-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--surface-container);
    }

    .invoice-table tr:nth-child(even) td {
      background: #FAFCFC;
    }

    .td-numeric { text-align: right; }

    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }

    .totals-table {
      width: 340px;
      border-collapse: collapse;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
    }

    .totals-row.subtotal { border-top: 1px solid var(--outline-variant); }
    .totals-row.total {
      border-top: 2px solid var(--primary);
      font-weight: 800;
      font-size: 14px;
      color: var(--primary);
      padding: 8px 0;
    }
    .totals-row.balance {
      background: var(--primary);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 14px;
      margin-top: 6px;
    }

    .payment-box {
      margin-top: 16px;
      padding: 14px 18px;
      border-radius: 8px;
      background: #F0F9FA;
      border: 1.5px solid #003539;
    }
    .payment-box-title {
      font-weight: 800;
      font-size: 12px;
      color: #003539;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .payment-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      font-size: 11.5px;
      color: #181C1C;
    }
    .payment-sub {
      font-weight: 700;
      color: #084D53;
      margin-bottom: 3px;
    }

    .invoice-notes {
      margin-top: 16px;
      padding: 12px 16px;
      background: var(--surface);
      border-left: 3px solid var(--primary);
      border-radius: 0 6px 6px 0;
      font-size: 11px;
    }

    .invoice-notes-title {
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 4px;
    }

    .invoice-notes-text { color: var(--on-surface-variant); line-height: 1.4; }

    .invoice-footer {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid var(--outline-variant);
      text-align: center;
      font-size: 10px;
      color: var(--outline);
    }

    .footer-brand { font-weight: 700; color: var(--primary); }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div>
      <!-- Header -->
      <div class="invoice-header">
        <div class="brand">
          <img src="${logoUrl}" alt="${companyName} Logo" class="brand-logo" onerror="this.style.display='none'">
          <div>
            <div class="brand-name">${companyName}</div>
            <div class="brand-tagline">${companyTagline}</div>
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
          <div class="meta-label">Client Rate</div>
          <div class="meta-value">KES ${rateAmount.toLocaleString()} ${rateTypeLabel}</div>
        </div>
      </div>

      <!-- Freight Categorized Line Items -->
      <div class="section-heading">Freight Services Breakdown (Total Trips: ${totalTripCount})</div>
      <table class="invoice-table">
        <thead>
          <tr>
            <th style="width:30px">#</th>
            <th>Description</th>
            <th class="td-numeric">Total Trips</th>
            <th class="td-numeric">Billable Qty</th>
            <th>Unit</th>
            <th class="td-numeric">Unit Rate</th>
            <th class="td-numeric">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${freightLineItems.map(li => `
            <tr>
              <td>${li.no}</td>
              <td><strong>${li.description}</strong></td>
              <td class="td-numeric"><strong>${li.tripCount}</strong></td>
              <td class="td-numeric">${typeof li.qty === 'number' ? li.qty.toLocaleString('en-UK', { maximumFractionDigits: 1 }) : li.qty}</td>
              <td>${li.unit}</td>
              <td class="td-numeric">KES ${li.unitPrice.toLocaleString()}</td>
              <td class="td-numeric"><strong>KES ${li.lineTotal.toLocaleString()}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${redeemableItems.length > 0 ? `
      <!-- Redeemable Items Table (Carwash, Tolls, etc.) -->
      <div class="section-heading" style="color: #516600; margin-top: 14px;">Redeemable Items (Carwash, Tolls & Reimbursables)</div>
      <table class="invoice-table">
        <thead>
          <tr style="background: #516600;">
            <th style="width:30px">#</th>
            <th>Redeemable Expense Item</th>
            <th>Date</th>
            <th>Notes / Reference</th>
            <th class="td-numeric">Amount Redeemable</th>
          </tr>
        </thead>
        <tbody>
          ${redeemableItems.map((r, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${r.category_name || r.notes || 'Carwash / Redeemable Item'}</strong></td>
              <td>${r.expense_date ? new Date(r.expense_date).toLocaleDateString('en-UK', { day: '2-digit', month: 'short' }) : '—'}</td>
              <td>${r.notes || 'Trip expense'}</td>
              <td class="td-numeric"><strong>KES ${(Number(r.amount) || 0).toLocaleString()}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      <!-- Totals Summary & Calculations -->
      <div class="totals-section">
        <div class="totals-table">
          <div class="totals-row subtotal">
            <span class="totals-label">Freight Subtotal (Trips: ${totalTripCount})</span>
            <span class="totals-value">KES ${freightSubtotal.toLocaleString()}</span>
          </div>
          ${redeemableSubtotal > 0 ? `
          <div class="totals-row">
            <span class="totals-label">Redeemable Items Subtotal</span>
            <span class="totals-value" style="color:#516600;font-weight:700;">+ KES ${redeemableSubtotal.toLocaleString()}</span>
          </div>
          ` : ''}
          <div class="totals-row">
            <span class="totals-label">VAT (0%)</span>
            <span class="totals-value">KES 0</span>
          </div>
          <div class="totals-row total">
            <span class="totals-label">Total Invoice Amount</span>
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

      <!-- Account Payment Information -->
      <div class="payment-box">
        <div class="payment-box-title">Account Payment Information</div>
        <div class="payment-grid">
          <div>
            <div class="payment-sub">Bank Transfer / Remittance</div>
            <div><strong>Bank:</strong> ${bankName}</div>
            <div><strong>Account Name:</strong> ${bankAccountName}</div>
            <div><strong>Account No:</strong> <span style="font-family:monospace;font-weight:700;color:#003539;">${bankAccountNumber}</span></div>
            <div><strong>Branch:</strong> ${branch} ${swiftCode ? `(SWIFT: ${swiftCode})` : ''}</div>
          </div>
          <div>
            <div class="payment-sub">Mobile Payment (M-Pesa)</div>
            <div><strong>Paybill:</strong> <span style="font-family:monospace;font-weight:700;color:#003539;">${mpesaPaybill}</span></div>
            <div><strong>Account:</strong> ${mpesaAccount}</div>
            <div style="margin-top:4px;font-size:10px;color:#404849;">* Use invoice <strong>${invoice.invoice_number}</strong> as payment reference.</div>
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
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=950,height=1150');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  } else {
    alert('Pop-up blocked. Please allow pop-ups for this browser window to view/print invoices.');
  }
}

/**
 * InvoicePreview component for use within modals.
 * Renders a categorized preview of the invoice with accumulated trip counts and redeemable expenses.
 */
export default function InvoicePreview({ invoice, client, tripDetails, redeemableExpenses }) {
  const rateTypeLabel = client?.rate_type === 'per_ton' ? 'Per Ton' : 'Per Trip';
  const rateAmount = client?.rate_amount || 0;
  const rawTrips = tripDetails || invoice?.trip_details || [];

  const categorizedMap = {};
  rawTrips.forEach((t) => {
    const cargoType = t.cargo_type || 'Freight Services';
    const key = cargoType;

    if (!categorizedMap[key]) {
      categorizedMap[key] = {
        category: key,
        cargoType,
        tripCount: 0,
        totalTons: 0,
      };
    }
    categorizedMap[key].tripCount += 1;
    categorizedMap[key].totalTons += (Number(t.cargo_weight_tons) || 0);
  });

  const freightLineItems = Object.values(categorizedMap).map((g, idx) => {
    let qty, lineTotal;
    if (client?.rate_type === 'per_ton') {
      qty = g.totalTons;
      lineTotal = qty * rateAmount;
    } else {
      qty = g.tripCount;
      lineTotal = qty * rateAmount;
    }
    return {
      no: idx + 1,
      category: `Trips: ${g.tripCount}${g.cargoType ? ` (${g.cargoType})` : ''}`,
      tripCount: g.tripCount,
      totalTons: g.totalTons,
      qty,
      lineTotal,
    };
  });

  const totalTripCount = freightLineItems.reduce((s, li) => s + li.tripCount, 0);
  const freightSubtotal = freightLineItems.reduce((s, li) => s + li.lineTotal, 0);

  const redeemableItems = invoice?.redeemable_details || redeemableExpenses || [];
  const redeemableSubtotal = redeemableItems.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const total = invoice?.amount || (freightSubtotal + redeemableSubtotal);

  let paymentSettings = {};
  try {
    const saved = localStorage.getItem('sirian_payment_info');
    if (saved) paymentSettings = JSON.parse(saved);
  } catch (e) {
    // ignore
  }

  const bankName = paymentSettings.bankName || 'Equity Bank Kenya';
  const bankAccountName = paymentSettings.bankAccountName || 'Nory Logistics Ltd';
  const bankAccountNumber = paymentSettings.bankAccountNumber || '0112 3948 5710 92';
  const mpesaPaybill = paymentSettings.mpesaPaybill || '247247';
  const mpesaAccount = paymentSettings.mpesaAccount || 'NORY LOGISTICS';

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#003539' }}>{invoice?.invoice_number}</div>
          <div style={{ fontSize: 12, color: '#70797A' }}>
            {invoice?.invoice_month ? (
              invoice.invoice_month.includes('-')
                ? new Date(Number(invoice.invoice_month.split('-')[0]), Number(invoice.invoice_month.split('-')[1]) - 1, 1).toLocaleDateString('en-UK', { month: 'long', year: 'numeric' })
                : invoice.invoice_month
            ) : '—'}
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

      {/* Categorized Freight Services Table */}
      <div style={{ fontSize: 11, fontWeight: 800, color: '#003539', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
        Freight Services (Total Trips: {totalTripCount})
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 12 }}>
        <thead>
          <tr style={{ background: '#003539', color: 'white' }}>
            <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700 }}>#</th>
            <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700 }}>Description</th>
            <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700 }}>Trips</th>
            <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700 }}>Qty</th>
            <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700 }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {freightLineItems.map(li => (
            <tr key={li.no} style={{ borderBottom: '1px solid #BFC8C9' }}>
              <td style={{ padding: '6px 10px' }}>{li.no}</td>
              <td style={{ padding: '6px 10px', fontWeight: 600 }}>{li.category}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>{li.tripCount}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>
                {client?.rate_type === 'per_ton' ? `${li.qty}t` : `${li.qty} trips`}
              </td>
              <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>
                {formatCurrency(li.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Redeemable Items Table (Carwash, Tolls, etc.) */}
      {redeemableItems.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#516600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10, marginBottom: 4 }}>
            Redeemable Items (Carwash, Tolls & Reimbursables)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 12 }}>
            <thead>
              <tr style={{ background: '#516600', color: 'white' }}>
                <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700 }}>#</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700 }}>Redeemable Item</th>
                <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700 }}>Notes</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700 }}>Amount Redeemable</th>
              </tr>
            </thead>
            <tbody>
              {redeemableItems.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #BFC8C9' }}>
                  <td style={{ padding: '6px 10px' }}>{idx + 1}</td>
                  <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.category_name || r.notes || 'Carwash / Redeemable Item'}</td>
                  <td style={{ padding: '6px 10px', fontSize: 11, color: '#404849' }}>{r.notes || '—'}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#516600' }}>
                    {formatCurrency(r.amount || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Totals Summary */}
      <div style={{
        padding: '12px 14px', background: '#003539', color: 'white', borderRadius: 8, fontSize: 13,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, opacity: 0.9 }}>
          <span>Freight Subtotal (Trips: {totalTripCount})</span>
          <span>{formatCurrency(freightSubtotal)}</span>
        </div>
        {redeemableSubtotal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#C8E64C', fontWeight: 600 }}>
            <span>Redeemable Items Subtotal</span>
            <span>+ {formatCurrency(redeemableSubtotal)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, fontFamily: "'Plus Jakarta Sans', sans-serif", borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 6, marginTop: 4 }}>
          <span>Total Invoice Amount</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Account Payment Information */}
      <div style={{
        marginTop: 14, padding: '12px 14px', borderRadius: 8,
        background: '#F0F9FA', border: '1px solid #003539', fontSize: 12,
      }}>
        <div style={{ fontWeight: 800, fontSize: 11, color: '#003539', textTransform: 'uppercase', marginBottom: 6 }}>
          Account Payment Information
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#084D53' }}>Bank Transfer</div>
            <div><strong>Bank:</strong> {bankName}</div>
            <div><strong>Acc Name:</strong> {bankAccountName}</div>
            <div><strong>Acc No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{bankAccountNumber}</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#084D53' }}>Mobile Payment (M-Pesa)</div>
            <div><strong>Paybill:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{mpesaPaybill}</span></div>
            <div><strong>Account Ref:</strong> {mpesaAccount}</div>
            <div style={{ fontSize: 10, color: '#70797A', marginTop: 2 }}>* Ref: {invoice?.invoice_number}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
