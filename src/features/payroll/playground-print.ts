import { jsPDF } from 'jspdf';
import type { PayslipPlaygroundPreview } from '@/types/api';
import { formatInr } from '@/features/payroll/format';

/** Helvetica has no ₹ glyph — use plain en-IN amounts in the vector PDF. */
function formatInrPdf(value: number): string {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(value: number): string {
  return esc(formatInr(value));
}

async function resolveLogoDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function imageFormatFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'PNG';
}

function styles(): string {
  return `
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; color: #000;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
      -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { margin: 8px 12px; font-size: 12px; color: #444; }
    .sheet { width: 277mm; margin: 0 auto; padding: 2mm; border: 1px solid #000; background: #fff; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    td, th { border: 1px solid #000; padding: 2px 6px; font-size: 10px; line-height: 1.2;
      vertical-align: top; color: #000; }
    th { background: #f5f5f5; font-weight: 700; text-align: left; }
    th.center { text-align: center; }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .label { font-weight: 700; }
    .logo { display: block; max-height: 12mm; max-width: 100%; object-fit: contain; object-position: left center; }
    .company { text-align: right; }
    .company-name { margin: 2px 0 0; font-size: 12px; font-weight: 700; }
    .addr { margin: 0; white-space: pre-line; font-size: 9.5px; color: #222; }
    .note { margin: 2px 0 0; font-size: 8.5px; color: #555; }
    @page { size: A4 landscape; margin: 6mm; }
    @media print {
      .no-print { display: none !important; }
      html, body { width: 100%; }
      .sheet { width: 100%; margin: 0; padding: 1.5mm; border: 1px solid #000; }
    }
  `;
}

function sheetHtml(preview: PayslipPlaygroundPreview): string {
  const logo = preview.company.logoUrl
    ? `<img class="logo" src="${esc(preview.company.logoUrl)}" alt="" />`
    : '<div style="height:10mm;display:flex;align-items:center;justify-content:center;color:#666">Logo</div>';
  const maxRows = Math.max(preview.earnings.length, preview.deductions.length);
  const payRows = Array.from({ length: maxRows })
    .map((_, i) => {
      const e = preview.earnings[i];
      const d = preview.deductions[i];
      return `<tr>
        <td>${esc(e?.label ?? '')}</td>
        <td class="num">${e ? money(e.amount) : ''}</td>
        <td class="num">${e ? money(e.ytd) : ''}</td>
        <td>${esc(d?.label ?? '')}</td>
        <td class="num">${d ? money(d.amount) : ''}</td>
        <td class="num">${d ? money(d.ytd) : ''}</td>
      </tr>`;
    })
    .join('');

  const leaveRows =
    preview.leave.length === 0
      ? `<tr><td colspan="5">No leave allocations for this calendar year.</td></tr>`
      : preview.leave
          .map(
            (row) => `<tr>
              <td>${esc(row.code ? `${row.code} · ${row.name}` : row.name)}</td>
              <td class="num">${row.opening}</td>
              <td class="num">${row.accrued}</td>
              <td class="num">${row.availed}</td>
              <td class="num">${row.closing}</td>
            </tr>`,
          )
          .join('');

  const tax = preview.tax;
  const taxRows = [
    ['Projected annual gross', tax.annualGrossSalary],
    ['Standard deduction', tax.standardDeduction],
    ['Other income', tax.otherIncome],
    ['Taxable income', tax.taxableIncome],
    ['Tax on total income', tax.taxOnTotalIncome],
    ['Rebate u/s 87A', tax.rebate87A],
    ['Surcharge', tax.surcharge],
    ['Health & education cess (4%)', tax.cess],
    ['Relief u/s 89', tax.relief89],
    ['Net annual tax', tax.netAnnualTax],
    ['Tax deducted till previous month', tax.taxDeductedTillPreviousMonth],
    ['Balance tax', tax.balanceTax],
    [`TDS this month (${preview.tdsSource})`, tax.tdsThisMonth],
    ['Tax remaining after this month', tax.taxRemainingAfterThisMonth],
  ]
    .map(([label, value]) => `<tr><td>${esc(String(label))}</td><td class="num">${money(Number(value))}</td></tr>`)
    .join('');

  return `
    <div class="sheet">
      <table>
        <tr>
          <td style="width:34%;vertical-align:middle">${logo}</td>
          <td class="company">
            <p class="addr">${esc(preview.company.address)}</p>
            <p class="company-name">${esc(preview.company.name)}</p>
          </td>
        </tr>
        <tr>
          <th class="center">Salary slip · playground</th>
          <th class="center">Month · ${esc(preview.monthLabel)} · FY ${esc(preview.financialYear)} · New regime</th>
        </tr>
      </table>
      <table>
        <tr>
          <td><span class="label">Employee name:</span> ${esc(preview.employee.fullName)}</td>
          <td><span class="label">PAN:</span> ${esc(preview.payment.pan ?? '—')}</td>
        </tr>
        <tr>
          <td><span class="label">Employee ID:</span> ${esc(preview.employee.employeeCode)}</td>
          <td><span class="label">Account number:</span> ${esc(preview.payment.bankAccountNumber ?? '—')}</td>
        </tr>
        <tr>
          <td><span class="label">Designation:</span> ${esc(preview.employee.designationName ?? '—')}</td>
          <td><span class="label">Bank name:</span> ${esc(preview.payment.bankName ?? '—')}</td>
        </tr>
        <tr>
          <td><span class="label">Date of joining:</span> ${esc(preview.employee.joiningDate ?? '—')}</td>
          <td><span class="label">IFSC:</span> ${esc(preview.payment.ifsc ?? '—')}</td>
        </tr>
        <tr>
          <td><span class="label">Department:</span> ${esc(preview.employee.departmentName ?? '—')}</td>
          <td></td>
        </tr>
      </table>
      <table>
        <tr><th colspan="4">Attendance</th></tr>
        <tr>
          <td>Calendar days: ${preview.attendance.calendarDays}</td>
          <td>Working / paid days: ${preview.attendance.workingDays}</td>
          <td>Non-working: ${preview.attendance.nonWorkingDays}</td>
          <td>LOP: ${preview.attendance.lopDays}</td>
        </tr>
      </table>
      <table>
        <tr>
          <th class="center" colspan="3">Income</th>
          <th class="center" colspan="3">Deductions</th>
        </tr>
        <tr>
          <th>Particulars</th><th class="num">Amount (₹)</th><th class="num">YTD (₹)</th>
          <th>Particulars</th><th class="num">Amount (₹)</th><th class="num">YTD (₹)</th>
        </tr>
        ${payRows}
        <tr>
          <td><span class="label">Gross pay</span></td>
          <td class="num">${money(preview.gross)}</td>
          <td class="num">${money(preview.grossYtd)}</td>
          <td><span class="label">Net pay for the month</span></td>
          <td class="num" colspan="2"><strong>${money(preview.net)}</strong></td>
        </tr>
        <tr>
          <td colspan="6"><span class="label">Net pay in words:</span> ${esc(preview.netInWords)}</td>
        </tr>
      </table>
      <table>
        <tr><th colspan="5">Leave particulars</th></tr>
        <tr>
          <th>Type</th><th class="num">Opening</th><th class="num">Accrued</th>
          <th class="num">Availed</th><th class="num">Closing</th>
        </tr>
        ${leaveRows}
      </table>
      <table>
        <tr><th colspan="2">Income tax · New regime · FY ${esc(preview.financialYear)}</th></tr>
        ${taxRows}
      </table>
      <p class="note">Ephemeral preview — not a published payslip.</p>
    </div>
  `;
}

