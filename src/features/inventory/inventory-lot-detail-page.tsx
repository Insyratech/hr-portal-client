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
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { formatQtyChips } from '@/features/inventory/inventory-constants';
import { printInventoryLotLabel } from '@/features/inventory/inventory-lot-print';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
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
  const toast = useToast();
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
  const [adjustOpen, setAdjustOpen] = useState(false);
  const lot = data?.data;
  const expense = expenseData?.data;

  async function onPrint() {
    if (!lot) return;
    try {
      const print = await fetchPrint(lot.id).unwrap();
      printInventoryLotLabel(print.data);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to open label print.'));
    }
  }

  async function onAdjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lot) return;
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
      toast.success('Lot stock adjusted.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to adjust lot.'));
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

  const usedQty = Math.max(0, lot.receivedQty - lot.remainingQty);

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
              <Button type="button" variant="outline" onClick={() => setAdjustOpen(true)}>
                Adjust stock
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/inventory/lots">All lots</Link>
            </Button>
          </div>
        }
      />

      <p className="mb-6 max-w-2xl text-sm text-muted">
        One physical bottle with its own QR. Aliquots always scan this same parent label.
      </p>

      <section className="mb-8 max-w-3xl">
        <Meta>Stock on hand</Meta>
        <div className="mt-3 rounded border border-border px-5 py-5">
          <p className="text-3xl font-medium tabular-nums tracking-tight">
            {lot.remainingQty}{' '}
            <span className="text-base font-normal text-muted">{lot.unit}</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            Remaining of this bottle. Unit is the catalog measuring unit used when the lot was
            received.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Received</dt>
              <dd className="mt-0.5 text-sm tabular-nums">
                {lot.receivedQty} {lot.unit}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Used / adjusted out</dt>
              <dd className="mt-0.5 text-sm tabular-nums">
                {usedQty} {lot.unit}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Status</dt>
              <dd className="mt-0.5 text-sm capitalize">{lot.status}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mb-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        <div className="rounded border border-border px-4 py-3">
          <Meta>Item</Meta>
          <p className="mt-1 text-sm font-medium">{lot.catalogItemName}</p>
          <p className="text-xs text-muted">
            {lot.categoryName} · {lot.locationName} ({lot.locationCode})
          </p>
        </div>
        <div className="rounded border border-border px-4 py-3">
          <Meta>Supplier</Meta>
          <p className="mt-1 text-sm">
            {lot.supplierName || '—'} ({lot.supplierType})
          </p>
          <p className="text-xs text-muted">
            {lot.origin === 'prep' ? 'Prep completed' : 'Purchased'} {lot.purchaseDate}
          </p>
        </div>
        <div className="rounded border border-border px-4 py-3">
          <Meta>Kiosk chips</Meta>
          <p className="mt-1 text-sm">
            {lot.qtyChips.length ? formatQtyChips(lot.qtyChips) : '—'}{' '}
            <span className="text-muted">{lot.unit}</span>
          </p>
          <p className="text-xs text-muted">Quick amounts on the public scan card for this lot.</p>
        </div>
        <div className="rounded border border-border px-4 py-3">
          <Meta>Expiry & origin</Meta>
          <p className="mt-1 text-sm">{lot.expiryDate ?? 'No expiry set'}</p>
          <p className="text-xs text-muted capitalize">Origin: {lot.origin}</p>
        </div>
        <div className="rounded border border-border px-4 py-3 sm:col-span-2">
          <Meta>Expense</Meta>
          <p className="mt-1 text-sm tabular-nums">
            Purchase {lot.totalCost.toFixed(2)} · Components {(lot.componentCostTotal ?? 0).toFixed(2)}
            {expense ? (
              <>
                {' '}
                · Reportable{' '}
                <span className="font-medium">{expense.reportableExpense.toFixed(2)}</span>
              </>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-muted">
            {expense?.note ??
              (lot.origin === 'prep'
                ? 'Lab-made: reportable spend is component cost only.'
                : 'Purchased lot: reportable spend is the entered purchase cost.')}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-medium">Movement ledger</h2>
        <p className="mb-3 text-xs text-muted">
          Every receive, issue (kiosk), and adjustment for this bottle.
        </p>
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
          emptyTitle="No movements yet"
          emptyDescription="After receive, the first ledger row appears here. Issues from the scan card show next."
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
