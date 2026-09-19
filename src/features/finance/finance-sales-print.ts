import type { SalesDocumentPrint } from '@/types/api';
import { formatIstDisplay } from '@/features/finance/finance-address-utils';

const DOCUMENT_TITLES: Record<SalesDocumentPrint['document']['type'], string> = {
  quote: 'Quotation',
  invoice: 'Invoice',
  delivery_note: 'Delivery note',
};

function esc(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br/>');
}

function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

function letterheadBlock(org: SalesDocumentPrint['organization']): string {
  const address = [org.addressLine1, org.addressLine2, org.city, org.stateName, org.postalCode]
    .filter(Boolean)
    .join(', ');
  const logo = org.logoUrl
    ? `<img src="${esc(org.logoUrl)}" alt="Logo" style="max-height:56px;max-width:140px;object-fit:contain;margin-bottom:8px" />`
    : '';
  return `<div style="text-align:right;font-size:11px;line-height:1.45">
    ${logo}
    <div style="font-weight:700;font-size:13px;text-transform:uppercase">${esc(org.tradeName || org.legalName)}</div>
    ${org.gstin ? `<div>GSTIN: ${esc(org.gstin)}</div>` : ''}
    ${org.cin ? `<div>CIN: ${esc(org.cin)}</div>` : ''}
    ${address ? `<div>${esc(address)}</div>` : ''}
    ${org.phone ? `<div>Phone: ${esc(org.phone)}</div>` : ''}
    ${org.email ? `<div>Email: ${esc(org.email)}</div>` : ''}
  </div>`;
}

