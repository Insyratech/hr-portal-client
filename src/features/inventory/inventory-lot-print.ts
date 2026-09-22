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

/** Opens a printable QR label window (browser print → PDF / thermal). */
export function printInventoryLotLabel(payload: InventoryLotPrint): void {
  const { lot, scanUrl, labelTitle } = payload;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(scanUrl)}`;
  const path = shortScanPath(scanUrl);
  const html = `<!DOCTYPE html><html><head><title>${esc(labelTitle)}</title>
<style>
  @page { size: 80mm 50mm; margin: 2mm; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; color: #111; margin: 0; padding: 0; }
  .card {
    display: grid;
    grid-template-columns: 34mm 1fr;
    gap: 3mm;
    align-items: center;
    width: 76mm;
    min-height: 46mm;
    padding: 2mm;
    border: 0.4mm solid #222;
  }
  img { width: 32mm; height: 32mm; display: block; }
  .copy { min-width: 0; }
  h1 { font-size: 11pt; margin: 0 0 1.5mm; line-height: 1.15; font-weight: 650; }
  .code { font-size: 10pt; font-weight: 700; margin: 0 0 1mm; letter-spacing: 0.02em; }
  p { margin: 0.4mm 0; font-size: 7.5pt; line-height: 1.25; }
  .hint { margin-top: 1.5mm; font-size: 6.5pt; color: #333; }
  .meta { color: #444; word-break: break-all; font-size: 5.5pt; margin-top: 1mm; }
  @media print { .no-print { display: none !important; } body { padding: 0; } }
</style></head><body>
  <div class="card">
    <img src="${esc(qrSrc)}" alt="QR" />
    <div class="copy">
      <h1>${esc(lot.catalogItemName)}</h1>
      <p class="code">${esc(lot.lotCode)}</p>
      <p>${esc(lot.categoryName)} · ${esc(lot.unit)}</p>
      <p>${lot.receivedQty} ${esc(lot.unit)}${lot.expiryDate ? ` · Exp ${esc(lot.expiryDate)}` : ''}</p>
      <p>${esc(lot.locationName)}</p>
      <p class="hint">Phone camera / portal Scan — no QR app</p>
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
