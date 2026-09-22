'use client';

import { useRouter } from 'next/navigation';
import { InventoryQrScanner } from '@/features/inventory/inventory-qr-scanner';

/** Public entry — lab phone opens /scan and uses in-app camera (no separate QR app). */
export function InventoryPublicScanHubPage() {
  const router = useRouter();

  return (
    <main className="mx-auto min-h-screen max-w-md bg-background px-4 py-8">
      <p className="text-xs uppercase tracking-[0.2em] text-meta">Lab inventory</p>
      <h1 className="mt-2 text-xl font-medium">Scan a label</h1>
      <p className="mt-2 text-sm text-muted">
        Use this page on a lab phone. Allow camera access, then point at a lot or station QR. You will
        land on the usage card to pick your name and quantity.
      </p>
      <div className="mt-6">
        <InventoryQrScanner
          onToken={(token) => {
            router.push(`/scan/${encodeURIComponent(token)}`);
          }}
        />
      </div>
      <p className="mt-8 text-xs text-muted">
        Need Wi‑Fi? Stay on the lab network. If you go offline, usage cannot be recorded until you
        reconnect.
      </p>
    </main>
  );
}
