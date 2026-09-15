import type { SalesDocumentPrint } from '@/types/api';

const DOCUMENT_TITLES: Record<SalesDocumentPrint['document']['type'], string> = {
  quote: 'Quote',
  invoice: 'Invoice',
  delivery_note: 'Delivery note',
};

export function printSalesDocument(payload: SalesDocumentPrint) {
  const { organization, customer, document } = payload;
  const title = DOCUMENT_TITLES[document.type];
  const hasMoney = document.subtotal != null;
  const linesHtml = document.lines
    .map((line) => {
      if (hasMoney) {
        return `<tr><td>${line.description}</td><td>${line.quantity} ${line.unit || ''}</td><td>${line.rate ?? ''}</td><td>${line.taxPercent ?? ''}%</td><td>${(line.amount ?? 0) + (line.taxAmount ?? 0)}</td></tr>`;
      }
      return `<tr><td>${line.description}</td><td>${line.quantity} ${line.unit || ''}</td></tr>`;
    })
    .join('');
  const head = hasMoney
    ? '<tr><th>Description</th><th>Qty</th><th>Rate</th><th>Tax</th><th>Amount</th></tr>'
    : '<tr><th>Description</th><th>Qty</th></tr>';
  const totals = hasMoney
    ? `<p style="margin-top:16px"><strong>Subtotal:</strong> ${document.subtotal}<br/><strong>Tax:</strong> ${document.taxTotal}<br/><strong>Grand total:</strong> ${document.grandTotal}</p>`
    : '';
  const html = `<!DOCTYPE html><html><head><title>${document.documentNumber}</title>
    <style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{margin:0 0 8px}</style>
    </head><body>
    <h1>${title} ${document.documentNumber}</h1>
    <p><strong>${organization.tradeName || organization.legalName}</strong><br/>${organization.addressLine1}, ${organization.city} ${organization.postalCode}${organization.gstin ? `<br/>GSTIN: ${organization.gstin}` : ''}</p>
    <p><strong>Customer:</strong> ${customer.displayName}${customer.gstin ? ` · GSTIN ${customer.gstin}` : ''}<br/>${customer.billingAddress || ''}</p>
    <p>Date: ${document.date} · Status: ${document.status}</p>
    <table><thead>${head}</thead><tbody>${linesHtml}</tbody></table>
    ${totals}
    ${document.notes ? `<p>Notes: ${document.notes}</p>` : ''}
    </body></html>`;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
}
