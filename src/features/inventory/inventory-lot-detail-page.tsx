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
import { printInventoryLotLabel } from '@/features/inventory/inventory-lot-print';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useAdjustInventoryLotMutation,
  useGetInventoryLotExpenseQuery,
  useGetInventoryLotMovementsQuery,
  useGetInventoryLotQuery,
  useLazyGetInventoryLotPrintQuery,
} from '@/store/api/api';

export function InventoryLotDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage = permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const canAdjust = permissions.includes(PERMISSIONS.INVENTORY_LOTS_ADJUST);
  const { data, isLoading, isError } = useGetInventoryLotQuery(id, { skip: !canManage || !id });
  const { data: movementsData, isLoading: movementsLoading } = useGetInventoryLotMovementsQuery(id, {
    skip: !canManage || !id,
  });
  const { data: expenseData } = useGetInventoryLotExpenseQuery(id, { skip: !canManage || !id });
  const [fetchPrint, { isFetching: printing }] = useLazyGetInventoryLotPrintQuery();
  const [adjustLot, { isLoading: adjusting }] = useAdjustInventoryLotMutation();
  const [error, setError] = useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const lot = data?.data;
  const expense = expenseData?.data;

  async function onPrint() {
    if (!lot) return;
    setError(null);
    try {
      const print = await fetchPrint(lot.id).unwrap();
      printInventoryLotLabel(print.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to open label print.'));
    }
  }

  async function onAdjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lot) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await adjustLot({
        id: lot.id,
        body: {
          remainingQty: Number(form.get('remainingQty') ?? 0),
          notes: String(form.get('notes') ?? '').trim(),
        },
      }).unwrap();
      setAdjustOpen(false);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to adjust lot.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Lot" />
        <p className="text-sm text-muted">You need lots manage permission.</p>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Lot" />
        <p className="text-sm text-muted">Loading…</p>
      </>
    );
  }

  if (isError || !lot) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Lot" />
        <p className="text-sm">Lot not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/inventory/lots">Back to lots</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={printing || adjusting} />
      <PageHeader
        kicker="Inventory"
        title={lot.lotCode}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={onPrint}>
              Print QR label
            </Button>
            {canAdjust ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setAdjustOpen(true);
                }}
              >
                Adjust stock
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/inventory/lots">All lots</Link>
            </Button>
          </div>
        }
      />
      {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}

      <div className="mb-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        <div className="rounded border border-border px-4 py-3">
          <Meta>Item</Meta>
          <p className="mt-1 text-sm font-medium">{lot.catalogItemName}</p>
          <p className="text-xs text-muted">
            {lot.categoryName} · {lot.locationName}
          </p>
        </div>
        <div className="rounded border border-border px-4 py-3">
          <Meta>Stock on hand</Meta>
          <p className="mt-1 text-2xl font-medium tabular-nums">
            {lot.remainingQty} <span className="text-sm font-normal text-muted">{lot.unit}</span>
          </p>
          <p className="text-xs text-muted">
            Received {lot.receivedQty} · {lot.status}
          </p>
        </div>
        <div className="rounded border border-border px-4 py-3">
          <Meta>Supplier</Meta>
          <p className="mt-1 text-sm">
            {lot.supplierName || '—'} ({lot.supplierType})
          </p>
          <p className="text-xs text-muted">Purchased {lot.purchaseDate}</p>
        </div>
        <div className="rounded border border-border px-4 py-3">
          <Meta>Defaults</Meta>
          <p className="mt-1 text-sm">
            Chips: {lot.qtyChips.length ? formatQtyChips(lot.qtyChips) : '—'}
          </p>
          <p className="text-xs text-muted">
            Expiry {lot.expiryDate ?? '—'} · Origin {lot.origin}
          </p>
        </div>
        <div className="rounded border border-border px-4 py-3 sm:col-span-2">
          <Meta>Expense</Meta>
          <p className="mt-1 text-sm">
            Purchase {lot.totalCost.toFixed(2)} · Components {(lot.componentCostTotal ?? 0).toFixed(2)}
            {expense ? (
              <>
                {' '}
                · Reportable <span className="font-medium">{expense.reportableExpense.toFixed(2)}</span>
              </>
            ) : null}
          </p>
          <p className="text-xs text-muted">
            {expense?.note ??
              (lot.origin === 'prep'
                ? 'Lab-made: reportable spend is component cost only.'
                : 'Purchased: reportable spend is purchase cost.')}
          </p>
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
              id: 'qty',
              header: 'Qty',
              cell: (row) => `${row.qty} ${row.unit}`,
            },
            {
              id: 'balance',
              header: 'Balance',
              cell: (row) => `${row.qtyBefore} → ${row.qtyAfter}`,
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
          emptyDescription="Receipt and issues will appear here."
        />
      </section>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogTitle>Adjust remaining stock</DialogTitle>
          <DialogDescription>
            Use for leakage or recount. Reason is required and written to the ledger.
          </DialogDescription>
          <form className="mt-4 space-y-4" onSubmit={onAdjust}>
            <div>
              <Label htmlFor="remainingQty">New remaining qty ({lot.unit})</Label>
              <Input
                id="remainingQty"
                name="remainingQty"
                type="number"
                min={0}
                max={lot.receivedQty}
                step="any"
                defaultValue={lot.remainingQty}
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
