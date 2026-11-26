'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DataTable, type DataTableColumn } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useGetInventoryStorageAreaQuery,
  useTransferInventoryLotInsideLabMutation,
} from '@/store/api/api';
import type {
  InventoryStorageKind,
  InventoryStorageLotRow,
  InventoryStorageMovementRow,
  InventoryStoragePlasticRow,
} from '@/types/api';

const PREVIEW_LIMIT = 5;

const AREA_META: Record<InventoryStorageKind, { title: string; transferHint?: string }> = {
  stock_room: {
    title: 'Stock room',
    transferHint:
      'Transfer chemicals/reagents to Inside lab as whole lots — no unit consumption here.',
  },
  inside_lab: {
    title: 'Inside lab',
  },
  stationery: {
    title: 'Stationery',
  },
};

function RemainingCell({ left, total, unit }: { left: number; total: number; unit: string }) {
  return (
    <div className="tabular-nums">
      <p className="font-medium">
        {left} {unit} left
      </p>
      <p className="text-xs text-muted">
        of {total} {unit} received
      </p>
    </div>
  );
}

function StoragePreviewTable<T extends { id: string }>({
  title,
  columns,
  rows,
  loading,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  loading: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [open, setOpen] = useState(false);
  const previewRows = rows.slice(0, PREVIEW_LIMIT);
  const hasMore = rows.length > PREVIEW_LIMIT;

  return (
    <section className="mb-10 last:mb-0">
      <Meta>{title}</Meta>
      <div className="mt-3">
        <DataTable
          columns={columns}
          rows={previewRows}
          loading={loading}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </div>
      {hasMore ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            Showing {PREVIEW_LIMIT} of {rows.length}
          </p>
          <button
            type="button"
            className="text-sm underline-offset-2 hover:underline"
            onClick={() => setOpen(true)}
          >
            Show more
          </button>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-muted">
            Full list · {rows.length} item{rows.length === 1 ? '' : 's'}
          </DialogDescription>
          <div className="mt-4">
            <DataTable
              columns={columns}
              rows={rows}
              loading={false}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
            />
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

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

  const lotColumns: DataTableColumn<InventoryStorageLotRow>[] = [
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
    { id: 'category', header: 'Category', cell: (row) => row.categoryName || '—' },
    {
      id: 'left',
      header: 'Left',
      cell: (row) => (
        <RemainingCell left={row.remainingQty} total={row.receivedQty} unit={row.unit} />
      ),
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
  ];

  const plasticColumns: DataTableColumn<InventoryStoragePlasticRow>[] = [
    {
      id: 'stock',
      header: 'Stock',
      cell: (row) => (
        <Link href={`/inventory/plastic/${row.id}`} className="underline-offset-2 hover:underline">
          {row.stockCode}
        </Link>
      ),
    },
    { id: 'item', header: 'Item', cell: (row) => row.catalogItemName },
    { id: 'size', header: 'Size', cell: (row) => row.sizeLabel || '—' },
    {
      id: 'left',
      header: 'Left',
      cell: (row) => (
        <RemainingCell left={row.boxesOnHand} total={row.boxesReceived} unit={row.unit} />
      ),
    },
    { id: 'shelf', header: 'Shelf', cell: (row) => row.locationName || '—' },
  ];

  const historyColumns: DataTableColumn<InventoryStorageMovementRow>[] = [
    {
      id: 'when',
      header: 'When',
      cell: (row) => new Date(row.createdAt).toLocaleString(),
    },
    { id: 'type', header: 'Type', cell: (row) => row.movementType },
    { id: 'label', header: 'Ref', cell: (row) => row.label },
    {
      id: 'qty',
      header: 'Moved',
      cell: (row) => (
        <span className="tabular-nums">
          {row.qty} {row.unit}
        </span>
      ),
    },
    { id: 'who', header: 'By', cell: (row) => row.employeeName || '—' },
    { id: 'notes', header: 'Notes', cell: (row) => row.notes || '—' },
  ];

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
      <p className="mb-6 max-w-2xl text-sm text-muted">
        {area?.description ?? meta.transferHint ?? ''}
      </p>
      {isError ? <p className="mb-4 text-sm text-danger">Unable to load this storage area.</p> : null}

      {kind !== 'stationery' ? (
        <StoragePreviewTable
          title="Measured lots"
          columns={lotColumns}
          rows={area?.lots ?? []}
          loading={isLoading}
          emptyTitle="No measured lots here"
          emptyDescription={
            kind === 'stock_room'
              ? 'Receive chemicals/reagents into Stock room, then transfer them to Inside lab.'
              : 'Transfer lots from Stock room, or create output lots via Inside lab work.'
          }
        />
      ) : null}

      {kind !== 'inside_lab' ? (
        <StoragePreviewTable
          title="Box stock"
          columns={plasticColumns}
          rows={area?.plastic ?? []}
          loading={isLoading}
          emptyTitle="No box stock here"
          emptyDescription="Receive plasticware or stationery via Receive and attach to this usage area."
        />
      ) : null}

      <StoragePreviewTable
        title="Recent history"
        columns={historyColumns}
        rows={area?.recentMovements ?? []}
        loading={isLoading}
        emptyTitle="No movements yet"
        emptyDescription="Receives, transfers, take-outs, and consumption appear here."
      />
    </>
  );
}
