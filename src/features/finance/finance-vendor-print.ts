import type { FinanceOrgGstProfile, FinanceVendorPrintPayload, FinanceVendorRegistration } from '@/types/api';

const DOC_LABELS: Record<string, string> = {
  income_tax: 'Latest Income Tax details',
  sales_tax_license: 'Copy of Sales Tax License',
  msme_ssi_license: 'SSI / MSME / Shops & establishment license',
  gst_certificate: 'GST Registration Certificate',
  pan_card: 'PAN Card copy',
  cancelled_cheque: 'Cancelled cheque',
  iso_certificate: 'ISO Certificate',
  other: 'Other document',
};

function esc(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function letterheadBlock(profile: FinanceOrgGstProfile | null): string {
  if (!profile) return '';
  const address = [profile.addressLine1, profile.addressLine2, profile.city, profile.postalCode]
    .filter(Boolean)
    .join(', ');
  const logo = profile.logoUrl
    ? `<img src="${esc(profile.logoUrl)}" alt="Logo" style="max-height:56px;max-width:140px;object-fit:contain;margin-bottom:8px" />`
    : '';
  return `<div style="text-align:right;font-size:11px;line-height:1.45">
    ${logo}
    <div style="font-weight:700;font-size:13px;text-transform:uppercase">${esc(profile.legalName || profile.tradeName)}</div>
    ${profile.gstin ? `<div>GST: ${esc(profile.gstin)}</div>` : ''}
    ${profile.cin ? `<div>CIN: ${esc(profile.cin)}</div>` : ''}
    ${address ? `<div>${esc(address)}</div>` : ''}
  </div>`;
}

function row(label: string, value: string | null | undefined): string {
  return `<tr><td style="width:32%;font-weight:600;vertical-align:top">${esc(label)}</td><td>${esc(value) || '—'}</td></tr>`;
}

export function printVendorRegistration(payload: FinanceVendorPrintPayload) {
  const vendor: FinanceVendorRegistration = payload.vendor;
  const letterhead = payload.letterhead;
  const principals = (vendor.principalCustomers ?? [])
    .map(
      (item) =>
        `<tr><td>${esc(item.customerNameAddress)}</td><td>${esc(item.productSupplied)}</td></tr>`,
    )
    .join('');
  const docs = (vendor.documents ?? [])
    .map((doc) => `<li>${esc(DOC_LABELS[doc.documentType] || doc.documentType)} — ${esc(doc.fileName)}</li>`)
    .join('');

  const html = `<!DOCTYPE html><html><head><title>Vendor Registration — ${esc(vendor.displayName)}</title>
<style>
  body{font-family:Georgia,serif;color:#111;padding:28px;max-width:900px;margin:0 auto;font-size:12px}
  h1{font-size:18px;margin:0 0 4px;letter-spacing:.04em;text-transform:uppercase}
  h2{font-size:13px;margin:22px 0 8px;border-bottom:1px solid #333;padding-bottom:4px;text-transform:uppercase}
  table{width:100%;border-collapse:collapse;margin-top:6px}
  td,th{border:1px solid #bbb;padding:6px 8px;text-align:left;vertical-align:top}
  .top{display:flex;justify-content:space-between;gap:24px;margin-bottom:18px}
  .decl{margin-top:16px;line-height:1.5}
  .sig{display:flex;justify-content:space-between;margin-top:36px}
  @media print{body{padding:12px} .no-print{display:none}}
</style></head><body>
<div class="top">
  <div>
    <h1>Vendor Registration Form</h1>
    <div style="color:#555">Digital registration record</div>
  </div>
  ${letterheadBlock(letterhead)}
</div>

<h2>Vendor details</h2>
<table>
  ${row('Vendor name', vendor.displayName)}
  ${row('Company name', vendor.companyName)}
  ${row('Address (Reg) Office', vendor.registeredAddress)}
  ${row('Address Factory', vendor.factoryAddress)}
  ${row('Billing address', vendor.billingAddress)}
  ${row('Shipping address', vendor.shippingAddress)}
  ${row('Telephone No', vendor.telephone || vendor.phone)}
  ${row('Fax No', vendor.fax)}
  ${row('Email', vendor.email)}
  ${row('Primary contact', [vendor.contactPersonName, vendor.contactPersonDesignation, vendor.contactPersonMobile].filter(Boolean).join(' · '))}
  ${row('Types of establishment', vendor.establishmentType)}
  ${row('Constitution of company', vendor.constitution)}
  ${row('Year of establishment', vendor.yearEstablished)}
  ${row('PAN No', vendor.pan)}
  ${row('GST No', vendor.gstin)}
  ${row('Sales Tax registration No', vendor.salesTaxRegNo)}
  ${row('Factory / SSI / Shops license', vendor.factoryLicenseNo)}
  ${row('Business profile', vendor.businessProfile)}
  ${row('Bankers', vendor.bankNameAddress)}
  ${row('Account No', vendor.bankAccountNo)}
  ${row('IFSC', vendor.ifsc)}
  ${row('MICR', vendor.micr)}
  ${row('Credit limit', vendor.creditLimit != null ? String(vendor.creditLimit) : null)}
  ${row('Payment terms (days)', String(vendor.paymentTermsDays ?? 0))}
</table>

<h2>Commercial information</h2>
<table>
  <thead><tr><th>Principal customers name and address</th><th>Product supplied</th></tr></thead>
  <tbody>${principals || '<tr><td colspan="2">—</td></tr>'}</tbody>
</table>

<h2>Other information (documents enclosed)</h2>
<ul>${docs || '<li>No documents uploaded</li>'}</ul>

<h2>Declaration</h2>
<div class="decl">
  I / We hereby declare that the information furnished above is true to the best of my / our knowledge
  and belief and I / We undertake to inform you of any changes therein immediately.
</div>
<div class="sig">
  <div>
    <div>Name: ${esc(vendor.declarationName)}</div>
    <div>Designation: ${esc(vendor.declarationDesignation)}</div>
    <div>Place: ${esc(vendor.declarationPlace)}</div>
  </div>
  <div style="text-align:right">
    <div>Signature of the Vendor</div>
    <div style="margin-top:40px">Date: ${esc(vendor.declarationDate)}</div>
  </div>
</div>

<h2>For office use only</h2>
<table>
  ${row('Inspection carried out by', vendor.officeInspectedBy)}
  ${row('Inspection date', vendor.officeInspectionDate)}
  ${row('Vendor code', vendor.vendorCode)}
  ${row('Approved / Rejected by', vendor.officeApprovedBy)}
  ${row('Decision', vendor.officeDecision)}
</table>

<script>window.onload=function(){window.print()}</script>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
}
