'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import { useGetInventoryPlasticStockQuery } from '@/store/api/api';

export function InventoryPlasticListPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage =
    permissions.includes(PERMISSIONS.INVENTORY_PLASTIC_MANAGE) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const { data, isLoading, isError } = useGetInventoryPlasticStockQuery(undefined, {
    skip: !canManage,
  });

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Plastic stock" />
        <p className="text-sm text-muted">You need plastic manage permission.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Inventory"
        title="Plastic stock"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/inventory/stations">Stations</Link>
            </Button>
            <Button asChild>
              <Link href="/inventory/plastic/receive">Receive boxes</Link>
            </Button>
          </div>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Box-level stock (gloves, tips, tubes). Issue from a stock-room station QR — not per-box
        labels.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load plastic stock.</p> : null}

      <DataTable
        columns={[
          {
            id: 'item',
            header: 'Item',
            cell: (row) => (
              <Link
                href={`/inventory/plastic/${row.id}`}
                className="underline-offset-2 hover:underline"
              >
                {row.catalogItemName}
              </Link>
            ),
          },
          { id: 'size', header: 'Size', cell: (row) => row.sizeLabel || '—' },
          { id: 'mfr', header: 'Manufacturer', cell: (row) => row.manufacturer || '—' },
          { id: 'location', header: 'Location', cell: (row) => row.locationName },
          {
            id: 'boxes',
            header: 'Boxes',
            cell: (row) => `${row.boxesOnHand} / ${row.boxesReceived}`,
          },
          { id: 'status', header: 'Status', cell: (row) => row.status },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No plastic stock"
        emptyDescription="Receive gloves or tip boxes, then print a station QR for that location."
      />
    </>
  );
}
