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
  @page { size: 90mm 68mm; margin: 3mm; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; color: #111; margin: 0; padding: 0; }
  .card {
    display: grid;
    grid-template-columns: 32mm 1fr;
    gap: 3mm;
    align-items: start;
    width: 84mm;
    min-height: 62mm;
    padding: 2.5mm;
    border: 0.4mm solid #222;
  }
  img { width: 30mm; height: 30mm; display: block; }
  .copy { min-width: 0; }
  h1 { font-size: 10pt; margin: 0 0 1.5mm; line-height: 1.15; font-weight: 650; }
  table { width: 100%; border-collapse: collapse; }
  th, td { font-size: 7pt; line-height: 1.25; text-align: left; vertical-align: top; padding: 0.3mm 0; }
  th { width: 16mm; font-weight: 650; color: #222; }
  .hint { margin-top: 1.5mm; font-size: 6pt; color: #333; }
  .meta { color: #444; word-break: break-all; font-size: 5.5pt; margin-top: 1mm; }
  @media print { .no-print { display: none !important; } body { padding: 0; } }
</style></head><body>
  <div class="card">
    <img src="${esc(qrSrc)}" alt="QR" />
    <div class="copy">
      <h1>${esc(lot.catalogItemName)}</h1>
      <table>
        <tr><th>Lot</th><td>${esc(lot.lotCode)}</td></tr>
        <tr><th>Cat. no.</th><td>${esc(lot.catalogNumber || '—')}</td></tr>
        <tr><th>Expiry</th><td>${esc(showDate(lot.expiryDate))}</td></tr>
        <tr><th>Opened</th><td>${esc(showDate(lot.openedOn))}</td></tr>
        <tr><th>${madeLabel}</th><td>${esc(showDate(lot.purchaseDate))}</td></tr>
        <tr><th>Store</th><td>${esc(lot.locationName)}</td></tr>
      </table>
      <p class="hint">One item on this QR. Phone camera — no QR app</p>
      <p class="meta">${esc(path)}</p>
    </div>
  </div>
  <p class="no-print" style="margin:12px;font-size:12px">Close this window after printing.</p>
  <script>window.onload=function(){window.print();}</script>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}
