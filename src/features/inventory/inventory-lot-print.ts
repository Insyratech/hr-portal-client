import type { InventoryLotPrint } from '@/types/api';

function esc(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shortScanPath(scanUrl: string): string {
  try {
    const url = new URL(scanUrl);
    return url.pathname;
  } catch {
    return scanUrl;
  }
}

function showDate(value: string | null | undefined): string {
  if (!value) return '—';
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

/** Opens a printable QR label window (browser print → PDF / thermal). */
export function printInventoryLotLabel(payload: InventoryLotPrint): void {
  const { lot, scanUrl, labelTitle } = payload;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(scanUrl)}`;
  const path = shortScanPath(scanUrl);
  const madeLabel = lot.origin === 'prep' ? 'Prepared' : 'Mfg';
  const html = `<!DOCTYPE html><html><head><title>${esc(labelTitle)}</title>
<style>
  @page { size: 90mm 70mm; margin: 0; }
  html, body { width: 90mm; height: 70mm; margin: 0; padding: 0; overflow: hidden; background: #fff; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; color: #111; }
  .card {
    display: grid;
    grid-template-columns: 30mm 1fr;
    gap: 2.5mm;
    align-items: start;
    width: 90mm;
    height: 70mm;
    padding: 2.5mm;
    border: 0.3mm solid #222;
  }
  img { width: 28mm; height: 28mm; display: block; }
  h1 { font-size: 10pt; margin: 0 0 1.2mm; line-height: 1.15; font-weight: 650; }
  table { width: 100%; border-collapse: collapse; }
  th, td { font-size: 7pt; line-height: 1.2; text-align: left; vertical-align: top; padding: 0.15mm 0; }
  th { width: 16mm; font-weight: 650; color: #222; }
  .hint { margin: 1.2mm 0 0; font-size: 6pt; color: #333; }
  .meta { color: #444; word-break: break-all; font-size: 5.5pt; margin: 0.6mm 0 0; }
</style></head><body>
  <div class="card">
    <img src="${esc(qrSrc)}" alt="QR" />
    <div>
      <h1>${esc(lot.catalogItemName)}</h1>
      <table>
        <tr><th>Lot</th><td>${esc(lot.lotCode)}</td></tr>
        <tr><th>Cat. no.</th><td>${esc(lot.catalogNumber || '—')}</td></tr>
        <tr><th>Expiry</th><td>${esc(showDate(lot.expiryDate))}</td></tr>
        <tr><th>Opened</th><td>${esc(showDate(lot.openedOn))}</td></tr>
        <tr><th>${madeLabel}</th><td>${esc(showDate(lot.purchaseDate))}</td></tr>
        <tr><th>Store</th><td>${esc(lot.locationName)}</td></tr>
      </table>
      <p class="hint">One item on this QR</p>
      <p class="meta">${esc(path)}</p>
    </div>
  </div>
  <script>window.onload=function(){window.print();}</script>
</body></html>`;

  const win = window.open('', '_blank', 'width=480,height=380');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}
