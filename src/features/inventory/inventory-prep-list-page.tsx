'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import { useGetInventoryPrepSessionsQuery } from '@/store/api/api';

export function InventoryPrepListPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage =
    permissions.includes(PERMISSIONS.INVENTORY_PREP_MANAGE) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const { data, isLoading, isError } = useGetInventoryPrepSessionsQuery(undefined, {
    skip: !canManage,
  });

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Reagent prep" />
        <p className="text-sm text-muted">You need prep or lots manage permission.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Inventory"
        title="Reagent prep"
        actions={
          <Button asChild>
            <Link href="/inventory/prep/new">Open prep session</Link>
          </Button>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Lab-made reagents: issue chemicals/solvents into a session, then complete to create one parent
        QR lot. Aliquots use that QR — no child labels. Reportable spend is component cost only.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load prep sessions.</p> : null}

      <DataTable
        columns={[
          {
            id: 'item',
            header: 'Reagent',
            cell: (row) => (
              <Link href={`/inventory/prep/${row.id}`} className="underline-offset-2 hover:underline">
                {row.catalogItemName}
              </Link>
            ),
          },
          {
            id: 'target',
            header: 'Target',
            cell: (row) => `${row.targetQty} ${row.unit}`,
          },
          { id: 'status', header: 'Status', cell: (row) => row.status },
          {
            id: 'cost',
            header: 'Component cost',
            cell: (row) => row.componentCostTotal.toFixed(2),
          },
          {
            id: 'lot',
            header: 'Lot',
            cell: (row) =>
              row.reagentLotId && row.reagentLotCode ? (
                <Link
                  href={`/inventory/lots/${row.reagentLotId}`}
                  className="underline-offset-2 hover:underline"
                >
                  {row.reagentLotCode}
                </Link>
              ) : (
                '—'
              ),
          },
          {
            id: 'when',
            header: 'Opened',
            cell: (row) => new Date(row.createdAt).toLocaleString(),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No prep sessions"
        emptyDescription="Open a session to prep a reagent from chemicals and solvents."
      />
    </>
  );
}
