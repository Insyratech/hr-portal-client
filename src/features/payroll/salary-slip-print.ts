import type { SalarySlip } from '@/types/api';
import { formatInr } from '@/features/payroll/format';

/** A4 landscape content width used for off-screen render (~277mm at 96dpi). */
const SLIP_RENDER_WIDTH_PX = 1048;

function esc(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slipStyles(): string {
  return `
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
      width: 277mm;
      margin: 0 auto;
      padding: 2mm;
      border: 1px solid #000;
      background: #fff;
    }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    td, th {
      border: 1px solid #000;
      padding: 2px 6px;
      font-size: 10px;
      line-height: 1.2;
      vertical-align: top;
      color: #000;
    }
    th {
      background: #f5f5f5;
      font-weight: 700;
      text-align: left;
    }
    th.center { text-align: center; }
    .logo-cell { width: 34%; vertical-align: middle; }
    .logo { display: block; max-height: 12mm; max-width: 100%; object-fit: contain; object-position: left center; }
    .logo-ph {
      height: 10mm;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      font-size: 10px;
    }
    .company { text-align: right; vertical-align: middle; }
    .company-name { margin: 2px 0 0; font-size: 12px; font-weight: 700; }
    .addr { margin: 0; white-space: pre-line; font-size: 9.5px; color: #222; }
    .title-cell {
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      background: #f5f5f5;
    }
    .month-cell {
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      background: #f5f5f5;
    }
    .label { font-weight: 700; }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .strong { font-weight: 700; }
    .net { font-size: 11px; font-weight: 700; }
    .note { margin: 2px 0 0; text-align: right; font-size: 8.5px; color: #555; }
    .sign { height: 14mm; vertical-align: bottom; color: #333; }
    .sign.right { text-align: right; }
    @page { size: A4 landscape; margin: 6mm; }
    @media print {
      .no-print { display: none !important; }
      html, body { width: 100%; height: auto; overflow: hidden; }
      .sheet {
        width: 100%;
        max-width: none;
        margin: 0;
        padding: 1.5mm;
        border: 1px solid #000;
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-after: avoid;
      }
      table { page-break-inside: avoid; break-inside: avoid; }
    }
  `;
}

function slipSheetHtml(slip: SalarySlip, logoHtml: string): string {
  const p = slip.particulars;
  return `
  <div class="sheet">
    <table>
      <tr>
        <td class="logo-cell">${logoHtml}</td>
        <td class="company">
          <p class="addr">${esc(slip.companyAddress)}</p>
          <p class="company-name">${esc(slip.companyName)}</p>
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
        <td><span class="label">PAN:</span> ${esc(slip.panMasked ?? '—')}</td>
      </tr>
      <tr>
        <td><span class="label">Employee ID:</span> ${esc(slip.employeeCode)}</td>
        <td><span class="label">Account number:</span> ${esc(slip.bankAccountMasked ?? '—')}</td>
      </tr>
      <tr>
        <td><span class="label">Designation:</span> ${esc(slip.designationName ?? '—')}</td>
        <td><span class="label">Bank name:</span> ${esc(slip.bankNameMasked ?? '—')}</td>
      </tr>
      <tr>
        <td><span class="label">Date of joining:</span> ${esc(slip.joiningDate ?? '—')}</td>
        <td><span class="label">IFSC:</span> ${esc(slip.ifscMasked ?? '—')}</td>
      </tr>
      <tr>
        <td colspan="2"><span class="label">Total days:</span> ${esc(String(slip.calendarDays))}</td>
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
        <th class="center" colspan="2">Income</th>
        <th class="center" colspan="2">Deductions</th>
      </tr>
      <tr>
        <th style="width:25%">Particulars</th>
        <th class="num" style="width:25%">Amount (₹)</th>
        <th style="width:25%">Particulars</th>
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
        <td colspan="2"></td>
        <td>LOP</td><td class="num">${esc(formatInr(slip.lopAmount))}</td>
      </tr>
      <tr>
        <td class="strong" colspan="2">CTC for the month</td>
        <td class="num strong" colspan="2">${esc(formatInr(slip.gross))}</td>
      </tr>
      <tr>
        <td class="strong" colspan="2">Net pay for the month</td>
        <td class="num net" colspan="2">${esc(formatInr(slip.net))}</td>
      </tr>
    </table>

    <p class="note">All amounts are in Indian Rupees (₹).</p>

    <table>
      <tr>
        <td class="sign">Employee signature</td>
        <td class="sign right">Authorised signatory</td>
      </tr>
    </table>
  </div>`;
}

function logoMarkup(logoSrc: string | null): string {
  return logoSrc
    ? `<img src="${esc(logoSrc)}" alt="" class="logo" crossorigin="anonymous" />`
    : `<div class="logo-ph">Logo</div>`;
}

async function resolveLogoDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return url;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

function pdfFileName(slip: SalarySlip): string {
  const name = slip.employeeName.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  const month = slip.monthLabel.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_');
  return `Salary_slip_${name || slip.employeeCode}_${month || slip.period}.pdf`;
}

/** Opens a dedicated print window with only the salary slip (landscape). */
export function printSalarySlip(slip: SalarySlip): boolean {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Salary slip · ${esc(slip.employeeName)} · ${esc(slip.monthLabel)}</title>
  <style>${slipStyles()}</style>
</head>
<body>
  <p class="no-print">Use Print → Save as PDF. Turn off Headers and footers. Close this window when done.</p>
  ${slipSheetHtml(slip, logoMarkup(slip.companyLogoUrl))}
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

/**
 * Builds a landscape A4 PDF in the browser and downloads it directly
 * (no Chrome print dialog).
 */
export async function downloadSalarySlipPdf(slip: SalarySlip): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const logoSrc = await resolveLogoDataUrl(slip.companyLogoUrl);
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${SLIP_RENDER_WIDTH_PX}px`,
    'background:#fff',
    'z-index:-1',
    'pointer-events:none',
  ].join(';');
  host.innerHTML = `<style>${slipStyles()}</style>${slipSheetHtml(slip, logoMarkup(logoSrc))}`;
  document.body.appendChild(host);

  const sheet = host.querySelector('.sheet') as HTMLElement | null;
  if (!sheet) {
    host.remove();
    throw new Error('Unable to prepare the salary slip for download.');
  }
  sheet.style.width = `${SLIP_RENDER_WIDTH_PX}px`;

  try {
    await Promise.all(
      Array.from(sheet.querySelectorAll('img')).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
      ),
    );

    // Let the browser finish layout before capture.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const canvas = await html2canvas(sheet, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      width: SLIP_RENDER_WIDTH_PX,
      windowWidth: SLIP_RENDER_WIDTH_PX,
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 5;
    const maxW = pageWidth - margin * 2;
    const maxH = pageHeight - margin * 2;
    // Scale to fit one landscape page (never spill to page 2).
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const drawW = canvas.width * ratio;
    const drawH = canvas.height * ratio;
    const x = (pageWidth - drawW) / 2;
    const y = (pageHeight - drawH) / 2;
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imageData, 'JPEG', x, y, drawW, drawH, undefined, 'FAST');
    pdf.save(pdfFileName(slip));
  } finally {
    host.remove();
  }
}
