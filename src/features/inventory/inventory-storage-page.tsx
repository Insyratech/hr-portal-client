'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useGetInventoryStorageAreaQuery,
  useTransferInventoryLotInsideLabMutation,
} from '@/store/api/api';
import type { InventoryStorageKind } from '@/types/api';

const AREA_META: Record<
  InventoryStorageKind,
  { title: string; href: string; transferHint?: string }
> = {
  stock_room: {
    title: 'Stock room',
    href: '/inventory/storage/stock-room',
    transferHint: 'Transfer chemicals/reagents to Inside lab as whole lots — no unit consumption here.',
  },
  inside_lab: {
    title: 'Inside lab',
    href: '/inventory/storage/inside-lab',
  },
  stationery: {
    title: 'Stationery',
    href: '/inventory/storage/stationery',
  },
};

export function InventoryStoragePage({ kind }: { kind: InventoryStorageKind }) {
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canLots = permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const canPlastic = permissions.includes(PERMISSIONS.INVENTORY_PLASTIC_MANAGE);
  const canView = canLots || canPlastic;
  const meta = AREA_META[kind];

  const { data, isLoading, isError, refetch } = useGetInventoryStorageAreaQuery(kind, {
    skip: !canView,
  });
  const [transfer, { isLoading: transferring }] = useTransferInventoryLotInsideLabMutation();
  const area = data?.data;

  async function onTransfer(lotId: string, lotLabel: string) {
    if (
      !window.confirm(
        `Transfer “${lotLabel}” from Stock room to Inside lab?\n\nQuantity stays the same. Unit consumption happens only after it is in Inside lab.`,
      )
    ) {
      return;
    }
    try {
      const result = await transfer({ id: lotId }).unwrap();
      toast.success(
        `Transferred ${result.data.lot.lotCode} → ${result.data.toArea} (${result.data.lot.remainingQty} ${result.data.lot.unit}).`,
      );
      void refetch();
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to transfer lot.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Storage" title={meta.title} />
        <p className="text-sm text-muted">You need lots or plastic manage permission.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={isLoading || transferring} />
      <PageHeader kicker="Storage" title={area?.name ?? meta.title} />
      <p className="mb-4 max-w-2xl text-sm text-muted">
        {area?.description ?? AREA_META[kind].transferHint ?? ''}
      </p>
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(AREA_META) as InventoryStorageKind[]).map((key) => (
          <Button key={key} asChild variant={key === kind ? 'primary' : 'outline'} size="sm">
            <Link href={AREA_META[key].href}>{AREA_META[key].title}</Link>
          </Button>
        ))}
      </div>
      {isError ? <p className="mb-4 text-sm text-danger">Unable to load this storage area.</p> : null}

      {kind !== 'stationery' ? (
        <section className="mb-10">
          <Meta>Measured lots</Meta>
          <div className="mt-3">
            <DataTable
              columns={[
                {
                  id: 'lot',
                  header: 'Lot',
                  cell: (row) => (
                    <Link
                      href={`/inventory/lots/${row.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {row.lotCode}
                    </Link>
                  ),
                },
                { id: 'item', header: 'Item', cell: (row) => row.catalogItemName },
                { id: 'category', header: 'Category', cell: (row) => row.categoryName || '—' },
                {
                  id: 'qty',
                  header: 'On hand',
                  cell: (row) => `${row.remainingQty} / ${row.receivedQty} ${row.unit}`,
                },
                { id: 'shelf', header: 'Shelf', cell: (row) => row.locationName || '—' },
                { id: 'status', header: 'Status', cell: (row) => row.status },
                {
                  id: 'actions',
                  header: '',
                  cell: (row) =>
                    row.canTransferToInsideLab ? (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={transferring}
                          onClick={() => void onTransfer(row.id, `${row.catalogItemName} · ${row.lotCode}`)}
                        >
                          Transfer to Inside lab
                        </Button>
                      </div>
                    ) : null,
                },
              ]}
              rows={area?.lots ?? []}
              loading={isLoading}
              emptyTitle="No measured lots here"
              emptyDescription={
                kind === 'stock_room'
                  ? 'Receive chemicals/reagents into Stock room, then transfer them to Inside lab.'
                  : 'Transfer lots from Stock room, or create output lots via Inside lab work.'
              }
            />
          </div>
        </section>
      ) : null}

      {kind !== 'inside_lab' ? (
        <section className="mb-10">
          <Meta>Box stock</Meta>
          <div className="mt-3">
            <DataTable
              columns={[
                {
                  id: 'stock',
                  header: 'Stock',
                  cell: (row) => (
                    <Link
                      href={`/inventory/plastic/${row.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {row.stockCode}
                    </Link>
                  ),
                },
                { id: 'item', header: 'Item', cell: (row) => row.catalogItemName },
                { id: 'size', header: 'Size', cell: (row) => row.sizeLabel || '—' },
                {
                  id: 'boxes',
                  header: 'Boxes',
                  cell: (row) => `${row.boxesOnHand} / ${row.boxesReceived} ${row.unit}`,
                },
                { id: 'shelf', header: 'Shelf', cell: (row) => row.locationName || '—' },
              ]}
              rows={area?.plastic ?? []}
              loading={isLoading}
              emptyTitle="No box stock here"
              emptyDescription="Receive plasticware or stationery via Receive and attach to this usage area."
            />
          </div>
        </section>
      ) : null}

      <section>
        <Meta>Recent history</Meta>
        <div className="mt-3">
          <DataTable
            columns={[
              {
                id: 'when',
                header: 'When',
                cell: (row) => new Date(row.createdAt).toLocaleString(),
              },
              { id: 'type', header: 'Type', cell: (row) => row.movementType },
              { id: 'label', header: 'Ref', cell: (row) => row.label },
              {
                id: 'qty',
                header: 'Qty',
                cell: (row) => `${row.qty} ${row.unit}`,
              },
              { id: 'who', header: 'By', cell: (row) => row.employeeName || '—' },
              { id: 'notes', header: 'Notes', cell: (row) => row.notes || '—' },
            ]}
            rows={area?.recentMovements ?? []}
            loading={isLoading}
            emptyTitle="No movements yet"
            emptyDescription="Receives, transfers, take-outs, and consumption appear here."
          />
        </div>
      </section>
    </>
  );
}
