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
  return toDataURL(scanUrl, { margin: 1, width: 280, errorCorrectionLevel: 'M' });
}

function labelDoc(width: number, height: number): jsPDF {
  return new jsPDF({ unit: 'mm', format: [width, height], orientation: 'landscape' });
}

function drawRows(doc: jsPDF, rows: [string, string][], x: number, y: number, valueWidth: number): void {
  doc.setFontSize(8);
  let cursor = y;
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, x, cursor);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(value || '—', valueWidth);
    doc.text(lines, x + 16, cursor);
    cursor += 3.4 + Math.max(0, lines.length - 1) * 3.2;
  }
}

async function stationDoc(payload: InventoryStationPrint): Promise<jsPDF> {
  const doc = labelDoc(90, 52);
  const image = await qrImage(payload.scanUrl);
  doc.addImage(image, 'PNG', 3, 4, 24, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const title = doc.splitTextToSize(payload.station.name, 58);
  doc.text(title, 30, 8);
  drawRows(
    doc,
    [
      ['Kind', stationKind(payload.station)],
      ['Store', `${payload.station.locationName} (${payload.station.locationCode})`],
      ['Use', 'One visit, several items'],
    ],
    30,
    8 + title.length * 4.2 + 2,
    40,
  );
  return doc;
}

async function lotDoc(payload: InventoryLotPrint): Promise<jsPDF> {
  const { lot } = payload;
  const doc = labelDoc(90, 62);
  const image = await qrImage(payload.scanUrl);
  doc.addImage(image, 'PNG', 3, 4, 24, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const title = doc.splitTextToSize(lot.catalogItemName, 58);
  doc.text(title, 30, 8);
  drawRows(
    doc,
    [
      ['Lot', lot.lotCode],
      ['Cat. no.', lot.catalogNumber || '—'],
      ['Expiry', showDate(lot.expiryDate)],
      ['Opened', showDate(lot.openedOn)],
      [lot.origin === 'prep' ? 'Prepared' : 'Mfg', showDate(lot.purchaseDate)],
      ['Store', lot.locationName],
    ],
    30,
    8 + title.length * 4.2 + 2,
    40,
  );
  return doc;
}

function openForPrint(doc: jsPDF): void {
  doc.autoPrint();
  const url = doc.output('bloburl');
  const win = window.open(url, '_blank');
  if (!win) {
    doc.save('qr-label.pdf');
  }
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
