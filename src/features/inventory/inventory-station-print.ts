import type { InventoryStationPrint } from '@/types/api';

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

function stationKind(station: InventoryStationPrint['station']): string {
  if (station.categoryName?.trim()) return station.categoryName.trim();
  const haystack = `${station.name} ${station.locationName}`.toLowerCase();
  if (haystack.includes('stationer')) return 'Miscellaneous';
  return 'Plasticware';
}

/** Opens a printable station QR label sized to the card, not a full page. */
export function printInventoryStationLabel(payload: InventoryStationPrint): void {
  const { station, scanUrl, labelTitle } = payload;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(scanUrl)}`;
  const path = shortScanPath(scanUrl);
  const html = `<!DOCTYPE html><html><head><title>${esc(labelTitle)}</title>
<style>
  @page { size: 90mm 58mm; margin: 0; }
  html, body { width: 90mm; height: 58mm; margin: 0; padding: 0; overflow: hidden; background: #fff; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; color: #111; }
  .card {
    display: grid;
    grid-template-columns: 30mm 1fr;
    gap: 2.5mm;
    align-items: start;
    width: 90mm;
    height: 58mm;
    padding: 2.5mm;
    border: 0.3mm solid #222;
  }
  img { width: 28mm; height: 28mm; display: block; }
  h1 { font-size: 10pt; margin: 0 0 1.2mm; line-height: 1.15; font-weight: 650; }
  table { width: 100%; border-collapse: collapse; }
  th, td { font-size: 7.5pt; line-height: 1.2; text-align: left; vertical-align: top; padding: 0.2mm 0; }
  th { width: 14mm; font-weight: 650; }
  .hint { margin: 1.2mm 0 0; font-size: 6.5pt; color: #333; }
  .meta { color: #444; word-break: break-all; font-size: 5.5pt; margin: 0.8mm 0 0; }
</style></head><body>
  <div class="card">
    <img src="${esc(qrSrc)}" alt="QR" />
    <div>
      <h1>${esc(station.name)}</h1>
      <table>
        <tr><th>Kind</th><td>${esc(stationKind(station))}</td></tr>
        <tr><th>Store</th><td>${esc(station.locationName)} (${esc(station.locationCode)})</td></tr>
        <tr><th>Use</th><td>One visit, several items</td></tr>
      </table>
      <p class="hint">Scan once, then add each item you take</p>
      <p class="meta">${esc(path)}</p>
    </div>
  </div>
  <script>window.onload=function(){window.print();}</script>
</body></html>`;

  const win = window.open('', '_blank', 'width=460,height=340');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}
