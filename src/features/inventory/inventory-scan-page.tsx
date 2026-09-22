'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { InventoryQrScanner } from '@/features/inventory/inventory-qr-scanner';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

/** Inventory Manager phone — in-app camera opens the public kiosk card for a label. */
export function InventoryScanPage() {
  const router = useRouter();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.INVENTORY_OVERVIEW_VIEW) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE) ||
    permissions.includes(PERMISSIONS.INVENTORY_REPORTS_VIEW);

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Scan" />
        <p className="text-sm text-muted">You need inventory access to open the scanner.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="Inventory" title="Scan" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Open the rear camera here and point at a printed lot or station label. No separate QR app —
        the portal opens the public usage card for that token.
      </p>
      <div className="max-w-md">
        <InventoryQrScanner
          onToken={(token) => {
            router.push(`/scan/${encodeURIComponent(token)}`);
          }}
        />
      </div>
    </>
  );
}
