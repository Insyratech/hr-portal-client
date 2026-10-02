import type { SalarySlip } from '@/types/api';
import { formatInr } from '@/features/payroll/format';

function esc(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(label: string, value: string): string {
  return `<div class="row"><span>${esc(label)}</span><span class="num">${esc(value)}</span></div>`;
}

/** Opens a dedicated print/PDF window with only the salary slip (white paper, black text). */
export function printSalarySlip(slip: SalarySlip): boolean {
  const p = slip.particulars;
  const logo = slip.companyLogoUrl
    ? `<img src="${esc(slip.companyLogoUrl)}" alt="" class="logo" />`
    : `<div class="logo-ph">Logo</div>`;
  const bank = [slip.bankNameMasked, slip.bankAccountMasked].filter(Boolean).join(' · ') || '—';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Salary slip · ${esc(slip.employeeName)} · ${esc(slip.monthLabel)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
    }
    .sheet { max-width: 190mm; margin: 0 auto; padding: 8mm; }
    header { display: flex; gap: 14px; align-items: flex-start; border-bottom: 1px solid #ccc; padding-bottom: 14px; }
    .logo, .logo-ph { width: 64px; height: 64px; object-fit: contain; flex-shrink: 0; }
    .logo-ph { display: flex; align-items: center; justify-content: center; border: 1px solid #ccc; font-size: 11px; color: #666; }
    h1 { margin: 0; font-size: 18px; font-weight: 700; }
    .addr { margin: 6px 0 0; white-space: pre-line; font-size: 12px; color: #333; }
    .title { margin: 18px 0 0; text-align: center; font-size: 13px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-top: 18px; font-size: 13px; }
    .label { font-weight: 700; }
    h2 { margin: 22px 0 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
    .cols-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 20px; }
    .cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 8px; }
    .row { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid #ddd; padding: 5px 0; font-size: 13px; }
    .num { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .net { margin-top: 22px; border-top: 1px solid #ccc; padding-top: 12px; text-align: right; font-size: 16px; font-weight: 700; }
    .note { margin-top: 4px; text-align: right; font-size: 11px; color: #444; }
    footer { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 48px; font-size: 13px; color: #333; }
    footer p { margin: 0; border-top: 1px solid #ccc; padding-top: 8px; }
    footer p.right { text-align: right; }
    .no-print { margin: 12px; font-size: 12px; color: #444; }
    @media print { .no-print { display: none !important; } body { background: #fff; } }
  </style>
</head>
<body>
  <p class="no-print">Use Print → Save as PDF, or send to a printer. Close this window when done.</p>
  <div class="sheet">
    <header>
      ${logo}
      <div>
        <h1>${esc(slip.companyName)}</h1>
        <p class="addr">${esc(slip.companyAddress)}</p>
      </div>
    </header>
    <p class="title">Salary slip · ${esc(slip.monthLabel)}</p>
    <div class="grid">
      <p><span class="label">Employee name: </span>${esc(slip.employeeName)}</p>
      <p><span class="label">Employee ID: </span>${esc(slip.employeeCode)}</p>
      <p><span class="label">Designation: </span>${esc(slip.designationName ?? '—')}</p>
      <p><span class="label">Department: </span>${esc(slip.departmentName ?? '—')}</p>
      <p><span class="label">PAN: </span>${esc(slip.panMasked ?? '—')}</p>
      <p><span class="label">Bank: </span>${esc(bank)}</p>
      <p><span class="label">IFSC: </span>${esc(slip.ifscMasked ?? '—')}</p>
    </div>
    <h2>Leave particulars</h2>
    <div class="cols-3">
      ${row('CL', String(p.cl))}
      ${row('SL', String(p.sl))}
      ${row('ML', String(p.ml))}
      ${row('EL', String(p.el))}
      ${row('Maternity / Paternity', String(p.maternityPaternity))}
      ${row('Miss punch', String(p.missPunch))}
      ${row('Permissions', `${p.permissionsCount} (${p.permissionHours}h)`)}
      ${row('Late days', String(p.lateDays))}
      ${row('Absent', String(p.absent))}
      ${row('Total LOPs', String(p.totalLop))}
    </div>
    <div class="cols-2">
      <div>
        <h2>Income (₹)</h2>
        ${row('Basic', formatInr(slip.basic))}
        ${row('DA', formatInr(slip.da))}
        ${row('HRA', formatInr(slip.hra))}
        ${row('Fuel', formatInr(slip.fuel))}
        ${row('Incentives', formatInr(slip.incentives))}
        ${row('Other', formatInr(slip.other))}
        ${row('Gross', formatInr(slip.gross))}
      </div>
      <div>
        <h2>Deductions (₹)</h2>
        ${row('Professional tax', formatInr(slip.professionalTax))}
        ${row('TDS', formatInr(slip.tds))}
        ${row('Welfare', formatInr(slip.employeeWelfare))}
        ${row('KPI', formatInr(slip.kpi))}
        ${row('Other', formatInr(slip.otherDeductions))}
        ${row(`LOP (${slip.lopDays} × ${formatInr(slip.dailyRate)})`, formatInr(slip.lopAmount))}
      </div>
    </div>
    <p class="net">Net pay ${esc(formatInr(slip.net))}</p>
    <p class="note">All amounts are in Indian Rupees (₹).</p>
    <footer>
      <p>Employee</p>
      <p class="right">Authorised signatory</p>
    </footer>
  </div>
  <script>window.onload=function(){window.print();}</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  return true;
}
