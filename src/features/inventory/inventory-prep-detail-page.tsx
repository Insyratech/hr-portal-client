'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { SELECT_CLASS, formatQtyChips } from '@/features/inventory/inventory-constants';
import { printInventoryLotLabel } from '@/features/inventory/inventory-lot-print';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useAddInventoryPrepInputMutation,
  useCancelInventoryPrepSessionMutation,
  useCompleteInventoryPrepSessionMutation,
  useGetInventoryLotsQuery,
  useGetInventoryPrepSessionQuery,
  useLazyGetInventoryLotPrintQuery,
} from '@/store/api/api';

const INPUT_CODES = new Set(['CHEMICALS', 'SOLVENTS']);

export function InventoryPrepDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage =
    permissions.includes(PERMISSIONS.INVENTORY_PREP_MANAGE) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const { data, isLoading, isError } = useGetInventoryPrepSessionQuery(id, {
    skip: !canManage || !id,
  });
  const { data: lotsData } = useGetInventoryLotsQuery(undefined, { skip: !canManage });
  const [addInput, { isLoading: adding }] = useAddInventoryPrepInputMutation();
  const [completeSession, { isLoading: completing }] = useCompleteInventoryPrepSessionMutation();
  const [cancelSession, { isLoading: cancelling }] = useCancelInventoryPrepSessionMutation();
  const [fetchPrint] = useLazyGetInventoryLotPrintQuery();
  const [error, setError] = useState<string | null>(null);
  const session = data?.data;

  const sourceLots = useMemo(
    () =>
      (lotsData?.data ?? []).filter(
        (lot) =>
          lot.status === 'active' &&
          lot.remainingQty > 0 &&
          INPUT_CODES.has(lot.categoryCode),
      ),
    [lotsData?.data],
  );

  async function onAddInput(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await addInput({
        id: session.id,
        body: {
          sourceLotId: String(form.get('sourceLotId') ?? ''),
          qty: Number(form.get('qty') ?? 0),
          notes: String(form.get('notes') ?? '').trim() || undefined,
        },
      }).unwrap();
      event.currentTarget.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to issue for prep.'));
    }
  }

  async function onComplete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const completed = await completeSession({
        id: session.id,
        body: {
          expiryDate: String(form.get('expiryDate') ?? '').trim() || null,
          notes: String(form.get('notes') ?? '').trim() || undefined,
        },
      }).unwrap();
      const lotId = completed.data.reagentLotId;
      if (lotId) {
        try {
          const print = await fetchPrint(lotId).unwrap();
          printInventoryLotLabel(print.data);
        } catch {
          // Prep succeeded even if print window failed.
        }
        router.push(`/inventory/lots/${lotId}`);
      }
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to complete prep.'));
    }
  }

  async function onCancel() {
    if (!session) return;
    setError(null);
    try {
      await cancelSession(session.id).unwrap();
      router.push('/inventory/prep');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to cancel prep.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Prep session" />
        <p className="text-sm text-muted">You need prep or lots manage permission.</p>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Prep session" />
        <p className="text-sm text-muted">Loading…</p>
      </>
    );
  }

  if (isError || !session) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Prep session" />
        <p className="text-sm">Session not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/inventory/prep">Back</Link>
        </Button>
      </>
    );
  }

  const busy = adding || completing || cancelling;
  const isOpen = session.status === 'open';

  return (
    <>
      <DelayedLoadingOverlay active={busy} />
      <PageHeader
        kicker="Inventory"
        title={session.catalogItemName}
        actions={
          <Button asChild variant="outline">
            <Link href="/inventory/prep">All prep</Link>
          </Button>
        }
      />
      {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}

      <div className="mb-8 grid max-w-3xl gap-3 sm:grid-cols-2">
        <div className="rounded border border-border px-4 py-3">
          <Meta>Target</Meta>
          <p className="mt-1 text-2xl font-medium tabular-nums">
            {session.targetQty}{' '}
            <span className="text-sm font-normal text-muted">{session.unit}</span>
          </p>
          <p className="text-xs text-muted">
            {session.locationName} · {session.status}
          </p>
        </div>
        <div className="rounded border border-border px-4 py-3">
          <Meta>Component cost</Meta>
          <p className="mt-1 text-2xl font-medium tabular-nums">
            {session.componentCostTotal.toFixed(2)}
          </p>
          <p className="text-xs text-muted">
            Reportable spend for lab-made reagents (purchase cost excluded)
          </p>
        </div>
        <div className="rounded border border-border px-4 py-3">
          <Meta>Qty chips</Meta>
          <p className="mt-1 text-sm">
            {session.qtyChips.length ? formatQtyChips(session.qtyChips) : '—'}
          </p>
        </div>
        <div className="rounded border border-border px-4 py-3">
          <Meta>Reagent lot</Meta>
          <p className="mt-1 text-sm">
            {session.reagentLotId && session.reagentLotCode ? (
              <Link
                href={`/inventory/lots/${session.reagentLotId}`}
                className="underline-offset-2 hover:underline"
              >
                {session.reagentLotCode}
              </Link>
            ) : (
              'Not created yet'
            )}
          </p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-medium">Inputs (chemicals / solvents)</h2>
        <DataTable
          columns={[
            { id: 'lot', header: 'Lot', cell: (row) => row.sourceLotCode },
            { id: 'item', header: 'Item', cell: (row) => row.sourceItemName },
            {
              id: 'qty',
              header: 'Qty',
              cell: (row) => `${row.qty} ${row.unit}`,
            },
            {
              id: 'cost',
              header: 'Attributed cost',
              cell: (row) => row.attributedCost.toFixed(2),
            },
            {
              id: 'when',
              header: 'When',
              cell: (row) => new Date(row.createdAt).toLocaleString(),
            },
          ]}
          rows={session.inputs}
          emptyTitle="No inputs yet"
          emptyDescription="Issue from an active Chemicals or Solvents lot below."
        />
      </section>

      {isOpen ? (
        <>
          <section className="mb-8 max-w-2xl">
            <h2 className="mb-3 text-sm font-medium">Issue into this prep</h2>
            <form className="space-y-4" onSubmit={onAddInput}>
              <div>
                <Label htmlFor="sourceLotId">Source lot</Label>
                <select
                  id="sourceLotId"
                  name="sourceLotId"
                  className={SELECT_CLASS}
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select chemical / solvent lot
                  </option>
                  {sourceLots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.lotCode} · {lot.catalogItemName} ({lot.remainingQty} {lot.unit} left)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="qty">Quantity</Label>
                  <Input id="qty" name="qty" type="number" min={0.0001} step="any" required />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" />
                </div>
              </div>
              <Button type="submit" disabled={adding || sourceLots.length === 0}>
                {adding ? 'Issuing…' : 'Issue to prep'}
              </Button>
            </form>
          </section>

          <section className="max-w-2xl space-y-4">
            <h2 className="text-sm font-medium">Complete prep</h2>
            <p className="text-sm text-muted">
              Creates one parent QR lot for {session.targetQty} {session.unit}. Aliquots later scan
              that QR only — no new labels.
            </p>
            <form className="space-y-4" onSubmit={onComplete}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="expiryDate">Expiry (optional)</Label>
                  <Input id="expiryDate" name="expiryDate" type="date" />
                </div>
                <div>
                  <Label htmlFor="completeNotes">Notes</Label>
                  <Input id="completeNotes" name="notes" defaultValue={session.notes} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={completing || session.inputs.length === 0}>
                  {completing ? 'Completing…' : 'Complete & print QR'}
                </Button>
                {session.inputs.length === 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={cancelling}
                    onClick={() => void onCancel()}
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel session'}
                  </Button>
                ) : null}
              </div>
            </form>
          </section>
        </>
      ) : null}
    </>
  );
}
