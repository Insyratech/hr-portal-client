'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { formatQtyChips } from '@/features/inventory/inventory-constants';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useAdjustInventoryPlasticStockMutation,
  useGetInventoryPlasticMovementsQuery,
  useGetInventoryPlasticStockItemQuery,
} from '@/store/api/api';

export function InventoryPlasticDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage =
    permissions.includes(PERMISSIONS.INVENTORY_PLASTIC_MANAGE) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const canAdjust =
    permissions.includes(PERMISSIONS.INVENTORY_PLASTIC_ADJUST) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_ADJUST);
  const { data, isLoading, isError } = useGetInventoryPlasticStockItemQuery(id, {
    skip: !canManage || !id,
  });
  const { data: movementsData, isLoading: movementsLoading } = useGetInventoryPlasticMovementsQuery(
    id,
    { skip: !canManage || !id },
  );
  const [adjustStock, { isLoading: adjusting }] = useAdjustInventoryPlasticStockMutation();
  const [error, setError] = useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const stock = data?.data;

  async function onAdjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stock) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await adjustStock({
        id: stock.id,
        body: {
          boxesOnHand: Number(form.get('boxesOnHand') ?? 0),
          notes: String(form.get('notes') ?? '').trim(),
        },
      }).unwrap();
      setAdjustOpen(false);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to adjust plastic stock.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Plastic stock" />
        <p className="text-sm text-muted">You need plastic manage permission.</p>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Plastic stock" />
        <p className="text-sm text-muted">Loading…</p>
      </>
    );
  }

  if (isError || !stock) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Plastic stock" />
        <p className="text-sm">Stock line not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/inventory/plastic">Back</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={adjusting} />
      <PageHeader
        kicker="Inventory"
        title={`${stock.catalogItemName} · ${stock.sizeLabel}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {canAdjust ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setAdjustOpen(true);
                }}
              >
                Adjust boxes
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/inventory/plastic">All plastic</Link>
            </Button>
          </div>
        }
      />
      {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}

      <div className="mb-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        <div className="rounded border border-border px-4 py-3">
          <Meta>Stock on hand</Meta>
          <p className="mt-1 text-2xl font-medium tabular-nums">
            {stock.boxesOnHand}{' '}
            <span className="text-sm font-normal text-muted">{stock.unit}</span>
          </p>
          <p className="text-xs text-muted">
            Received {stock.boxesReceived} · {stock.status}
          </p>
        </div>
        <div className="rounded border border-border px-4 py-3">
          <Meta>SKU</Meta>
          <p className="mt-1 text-sm font-medium">{stock.stockCode}</p>
          <p className="text-xs text-muted">
            {stock.manufacturer || '—'} · {stock.locationName}
          </p>
        </div>
        <div className="rounded border border-border px-4 py-3">
          <Meta>Supplier</Meta>
          <p className="mt-1 text-sm">
            {stock.supplierName || '—'} ({stock.supplierType})
          </p>
          <p className="text-xs text-muted">Purchased {stock.purchaseDate}</p>
        </div>
        <div className="rounded border border-border px-4 py-3">
          <Meta>Defaults</Meta>
          <p className="mt-1 text-sm">
            Chips: {stock.qtyChips.length ? formatQtyChips(stock.qtyChips) : '—'}
          </p>
          <p className="text-xs text-muted">Cost {stock.totalCost.toFixed(2)}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium">Movement ledger</h2>
        <DataTable
          columns={[
            {
              id: 'when',
              header: 'When',
              cell: (row) => new Date(row.createdAt).toLocaleString(),
            },
            { id: 'type', header: 'Type', cell: (row) => row.movementType },
            {
              id: 'boxes',
              header: 'Boxes',
              cell: (row) => `${row.boxes} ${row.unit}`,
            },
            {
              id: 'balance',
              header: 'Balance',
              cell: (row) => `${row.boxesBefore} → ${row.boxesAfter}`,
            },
            {
              id: 'who',
              header: 'Employee',
              cell: (row) => row.employeeName ?? '—',
            },
            { id: 'notes', header: 'Notes', cell: (row) => row.notes || '—' },
          ]}
          rows={movementsData?.data ?? []}
          loading={movementsLoading}
          emptyTitle="No movements"
          emptyDescription="Receipt and station issues will appear here."
        />
      </section>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogTitle>Adjust boxes on hand</DialogTitle>
          <DialogDescription>
            Use for leakage or recount. Reason is required and written to the ledger.
          </DialogDescription>
          <form className="mt-4 space-y-4" onSubmit={onAdjust}>
            <div>
              <Label htmlFor="boxesOnHand">New boxes on hand</Label>
              <Input
                id="boxesOnHand"
                name="boxesOnHand"
                type="number"
                min={0}
                max={stock.boxesReceived}
                step={1}
                defaultValue={stock.boxesOnHand}
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Reason</Label>
              <Input id="notes" name="notes" required placeholder="Leakage / recount" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={adjusting}>
                {adjusting ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
