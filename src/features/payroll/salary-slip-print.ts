import type { SalarySlip } from '@/types/api';
import { formatInr } from '@/features/payroll/format';

function esc(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Opens a dedicated print/PDF window with only the salary slip (landscape, one page). */
export function printSalarySlip(slip: SalarySlip): boolean {
  const p = slip.particulars;
  const logo = slip.companyLogoUrl
    ? `<img src="${esc(slip.companyLogoUrl)}" alt="" class="logo" />`
    : `<div class="logo-ph">Logo</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Salary slip · ${esc(slip.employeeName)} · ${esc(slip.monthLabel)}</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .no-print { margin: 8px 12px; font-size: 12px; color: #444; }
    .sheet {
      width: 100%;
      max-width: 281mm;
      margin: 0 auto;
      padding: 3mm;
      border: 1px solid #a3a3a3;
      background: #fff;
    }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    td, th {
      border: 1px solid #d4d4d4;
      padding: 3px 6px;
      font-size: 10.5px;
      line-height: 1.25;
      vertical-align: top;
      color: #000;
    }
    th { background: #f5f5f5; font-weight: 700; text-align: left; }
    .logo-cell { width: 32%; vertical-align: middle; }
    .logo { display: block; max-height: 14mm; max-width: 100%; object-fit: contain; object-position: left center; }
    .logo-ph {
      height: 12mm;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      font-size: 11px;
    }
    .company { text-align: right; vertical-align: middle; }
    .company-name { margin: 0; font-size: 13px; font-weight: 700; }
    .addr { margin: 3px 0 0; white-space: pre-line; font-size: 10px; color: #222; }
    .title-cell { text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
    .month-cell { text-align: center; font-size: 11px; font-weight: 600; }
    .label { font-weight: 700; }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .strong { font-weight: 700; }
    .net { font-size: 12px; font-weight: 700; }
    .note { margin: 2px 0 0; text-align: right; font-size: 9px; color: #555; }
    .sign { height: 16mm; vertical-align: bottom; color: #333; }
    .sign.right { text-align: right; }
    @media print {
      .no-print { display: none !important; }
      html, body { width: 100%; height: auto; }
      .sheet {
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 2mm;
        border: 1px solid #a3a3a3;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      table { page-break-inside: avoid; break-inside: avoid; }
    }
  </style>
</head>
<body>
  <p class="no-print">Use Print → Save as PDF. Turn off Headers and footers. Close this window when done.</p>
  <div class="sheet">
    <table>
      <tr>
        <td class="logo-cell">${logo}</td>
        <td class="company">
          <p class="company-name">${esc(slip.companyName)}</p>
          <p class="addr">${esc(slip.companyAddress)}</p>
        </td>
      </tr>
      <tr>
        <td class="title-cell">Salary slip</td>
        <td class="month-cell">Month · ${esc(slip.monthLabel)}</td>
      </tr>
    </table>

    <table>
      <tr>
        <td><span class="label">Employee name:</span> ${esc(slip.employeeName)}</td>
        <td><span class="label">Employee ID:</span> ${esc(slip.employeeCode)}</td>
      </tr>
      <tr>
        <td><span class="label">Designation:</span> ${esc(slip.designationName ?? '—')}</td>
        <td><span class="label">Date of joining:</span> ${esc(slip.joiningDate ?? '—')}</td>
      </tr>
      <tr>
        <td><span class="label">PAN:</span> ${esc(slip.panMasked ?? '—')}</td>
        <td><span class="label">Bank name:</span> ${esc(slip.bankNameMasked ?? '—')}</td>
      </tr>
      <tr>
        <td><span class="label">Account number:</span> ${esc(slip.bankAccountMasked ?? '—')}</td>
        <td><span class="label">IFSC:</span> ${esc(slip.ifscMasked ?? '—')}</td>
      </tr>
      <tr>
        <td><span class="label">Total days:</span> ${esc(String(slip.calendarDays))}</td>
        <td><span class="label">Paid days:</span> ${esc(String(slip.workingDays))}</td>
      </tr>
    </table>

    <table>
      <tr><th colspan="4">Leave particulars</th></tr>
      <tr>
        <td>CL: ${esc(String(p.cl))}</td>
        <td>SL: ${esc(String(p.sl))}</td>
        <td>ML: ${esc(String(p.ml))}</td>
        <td>EL: ${esc(String(p.el))}</td>
      </tr>
      <tr>
        <td>Maternity / Paternity: ${esc(String(p.maternityPaternity))}</td>
        <td>Miss punch: ${esc(String(p.missPunch))}</td>
        <td>Permissions: ${esc(String(p.permissionsCount))} (${esc(String(p.permissionHours))}h)</td>
        <td>Late days: ${esc(String(p.lateDays))}</td>
      </tr>
      <tr>
        <td>Absent: ${esc(String(p.absent))}</td>
        <td colspan="3" class="strong">Total LOPs: ${esc(String(p.totalLop))}</td>
      </tr>
    </table>

    <table>
      <tr>
        <th style="width:25%">Income</th>
        <th class="num" style="width:25%">Amount (₹)</th>
        <th style="width:25%">Deductions</th>
        <th class="num" style="width:25%">Amount (₹)</th>
      </tr>
      <tr>
        <td>Basic</td><td class="num">${esc(formatInr(slip.basic))}</td>
        <td>Professional tax</td><td class="num">${esc(formatInr(slip.professionalTax))}</td>
      </tr>
      <tr>
        <td>DA</td><td class="num">${esc(formatInr(slip.da))}</td>
        <td>TDS</td><td class="num">${esc(formatInr(slip.tds))}</td>
      </tr>
      <tr>
        <td>HRA</td><td class="num">${esc(formatInr(slip.hra))}</td>
        <td>Welfare</td><td class="num">${esc(formatInr(slip.employeeWelfare))}</td>
      </tr>
      <tr>
        <td>Fuel</td><td class="num">${esc(formatInr(slip.fuel))}</td>
        <td>KPI</td><td class="num">${esc(formatInr(slip.kpi))}</td>
      </tr>
      <tr>
        <td>Incentives</td><td class="num">${esc(formatInr(slip.incentives))}</td>
        <td>Other</td><td class="num">${esc(formatInr(slip.otherDeductions))}</td>
      </tr>
      <tr>
        <td>Other</td><td class="num">${esc(formatInr(slip.other))}</td>
        <td>Non-working days (${esc(String(slip.nonWorkingDays))})</td>
        <td class="num">${esc(formatInr(slip.nonWorkingAmount))}</td>
      </tr>
      <tr>
        <td class="strong">Gross</td><td class="num strong">${esc(formatInr(slip.gross))}</td>
        <td>LOP</td><td class="num">${esc(formatInr(slip.lopAmount))}</td>
      </tr>
      <tr>
        <td colspan="2" class="strong">Net pay for the month</td>
        <td colspan="2" class="num net">${esc(formatInr(slip.net))}</td>
      </tr>
    </table>

    <p class="note">All amounts are in Indian Rupees (₹).</p>

    <table>
      <tr>
        <td class="sign">Employee signature</td>
        <td class="sign right">Authorised signatory</td>
      </tr>
    </table>
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