function printQuote(payload: SalesDocumentPrint) {
  const { organization, customer, document } = payload;
  const hasCatalog = document.lines.some((line) => line.catalogNo || line.hsnSac);
  const head = hasCatalog
    ? '<tr><th>S.No</th><th>Catalog</th><th>HSN/SAC</th><th>Description</th><th>Qty</th><th>Rate</th><th>Tax</th><th>Amount</th></tr>'
    : '<tr><th>S.No</th><th>Description</th><th>Qty</th><th>Rate</th><th>Tax</th><th>Amount</th></tr>';
  const linesHtml = document.lines
    .map((line, index) => {
      const lineTotal = (line.amount ?? 0) + (line.taxAmount ?? 0);
      if (hasCatalog) {
        return `<tr>
          <td>${index + 1}</td>
          <td>${esc(line.catalogNo) || '—'}</td>
          <td>${esc(line.hsnSac) || '—'}</td>
          <td>${esc(line.description)}</td>
          <td>${line.quantity} ${esc(line.unit)}</td>
          <td>${line.rate != null ? formatInr(line.rate) : '—'}</td>
          <td>${line.taxPercent ?? 0}%</td>
          <td>${formatInr(lineTotal)}</td>
        </tr>`;
      }
      return `<tr>
        <td>${index + 1}</td>
        <td>${esc(line.description)}</td>
        <td>${line.quantity} ${esc(line.unit)}</td>
        <td>${line.rate != null ? formatInr(line.rate) : '—'}</td>
        <td>${line.taxPercent ?? 0}%</td>
        <td>${formatInr(lineTotal)}</td>
      </tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html><html><head><title>${esc(document.documentNumber)}</title>
<style>
  body{font-family:Georgia,serif;color:#111;padding:28px;max-width:900px;margin:0 auto;font-size:12px}
  h1{font-size:18px;margin:0 0 4px;letter-spacing:.04em;text-transform:uppercase;text-align:center}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th{background:#c9a227;color:#111;font-size:11px;text-transform:uppercase}
  td,th{border:1px solid #bbb;padding:6px 8px;text-align:left;vertical-align:top}
  .top{display:flex;justify-content:space-between;gap:24px;margin-bottom:18px;align-items:flex-start}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}
  .box{border:1px solid #bbb;padding:10px;min-height:80px}
  .box-title{font-weight:700;font-size:11px;text-transform:uppercase;margin-bottom:6px;color:#333}
  .totals{margin-top:16px;text-align:right;line-height:1.6}
  .terms{margin-top:20px;font-size:11px;line-height:1.5}
  @media print{body{padding:12px}}
</style></head><body>
<div class="top">
  <div>
    <h1>${DOCUMENT_TITLES.quote}</h1>
    <div style="text-align:center;color:#555;margin-top:4px">${esc(document.documentNumber)}</div>
  </div>
  ${letterheadBlock(organization)}
</div>

<table style="width:auto;margin-bottom:12px;border:none">
  <tr><td style="border:none;padding:2px 12px 2px 0"><strong>Quote date:</strong></td><td style="border:none;padding:2px 0">${esc(formatIstDisplay(document.date))}</td></tr>
  ${document.expiryDate ? `<tr><td style="border:none;padding:2px 12px 2px 0"><strong>Valid until:</strong></td><td style="border:none;padding:2px 0">${esc(formatIstDisplay(document.expiryDate))}</td></tr>` : ''}
  ${document.referenceText ? `<tr><td style="border:none;padding:2px 12px 2px 0"><strong>Reference:</strong></td><td style="border:none;padding:2px 0">${esc(document.referenceText)}</td></tr>` : ''}
  ${document.placeOfSupply ? `<tr><td style="border:none;padding:2px 12px 2px 0"><strong>Place of supply:</strong></td><td style="border:none;padding:2px 0">${esc(document.placeOfSupply)}</td></tr>` : ''}
</table>

${document.subject ? `<p style="margin:12px 0"><strong>Subject:</strong> ${esc(document.subject)}</p>` : ''}

<div class="meta">
  <div class="box">
    <div class="box-title">Bill To</div>
    <div><strong>${esc(customer.displayName)}</strong></div>
    ${customer.gstin ? `<div>GSTIN: ${esc(customer.gstin)}</div>` : ''}
    <div>${esc(customer.billingAddress)}</div>
  </div>
  <div class="box">
    <div class="box-title">Ship To</div>
    ${customer.shipToName ? `<div><strong>${esc(customer.shipToName)}</strong></div>` : ''}
    <div>${esc(customer.shippingAddress || customer.billingAddress)}</div>
  </div>
</div>

<table><thead>${head}</thead><tbody>${linesHtml}</tbody></table>

<div class="totals">
  <div><strong>Subtotal:</strong> ${formatInr(document.subtotal ?? 0)}</div>
  <div><strong>Tax:</strong> ${formatInr(document.taxTotal ?? 0)}</div>
  <div style="font-size:14px;margin-top:4px"><strong>Grand total:</strong> ${formatInr(document.grandTotal ?? 0)}</div>
  ${document.amountInWords ? `<div style="margin-top:8px;font-style:italic">Amount in words: ${esc(document.amountInWords)}</div>` : ''}
</div>

${document.terms ? `<div class="terms"><strong>Terms &amp; conditions</strong><br/>${esc(document.terms)}</div>` : ''}
${document.notes ? `<div class="terms"><strong>Notes</strong><br/>${esc(document.notes)}</div>` : ''}

<script>window.onload=function(){window.print()}</script>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
}

function printSimpleDocument(payload: SalesDocumentPrint) {
  const { organization, customer, document } = payload;
  const title = DOCUMENT_TITLES[document.type];
  const hasMoney = document.subtotal != null;
  const linesHtml = document.lines
    .map((line) => {
      if (hasMoney) {
        return `<tr><td>${esc(line.description)}</td><td>${line.quantity} ${esc(line.unit)}</td><td>${line.rate ?? ''}</td><td>${line.taxPercent ?? ''}%</td><td>${(line.amount ?? 0) + (line.taxAmount ?? 0)}</td></tr>`;
      }
      return `<tr><td>${esc(line.description)}</td><td>${line.quantity} ${esc(line.unit)}</td></tr>`;
    })
    .join('');
  const head = hasMoney
    ? '<tr><th>Description</th><th>Qty</th><th>Rate</th><th>Tax</th><th>Amount</th></tr>'
    : '<tr><th>Description</th><th>Qty</th></tr>';
  const totals = hasMoney
    ? `<p style="margin-top:16px"><strong>Subtotal:</strong> ${document.subtotal}<br/><strong>Tax:</strong> ${document.taxTotal}<br/><strong>Grand total:</strong> ${document.grandTotal}</p>`
    : '';
  const einvoice = document.einvoice;
  const qrData = encodeURIComponent(einvoice?.signedQr || einvoice?.irn || '');
  const einvoiceHtml = einvoice
    ? `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #ccc">
        <p><strong>e-Invoice</strong></p>
        <p>IRN: ${esc(einvoice.irn)}${einvoice.ackNumber ? `<br/>Ack: ${esc(einvoice.ackNumber)}` : ''}</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrData}" alt="e-Invoice QR" width="160" height="160" />
      </div>`
    : '';
  const html = `<!DOCTYPE html><html><head><title>${esc(document.documentNumber)}</title>
    <style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{margin:0 0 8px}</style>
    </head><body>
    <h1>${title} ${esc(document.documentNumber)}</h1>
    <p><strong>${esc(organization.tradeName || organization.legalName)}</strong><br/>${esc(organization.addressLine1)}, ${esc(organization.city)} ${esc(organization.postalCode)}${organization.gstin ? `<br/>GSTIN: ${esc(organization.gstin)}` : ''}</p>
    <p><strong>Customer:</strong> ${esc(customer.displayName)}${customer.gstin ? ` · GSTIN ${esc(customer.gstin)}` : ''}<br/>${esc(customer.billingAddress || '')}</p>
    <p>Date: ${esc(document.date)} · Status: ${esc(document.status)}</p>
    <table><thead>${head}</thead><tbody>${linesHtml}</tbody></table>
    ${totals}
    ${document.notes ? `<p>Notes: ${esc(document.notes)}</p>` : ''}
    ${einvoiceHtml}
    </body></html>`;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
}

export function printSalesDocument(payload: SalesDocumentPrint) {
  if (payload.document.type === 'quote') {
    printQuote(payload);
    return;
  }
  printSimpleDocument(payload);
}
