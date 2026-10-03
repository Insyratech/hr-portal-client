import { jsPDF } from 'jspdf';
import type { SalarySlip } from '@/types/api';
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
    if (!response.ok) return null;
    const blob = await response.blob();
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

function pdfFileName(slip: SalarySlip): string {
  const name = slip.employeeName.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  const month = slip.monthLabel.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_');
  return `Salary_slip_${name || slip.employeeCode}_${month || slip.period}.pdf`;
}

function imageFormatFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'PNG';
}

type Align = 'left' | 'center' | 'right';

type CellOpts = {
  text: string;
  align?: Align;
  bold?: boolean;
  fill?: boolean;
  fontSize?: number;
  colSpan?: number;
};

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
 * Builds a landscape A4 PDF with native vector text/lines (no HTML screenshot).
 * Avoids html2canvas Chrome bugs that draw table borders through text.
 */
export async function downloadSalarySlipPdf(slip: SalarySlip): Promise<void> {
  const logoSrc = await resolveLogoDataUrl(slip.companyLogoUrl);
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 8;
  const x0 = margin;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ink = '#000000';
  const muted = '#333333';
  const headFill: [number, number, number] = [245, 245, 245];

  pdf.setDrawColor(ink);
  pdf.setTextColor(ink);
  pdf.setLineWidth(0.25);

  function setFont(bold: boolean, size: number) {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
  }

  function cellText(
    text: string,
    x: number,
    yPos: number,
    w: number,
    h: number,
    align: Align,
    bold: boolean,
    fontSize: number,
  ) {
    setFont(bold, fontSize);
    const padX = 1.6;
    const maxW = Math.max(4, w - padX * 2);
    const lines = pdf.splitTextToSize(text || '—', maxW) as string[];
    const lineH = fontSize * 0.4;
    const blockH = lines.length * lineH;
    let textY = yPos + (h - blockH) / 2 + lineH * 0.78;
    for (const line of lines) {
      let textX = x + padX;
      if (align === 'center') textX = x + w / 2;
      if (align === 'right') textX = x + w - padX;
      pdf.text(line, textX, textY, { align });
      textY += lineH;
    }
  }

  /**
   * Draws one table row with single shared borders.
   * Pass continueTable=true for rows after the first in the same table
   * so the shared horizontal edge is not stroked twice.
   */
  function drawRow(cols: CellOpts[], rowH: number, widths: number[], continueTable = false) {
    const cells: { x: number; w: number; col: CellOpts }[] = [];
    let x = x0;
    let colIndex = 0;
    for (const col of cols) {
      const span = col.colSpan ?? 1;
      let w = 0;
      for (let i = 0; i < span; i += 1) {
        w += widths[colIndex + i] ?? 0;
      }
      cells.push({ x, w, col });
      x += w;
      colIndex += span;
    }

    for (const cell of cells) {
      if (cell.col.fill) {
        pdf.setFillColor(...headFill);
        pdf.rect(cell.x, y, cell.w, rowH, 'F');
      }
    }

    pdf.setDrawColor(ink);
    pdf.setLineWidth(0.25);
    const right = x0 + contentW;
    const bottom = y + rowH;
    if (!continueTable) pdf.line(x0, y, right, y);
    pdf.line(x0, bottom, right, bottom);
    pdf.line(x0, y, x0, bottom);
    pdf.line(right, y, right, bottom);
    for (let i = 1; i < cells.length; i += 1) {
      const edgeX = cells[i]!.x;
      pdf.line(edgeX, y, edgeX, bottom);
    }

    for (const cell of cells) {
      cellText(
        cell.col.text,
        cell.x,
        y,
        cell.w,
        rowH,
        cell.col.align ?? 'left',
        Boolean(cell.col.bold),
        cell.col.fontSize ?? 8.5,
      );
    }
    y += rowH;
  }

  function sectionGap(mm = 0) {
    y += mm;
  }

  // Outer border drawn at the end around full content.
  const outerTop = y;

  // Header: logo | company
  const headerH = 18;
  const logoW = contentW * 0.34;
  const companyW = contentW - logoW;
  drawRow(
    [
      { text: '', align: 'center' },
      { text: '', align: 'right' },
    ],
    headerH,
    [logoW, companyW],
  );
  // drawRow advanced y; paint header content inside the previous row.
  const headerY = y - headerH;

  if (logoSrc) {
    try {
      const imgH = 12;
      const imgW = Math.min(logoW - 4, 48);
      pdf.addImage(
        logoSrc,
        imageFormatFromDataUrl(logoSrc),
        x0 + 2,
        headerY + (headerH - imgH) / 2,
        imgW,
        imgH,
        undefined,
        'FAST',
      );
    } catch {
      setFont(false, 8);
      pdf.setTextColor('#666666');
      pdf.text('Logo', x0 + logoW / 2, headerY + headerH / 2 + 1, { align: 'center' });
      pdf.setTextColor(ink);
    }
  } else {
    setFont(false, 8);
    pdf.setTextColor('#666666');
    pdf.text('Logo', x0 + logoW / 2, headerY + headerH / 2 + 1, { align: 'center' });
    pdf.setTextColor(ink);
  }

  const addrLines = pdf.splitTextToSize(slip.companyAddress || '—', companyW - 4) as string[];
  setFont(false, 8);
  let addrY = headerY + 4.2;
  for (const line of addrLines.slice(0, 3)) {
    pdf.text(line, x0 + logoW + companyW - 2, addrY, { align: 'right' });
    addrY += 3.2;
  }
  setFont(true, 10);
  pdf.text(slip.companyName || '—', x0 + logoW + companyW - 2, headerY + headerH - 3.5, {
    align: 'right',
  });

  // Title row (continues header table visually)
  const titleH = 7;
  const half = contentW / 2;
  drawRow(
    [
      { text: 'SALARY SLIP', bold: true, fill: true, align: 'center', fontSize: 10 },
      { text: `Month · ${slip.monthLabel}`, bold: true, fill: true, align: 'center', fontSize: 9.5 },
    ],
    titleH,
    [half, half],
    true,
  );

  // Employee info
  const infoW = [contentW / 2, contentW / 2];
  const infoH = 6.2;
  drawRow(
    [
      { text: `Employee name: ${slip.employeeName}` },
      { text: `PAN: ${slip.panMasked ?? '—'}` },
    ],
    infoH,
    infoW,
  );
  drawRow(
    [
      { text: `Employee ID: ${slip.employeeCode}` },
      { text: `Account number: ${slip.bankAccountMasked ?? '—'}` },
    ],
    infoH,
    infoW,
    true,
  );
  drawRow(
    [
      { text: `Designation: ${slip.designationName ?? '—'}` },
      { text: `Bank name: ${slip.bankNameMasked ?? '—'}` },
    ],
    infoH,
    infoW,
    true,
  );
  drawRow(
    [
      { text: `Date of joining: ${slip.joiningDate ?? '—'}` },
      { text: `IFSC: ${slip.ifscMasked ?? '—'}` },
    ],
    infoH,
    infoW,
    true,
  );
  drawRow([{ text: `Total days: ${slip.calendarDays}`, colSpan: 2 }], infoH, infoW, true);

  // Leave particulars
  const p = slip.particulars;
  const leaveW = [contentW / 4, contentW / 4, contentW / 4, contentW / 4];
  const leaveH = 6;
  drawRow([{ text: 'Leave particulars', bold: true, fill: true, colSpan: 4 }], leaveH, leaveW);
  drawRow(
    [
      { text: `CL: ${p.cl}` },
      { text: `SL: ${p.sl}` },
      { text: `ML: ${p.ml}` },
      { text: `EL: ${p.el}` },
    ],
    leaveH,
    leaveW,
    true,
  );
  drawRow(
    [
      { text: `Maternity / Paternity: ${p.maternityPaternity}` },
      { text: `Miss punch: ${p.missPunch}` },
      { text: `Permissions: ${p.permissionsCount} (${p.permissionHours}h)` },
      { text: `Late days: ${p.lateDays}` },
    ],
    leaveH,
    leaveW,
    true,
  );
  drawRow(
    [
      { text: `Absent: ${p.absent}` },
      { text: `Total LOPs: ${p.totalLop}`, bold: true, colSpan: 3 },
    ],
    leaveH,
    leaveW,
    true,
  );

  // Income / Deductions
  const moneyW = [contentW * 0.25, contentW * 0.25, contentW * 0.25, contentW * 0.25];
  const moneyH = 5.8;
  drawRow(
    [
      { text: 'Income', bold: true, fill: true, colSpan: 2, align: 'center' },
      { text: 'Deductions', bold: true, fill: true, colSpan: 2, align: 'center' },
    ],
    moneyH,
    moneyW,
  );
  drawRow(
    [
      { text: 'Particulars', bold: true, fill: true },
      { text: 'Amount (Rs.)', bold: true, fill: true, align: 'right' },
      { text: 'Particulars', bold: true, fill: true },
      { text: 'Amount (Rs.)', bold: true, fill: true, align: 'right' },
    ],
    moneyH,
    moneyW,
    true,
  );

  const moneyRows: [string, string, string, string][] = [
    ['Basic', formatInrPdf(slip.basic), 'Professional tax', formatInrPdf(slip.professionalTax)],
    ['DA', formatInrPdf(slip.da), 'TDS', formatInrPdf(slip.tds)],
    ['HRA', formatInrPdf(slip.hra), 'Welfare', formatInrPdf(slip.employeeWelfare)],
    ['Fuel', formatInrPdf(slip.fuel), 'KPI', formatInrPdf(slip.kpi)],
    ['Incentives', formatInrPdf(slip.incentives), 'Other', formatInrPdf(slip.otherDeductions)],
    [
      'Other',
      formatInrPdf(slip.other),
      `Non-working days (${slip.nonWorkingDays})`,
      formatInrPdf(slip.nonWorkingAmount),
    ],
  ];
  for (const [a, b, c, d] of moneyRows) {
    drawRow(
      [
        { text: a },
        { text: b, align: 'right' },
        { text: c },
        { text: d, align: 'right' },
      ],
      moneyH,
      moneyW,
      true,
    );
  }
  drawRow(
    [
      { text: '', colSpan: 2 },
      { text: 'LOP' },
      { text: formatInrPdf(slip.lopAmount), align: 'right' },
    ],
    moneyH,
    moneyW,
    true,
  );
  drawRow(
    [
      { text: 'CTC for the month', bold: true, colSpan: 2 },
      { text: formatInrPdf(slip.gross), bold: true, align: 'right', colSpan: 2 },
    ],
    6.4,
    moneyW,
    true,
  );
  drawRow(
    [
      { text: 'Net pay for the month', bold: true, colSpan: 2, fontSize: 10 },
      { text: formatInrPdf(slip.net), bold: true, align: 'right', colSpan: 2, fontSize: 10 },
    ],
    7,
    moneyW,
    true,
  );

  sectionGap(1.5);
  setFont(false, 7.5);
  pdf.setTextColor(muted);
  pdf.text('All amounts are in Indian Rupees (Rs.).', x0 + contentW, y + 3, { align: 'right' });
  pdf.setTextColor(ink);
  y += 5;

  const signH = 14;
  const signW = contentW / 2;
  drawRow(
    [
      { text: 'Employee signature', align: 'left', fontSize: 8.5 },
      { text: 'Authorised signatory', align: 'right', fontSize: 8.5 },
    ],
    signH,
    [signW, signW],
  );

  // Outer frame around the full slip (matches on-screen border).
  pdf.setLineWidth(0.45);
  pdf.rect(x0 - 0.6, outerTop - 0.6, contentW + 1.2, y - outerTop + 0.6);

  pdf.save(pdfFileName(slip));
}