/** Open a print window for the playground slip. Returns false if the popup was blocked. */
export function printPayslipPlayground(preview: PayslipPlaygroundPreview): boolean {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');
  if (!win) return false;
  win.document.open();
  win.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>Payslip playground · ${esc(preview.monthLabel)}</title><style>${styles()}</style></head><body><p class="no-print">Use Print → Save as PDF if needed. Turn off Headers and footers.</p>${sheetHtml(preview)}<script>window.onload=function(){window.print();}</script></body></html>`);
  win.document.close();
  win.focus();
  return true;
}

function pdfFileName(preview: PayslipPlaygroundPreview): string {
  const name = preview.employee.fullName.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  const month = preview.monthLabel.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_');
  return `Payslip_playground_${name || preview.employee.employeeCode}_${month || preview.period}.pdf`;
}

/**
 * Landscape A4 vector PDF mirroring PayslipPlaygroundDocument.
 * Does not touch production SalarySlipDocument / salary-slip-print.
 */
export async function downloadPayslipPlaygroundPdf(preview: PayslipPlaygroundPreview): Promise<void> {
  const logoSrc = await resolveLogoDataUrl(preview.company.logoUrl);
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 7;
  const pad = 2;
  const x0 = margin + pad;
  const contentW = pageW - (margin + pad) * 2;
  let y = margin + pad;

  const ink = '#000000';
  const headFill: [number, number, number] = [250, 250, 250];

  pdf.setDrawColor(ink);
  pdf.setTextColor(ink);
  pdf.setLineWidth(0.2);

  function setFont(bold: boolean, size: number) {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
  }

  function ensureSpace(needed: number) {
    if (y + needed <= pageH - margin) return;
    pdf.setDrawColor(ink);
    pdf.rect(margin, margin, pageW - margin * 2, pageH - margin * 2);
    pdf.addPage();
    y = margin + pad;
  }

  function drawRow(
    cells: { text: string; align?: 'left' | 'right' | 'center'; bold?: boolean; fill?: boolean; span?: number }[],
    widths: number[],
    rowH: number,
  ) {
    ensureSpace(rowH);
    let x = x0;
    let col = 0;
    for (const cell of cells) {
      const span = cell.span ?? 1;
      let w = 0;
      for (let i = 0; i < span; i += 1) w += widths[col + i] ?? 0;
      if (cell.fill) {
        pdf.setFillColor(...headFill);
        pdf.rect(x, y, w, rowH, 'FD');
      } else {
        pdf.rect(x, y, w, rowH);
      }
      setFont(Boolean(cell.bold), 8);
      const padX = 1.5;
      let tx = x + padX;
      const align = cell.align ?? 'left';
      if (align === 'right') tx = x + w - padX;
      if (align === 'center') tx = x + w / 2;
      const lines = pdf.splitTextToSize(cell.text, Math.max(4, w - padX * 2)) as string[];
      pdf.text(lines[0] ?? '', tx, y + rowH / 2 + 1.1, { align });
      x += w;
      col += span;
    }
    y += rowH;
  }

  // Outer border drawn at end of page content via ensureSpace / finish
  const half = contentW / 2;
  const sixth = contentW / 6;
  const payWidths = [sixth, sixth, sixth, sixth, sixth, sixth];
  const twoCol = [half, half];
  const fourCol = [contentW / 4, contentW / 4, contentW / 4, contentW / 4];
  const fiveCol = [contentW * 0.36, contentW * 0.16, contentW * 0.16, contentW * 0.16, contentW * 0.16];

  // Header
  const headerH = 16;
  ensureSpace(headerH);
  pdf.rect(x0, y, contentW * 0.34, headerH);
  if (logoSrc) {
    try {
      const fmt = imageFormatFromDataUrl(logoSrc);
      pdf.addImage(logoSrc, fmt, x0 + 2, y + 2, contentW * 0.34 - 4, headerH - 4, undefined, 'FAST');
    } catch {
      setFont(false, 8);
      pdf.text('Logo', x0 + 4, y + headerH / 2 + 1);
    }
  } else {
    setFont(false, 8);
    pdf.text('Logo', x0 + 4, y + headerH / 2 + 1);
  }
  pdf.rect(x0 + contentW * 0.34, y, contentW * 0.66, headerH);
  setFont(false, 7.5);
  const addrLines = pdf.splitTextToSize(preview.company.address || '', contentW * 0.66 - 4) as string[];
  let ay = y + 4;
  for (const line of addrLines.slice(0, 3)) {
    pdf.text(line, x0 + contentW - 2, ay, { align: 'right' });
    ay += 3;
  }
  setFont(true, 9);
  pdf.text(preview.company.name || '', x0 + contentW - 2, y + headerH - 3, { align: 'right' });
  y += headerH;

  drawRow(
    [
      { text: 'Salary slip · playground', align: 'center', bold: true, fill: true },
      {
        text: `Month · ${preview.monthLabel} · FY ${preview.financialYear} · New regime`,
        align: 'center',
        bold: true,
        fill: true,
      },
    ],
    twoCol,
    6,
  );

  const info = (label: string, value: string) => `${label} ${value}`;
  drawRow(
    [
      { text: info('Employee name:', preview.employee.fullName) },
      { text: info('PAN:', preview.payment.pan ?? '—') },
    ],
    twoCol,
    5.5,
  );
  drawRow(
    [
      { text: info('Employee ID:', preview.employee.employeeCode) },
      { text: info('Account number:', preview.payment.bankAccountNumber ?? '—') },
    ],
    twoCol,
    5.5,
  );
  drawRow(
    [
      { text: info('Designation:', preview.employee.designationName ?? '—') },
      { text: info('Bank name:', preview.payment.bankName ?? '—') },
    ],
    twoCol,
    5.5,
  );
  drawRow(
    [
      { text: info('Date of joining:', preview.employee.joiningDate ?? '—') },
      { text: info('IFSC:', preview.payment.ifsc ?? '—') },
    ],
    twoCol,
    5.5,
  );
  drawRow(
    [{ text: info('Department:', preview.employee.departmentName ?? '—'), span: 2 }],
    twoCol,
    5.5,
  );

  drawRow([{ text: 'Attendance', bold: true, fill: true, span: 4 }], fourCol, 5.5);
  drawRow(
    [
      { text: `Calendar days: ${preview.attendance.calendarDays}` },
      { text: `Working / paid days: ${preview.attendance.workingDays}` },
      { text: `Non-working: ${preview.attendance.nonWorkingDays}` },
      { text: `LOP: ${preview.attendance.lopDays}` },
    ],
    fourCol,
    5.5,
  );

  drawRow(
    [
      { text: 'Income', align: 'center', bold: true, fill: true, span: 3 },
      { text: 'Deductions', align: 'center', bold: true, fill: true, span: 3 },
    ],
    payWidths,
    5.5,
  );
  drawRow(
    [
      { text: 'Particulars', bold: true, fill: true },
      { text: 'Amount', align: 'right', bold: true, fill: true },
      { text: 'YTD', align: 'right', bold: true, fill: true },
      { text: 'Particulars', bold: true, fill: true },
      { text: 'Amount', align: 'right', bold: true, fill: true },
      { text: 'YTD', align: 'right', bold: true, fill: true },
    ],
    payWidths,
    5,
  );

  const maxRows = Math.max(preview.earnings.length, preview.deductions.length);
  for (let i = 0; i < maxRows; i += 1) {
    const e = preview.earnings[i];
    const d = preview.deductions[i];
    drawRow(
      [
        { text: e?.label ?? '' },
        { text: e ? formatInrPdf(e.amount) : '', align: 'right' },
        { text: e ? formatInrPdf(e.ytd) : '', align: 'right' },
        { text: d?.label ?? '' },
        { text: d ? formatInrPdf(d.amount) : '', align: 'right' },
        { text: d ? formatInrPdf(d.ytd) : '', align: 'right' },
      ],
      payWidths,
      5,
    );
  }

  drawRow(
    [
      { text: 'Gross pay', bold: true },
      { text: formatInrPdf(preview.gross), align: 'right', bold: true },
      { text: formatInrPdf(preview.grossYtd), align: 'right', bold: true },
      { text: 'Net pay for the month', bold: true },
      { text: formatInrPdf(preview.net), align: 'right', bold: true, span: 2 },
    ],
    payWidths,
    5.5,
  );
  drawRow(
    [{ text: `Net pay in words: ${preview.netInWords}`, span: 6 }],
    payWidths,
    6,
  );

  drawRow([{ text: 'Leave particulars', bold: true, fill: true, span: 5 }], fiveCol, 5.5);
  drawRow(
    [
      { text: 'Type', bold: true, fill: true },
      { text: 'Opening', align: 'right', bold: true, fill: true },
      { text: 'Accrued', align: 'right', bold: true, fill: true },
      { text: 'Availed', align: 'right', bold: true, fill: true },
      { text: 'Closing', align: 'right', bold: true, fill: true },
    ],
    fiveCol,
    5,
  );
  if (preview.leave.length === 0) {
    drawRow([{ text: 'No leave allocations for this calendar year.', span: 5 }], fiveCol, 5);
  } else {
    for (const row of preview.leave) {
      drawRow(
        [
          { text: row.code ? `${row.code} · ${row.name}` : row.name },
          { text: String(row.opening), align: 'right' },
          { text: String(row.accrued), align: 'right' },
          { text: String(row.availed), align: 'right' },
          { text: String(row.closing), align: 'right' },
        ],
        fiveCol,
        5,
      );
    }
  }

  const tax = preview.tax;
  const taxLines: [string, number][] = [
    ['Projected annual gross', tax.annualGrossSalary],
    ['Standard deduction', tax.standardDeduction],
    ['Other income', tax.otherIncome],
    ['Taxable income', tax.taxableIncome],
    ['Tax on total income', tax.taxOnTotalIncome],
    ['Rebate u/s 87A', tax.rebate87A],
    ['Surcharge', tax.surcharge],
    ['Health & education cess (4%)', tax.cess],
    ['Relief u/s 89', tax.relief89],
    ['Net annual tax', tax.netAnnualTax],
    ['Tax deducted till previous month', tax.taxDeductedTillPreviousMonth],
    ['Balance tax', tax.balanceTax],
    [`TDS this month (${preview.tdsSource})`, tax.tdsThisMonth],
    ['Tax remaining after this month', tax.taxRemainingAfterThisMonth],
  ];
  drawRow(
    [{ text: `Income tax · New regime · FY ${preview.financialYear}`, bold: true, fill: true, span: 2 }],
    twoCol,
    5.5,
  );
  for (const [label, value] of taxLines) {
    drawRow(
      [
        { text: label, bold: label === 'Taxable income' || label === 'Net annual tax' },
        { text: formatInrPdf(value), align: 'right', bold: label === 'Taxable income' || label === 'Net annual tax' },
      ],
      twoCol,
      4.8,
    );
  }

  ensureSpace(6);
  setFont(false, 7);
  pdf.setTextColor('#555555');
  pdf.text('Ephemeral preview — not a published payslip.', x0 + contentW, y + 4, { align: 'right' });
  pdf.setTextColor(ink);

  // Outer border on every page
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    pdf.setPage(p);
    pdf.setDrawColor(ink);
    pdf.setLineWidth(0.25);
    pdf.rect(margin, margin, pageW - margin * 2, pageH - margin * 2);
  }

  pdf.save(pdfFileName(preview));
}
