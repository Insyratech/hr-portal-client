'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import { useGetInventoryLotsQuery } from '@/store/api/api';

export function InventoryLotsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage = permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const { data, isLoading, isError } = useGetInventoryLotsQuery(undefined, { skip: !canManage });

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Lots" />
        <p className="text-sm text-muted">You need lots manage permission.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Inventory"
        title="Lots"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/inventory/prep">Prep reagent</Link>
            </Button>
            <Button asChild>
              <Link href="/inventory/receive">Receive lot</Link>
            </Button>
          </div>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Each row is one bottle (QR). Remaining is stock still on that bottle, in the lot unit from
        receive. Open a lot to print its label or review the ledger.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load lots.</p> : null}

      <DataTable
        columns={[
          {
            id: 'lot',
            header: 'Lot',
            cell: (row) => (
              <Link href={`/inventory/lots/${row.id}`} className="underline-offset-2 hover:underline">
                {row.lotCode}
              </Link>
            ),
          },
          { id: 'item', header: 'Item', cell: (row) => row.catalogItemName },
          { id: 'category', header: 'Category', cell: (row) => row.categoryName },
          {
            id: 'origin',
            header: 'Origin',
            cell: (row) => row.origin ?? 'purchase',
          },
          { id: 'location', header: 'Location', cell: (row) => row.locationName },
          {
            id: 'stock',
            header: 'Remaining',
            cell: (row) => `${row.remainingQty} / ${row.receivedQty} ${row.unit}`,
          },
          { id: 'status', header: 'Status', cell: (row) => row.status },
          {
            id: 'actions',
            header: '',
            cell: (row) => (
              <Button asChild variant="outline" size="sm">
                <Link href={`/inventory/lots/${row.id}`}>View</Link>
              </Button>
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No lots yet"
        emptyDescription="Receive a measured lot or complete a reagent prep to create the first QR lot."
      />
    </>
  );
}
