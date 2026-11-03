import { toDataURL } from 'qrcode';
import { jsPDF } from 'jspdf';
import type { InventoryLotPrint, InventoryStationPrint } from '@/types/api';

function showDate(value: string | null | undefined): string {
  if (!value) return '—';
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function fileSlug(value: string): string {
  const slug = value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-|-$/g, '');
  return slug.slice(0, 60) || 'qr';
}

function stationKind(station: InventoryStationPrint['station']): string {
  if (station.categoryName?.trim()) return station.categoryName.trim();
  const haystack = `${station.name} ${station.locationName}`.toLowerCase();
  if (haystack.includes('stationer')) return 'Miscellaneous';
  return 'Plasticware';
}

async function qrImage(scanUrl: string): Promise<string> {
  return toDataURL(scanUrl, { margin: 0, width: 320, errorCorrectionLevel: 'M' });
}

/** Landscape page whose width stays the first number. */
function labelDoc(width: number, height: number): jsPDF {
  return new jsPDF({ unit: 'mm', format: [width, height], orientation: 'landscape' });
}

type MeasuredRow = { label: string; lines: string[]; height: number };

function measureRows(doc: jsPDF, rows: [string, string][], valueWidth: number): MeasuredRow[] {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  return rows.map(([label, value]) => {
    const lines = doc.splitTextToSize(value || '—', valueWidth);
    return { label, lines, height: Math.max(3.8, lines.length * 3.3) };
  });
}

/**
 * One card: QR on the left, the same row layout as the lot label on the right.
 * Page height is the content, so the sheet does not continue as blank paper.
 */
async function renderLabel(title: string, rows: [string, string][], scanUrl: string): Promise<jsPDF> {
  const width = 86;
  const pad = 3;
  const qrMax = 28;
  const textX = pad + qrMax + 3;
  const valueWidth = width - textX - pad - 16;
  const probe = labelDoc(width, width);
  probe.setFont('helvetica', 'bold');
  probe.setFontSize(11);
  const titleLines: string[] = probe.splitTextToSize(title, width - textX - pad);
  const titleHeight = titleLines.length * 4.4;
  const measured = measureRows(probe, rows, valueWidth);
  const textHeight = titleHeight + 1.6 + measured.reduce((sum, row) => sum + row.height, 0);
  const block = Math.max(qrMax, textHeight);
  const height = Math.round((pad + block + pad) * 10) / 10;

  const doc = labelDoc(width, height);
  const image = await qrImage(scanUrl);
  const qrY = pad + (block - qrMax) / 2;
  doc.addImage(image, 'PNG', pad, qrY, qrMax, qrMax);

  let cursor = pad + (block - textHeight) / 2 + 3.6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(titleLines, textX, cursor);
  cursor += titleHeight + 1.2;

  for (const row of measured) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(row.label, textX, cursor);
    doc.setFont('helvetica', 'normal');
    doc.text(row.lines, textX + 16, cursor);
    cursor += row.height;
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const inset = 0.7;
  doc.setDrawColor(17);
  doc.setLineWidth(0.4);
  doc.rect(inset, inset, pageWidth - inset * 2, pageHeight - inset * 2);
  return doc;
}

async function stationDoc(payload: InventoryStationPrint): Promise<jsPDF> {
  return renderLabel(
    payload.station.name,
    [
      ['Kind', stationKind(payload.station)],
      ['Store', `${payload.station.locationName} (${payload.station.locationCode})`],
      ['Use', 'One visit, several items'],
    ],
    payload.scanUrl,
  );
}

async function lotDoc(payload: InventoryLotPrint): Promise<jsPDF> {
  const { lot } = payload;
  return renderLabel(
    lot.catalogItemName,
    [
      ['Lot', lot.lotCode],
      ['Cat. no.', lot.catalogNumber || '—'],
      ['Expiry', showDate(lot.expiryDate)],
      ['Opened', showDate(lot.openedOn)],
      [lot.origin === 'prep' ? 'Prepared' : 'Mfg', showDate(lot.purchaseDate)],
      ['Store', lot.locationName],
    ],
    payload.scanUrl,
  );
}

function openForPrint(doc: jsPDF): void {
  doc.autoPrint();
  const url = doc.output('bloburl');
  const win = window.open(url, '_blank');
  if (!win) doc.save('qr-label.pdf');
}

export async function printInventoryStationLabel(payload: InventoryStationPrint): Promise<void> {
  openForPrint(await stationDoc(payload));
}

export async function downloadInventoryStationLabel(payload: InventoryStationPrint): Promise<void> {
  const doc = await stationDoc(payload);
  doc.save(`qr-${fileSlug(payload.station.name)}.pdf`);
}

export async function printInventoryLotLabel(payload: InventoryLotPrint): Promise<void> {
  openForPrint(await lotDoc(payload));
}

export async function downloadInventoryLotLabel(payload: InventoryLotPrint): Promise<void> {
  const doc = await lotDoc(payload);
  doc.save(`qr-${fileSlug(payload.lot.lotCode)}.pdf`);
}
