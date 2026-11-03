import type { HrInvoiceDetail } from '@/types/api';

function esc(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
}

export function formatInvoiceDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

export function formatInvoiceMoney(currency: string, value: number): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatInvoiceQty(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function buildInvoiceHtml(invoice: HrInvoiceDetail): string {
  const money = (value: number) => formatInvoiceMoney(invoice.currency, value);
  const logo = invoice.logoUrl
    ? `<img src="${esc(invoice.logoUrl)}" alt="" style="display:block;max-height:72px;max-width:160px;object-fit:contain;margin:0 0 8px auto;" />`
    : '';
  const lines = invoice.lines
    .map(
      (line) => `<tr>
        <td>
          <div style="font-weight:600;">${esc(line.description)}</div>
          ${line.detail ? `<div style="color:#6b7280;margin-top:2px;">${esc(line.detail)}</div>` : ''}
        </td>
        <td style="text-align:center;">${esc(formatInvoiceQty(line.quantity))}</td>
        <td style="text-align:right;">${esc(money(line.unitPrice))}</td>
        <td style="text-align:right;">${esc(money(line.amount))}</td>
      </tr>`,
    )
    .join('');
  const addressLine = invoice.issuerAddress.replace(/\s*\n\s*/g, ', ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${esc(invoice.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #111; font-family: Arial, Helvetica, sans-serif; }
    .page { max-width: 820px; margin: 0 auto; padding: 36px 40px 28px; min-height: 1040px; display: flex; flex-direction: column; }
    h1 { margin: 0; font-size: 28px; font-weight: 500; letter-spacing: 0.04em; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
    .brand { text-align: right; }
    .brand-name { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .issuer { margin: 28px 0 22px; color: #4b5563; font-size: 12px; }
    .parties { display: flex; justify-content: space-between; gap: 32px; margin-bottom: 28px; }
    .bill h2 { margin: 0 0 8px; font-size: 12px; letter-spacing: 0.04em; }
    .bill p { margin: 0; font-size: 13px; line-height: 1.45; }
    .meta { min-width: 240px; font-size: 13px; }
    .meta div { display: flex; justify-content: space-between; gap: 24px; margin: 0 0 6px; }
    .meta span { color: #374151; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f3f4f6; text-align: left; font-size: 11px; letter-spacing: 0.04em; padding: 10px 12px; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    .totals { width: 280px; margin-left: auto; margin-top: 8px; border-collapse: collapse; }
    .totals td { border-bottom: 1px solid #e5e7eb; padding: 10px 12px; font-size: 13px; }
    .due td { background: #111; color: #fff; font-weight: 700; border: 0; }
    .sign { margin-top: 28px; text-align: right; font-size: 12px; color: #374151; }
    .script { margin: 8px 0 0; font-family: "Segoe Script", "Brush Script MT", cursive; font-size: 28px; color: #111; }
    .foot { margin-top: auto; padding-top: 28px; border-top: 1px solid #d1d5db; color: #4b5563; font-size: 11px; }
    .foot strong { color: #111; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { max-width: none; min-height: auto; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="top">
      <h1>INVOICE</h1>
      <div class="brand">
        ${logo}
        <p class="brand-name">${esc(invoice.companyName)}</p>
      </div>
    </div>
    <p class="issuer">${esc(invoice.companyName)}${addressLine ? `, ${esc(addressLine)}` : ''}</p>
    <div class="parties">
      <div class="bill">
        <h2>BILL TO</h2>
        <p><strong>${esc(invoice.clientName)}</strong></p>
        ${invoice.clientAddress ? `<p>${esc(invoice.clientAddress)}</p>` : ''}
      </div>
      <div class="meta">
        <div><span>Invoice No.:</span><strong>${esc(invoice.invoiceNumber)}</strong></div>
        <div><span>Issue date:</span><strong>${esc(formatInvoiceDate(invoice.issueDate))}</strong></div>
        <div><span>Due date:</span><strong>${esc(formatInvoiceDate(invoice.dueDate))}</strong></div>
        <div><span>Reference:</span><strong>${esc(invoice.reference || '—')}</strong></div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>DESCRIPTION</th>
          <th style="text-align:center;width:110px;">QUANTITY</th>
          <th style="text-align:right;width:140px;">UNIT PRICE (${esc(invoice.currency)})</th>
          <th style="text-align:right;width:140px;">AMOUNT (${esc(invoice.currency)})</th>
        </tr>
      </thead>
      <tbody>${lines}</tbody>
    </table>
    <table class="totals">
      <tr>
        <td>TOTAL (${esc(invoice.currency)}):</td>
        <td style="text-align:right;">${esc(money(invoice.total))}</td>
      </tr>
      <tr class="due">
        <td>TOTAL DUE (${esc(invoice.currency)})</td>
        <td style="text-align:right;">${esc(money(invoice.total))}</td>
      </tr>
    </table>
    <div class="sign">
      <div>Issued by, signature:</div>
      <p class="script">${esc(invoice.signatureName)}</p>
    </div>
    <p class="foot">${esc(invoice.companyName)}${addressLine ? `, ${esc(addressLine)}` : ''}${
      invoice.issuerEmail ? ` &nbsp; <strong>Email:</strong> ${esc(invoice.issuerEmail)}` : ''
    }</p>
  </div>
</body>
</html>`;
}

export function printInvoice(invoice: HrInvoiceDetail): boolean {
  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) return false;
  popup.document.open();
  popup.document.write(buildInvoiceHtml(invoice));
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 250);
  return true;
}
