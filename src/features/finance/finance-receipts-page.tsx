'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
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
import { SELECT_CLASS } from '@/features/finance/finance-constants';
import { procurementStatusTone } from '@/features/finance/finance-procurement-utils';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useCreateFinanceReceiptMutation,
  useGetFinancePurchaseOrderQuery,
  useGetFinancePurchaseOrdersQuery,
  useGetFinanceReceiptsQuery,
  usePostFinanceReceiptMutation,
} from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

type ReceiptLineDraft = {
  purchaseOrderLineId: string;
  description: string;
  remaining: number;
  quantityReceived: string;
};

export function FinanceReceiptsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_INDENT_APPROVE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE);

  const { data, isLoading, isError } = useGetFinanceReceiptsQuery(undefined, { skip: !canView });
  const { data: posData } = useGetFinancePurchaseOrdersQuery(undefined, { skip: !canManage });
  const [createReceipt, { isLoading: creating }] = useCreateFinanceReceiptMutation();
  const [postReceipt, { isLoading: posting }] = usePostFinanceReceiptMutation();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [lineDrafts, setLineDrafts] = useState<ReceiptLineDraft[]>([]);

  const { data: poDetail } = useGetFinancePurchaseOrderQuery(purchaseOrderId, { skip: !purchaseOrderId });

  const receivablePos = useMemo(
    () =>
      (posData?.data ?? []).filter((po) =>
        ['issued', 'partially_received'].includes(po.status.toLowerCase()),
      ),
    [posData],
  );

  function onSelectPo(id: string) {
    setPurchaseOrderId(id);
  }

  useEffect(() => {
    if (!poDetail?.data) {
      setLineDrafts([]);
      return;
    }
    setLineDrafts(
      poDetail.data.lines
        .map((line) => {
          const remaining = Math.max(0, line.quantity - line.quantityReceived);
          return {
            purchaseOrderLineId: line.id,
            description: line.description,
            remaining,
            quantityReceived: remaining > 0 ? String(remaining) : '0',
          };
        })
        .filter((line) => line.remaining > 0),
    );
  }, [poDetail]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const lines = lineDrafts
      .map((line) => ({
        purchaseOrderLineId: line.purchaseOrderLineId,
        quantityReceived: Number(line.quantityReceived),
        description: line.description,
      }))
      .filter((line) => line.quantityReceived > 0);
    if (!lines.length) {
      setError('Enter quantity received for at least one line.');
      return;
    }
    try {
      await createReceipt({
        purchaseOrderId,
        receiptDate: String(form.get('receiptDate') ?? '').trim() || undefined,
        notes: String(form.get('notes') ?? '').trim() || undefined,
        lines,
      }).unwrap();
      setCreateOpen(false);
      setPurchaseOrderId('');
      setLineDrafts([]);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create receipt.'));
    }
  }

  async function onPost(id: string) {
    setError(null);
    try {
      await postReceipt(id).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to post receipt.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Purchases" title="Receipts" />
        <p className="max-w-2xl text-sm text-muted">You need purchase view permission to open receipts.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || posting} />
      <PageHeader
        kicker="Purchases"
        title="Receipts"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setPurchaseOrderId('');
                setLineDrafts([]);
                setCreateOpen(true);
              }}
            >
              New receipt
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Record goods received against issued or partially received purchase orders.
      </p>
      {error && !createOpen ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load receipts.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'po', header: 'PO', cell: (row) => row.purchaseOrderNumber || '—' },
          { id: 'date', header: 'Date', cell: (row) => row.receiptDate },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={procurementStatusTone(row.status)} label={row.status} />,
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (row) =>
              canManage && row.status === 'draft' ? (
                <Button type="button" size="sm" onClick={() => void onPost(row.id)}>
                  Post
                </Button>
              ) : (
                '—'
              ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No receipts"
        emptyDescription="Create a receipt from an issued purchase order."
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>New purchase receipt</DialogTitle>
          <DialogDescription>Choose a PO and enter quantities received.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="purchaseOrderId">Purchase order</Label>
              <select
                id="purchaseOrderId"
                className={SELECT_CLASS}
                value={purchaseOrderId}
                onChange={(event) => onSelectPo(event.target.value)}
                required
              >
                <option value="">Select PO</option>
                {receivablePos.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.documentNumber} — {po.vendorName || 'Vendor'} ({po.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="receiptDate">Receipt date</Label>
                <Input id="receiptDate" name="receiptDate" type="date" />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Lines</Label>
              {!lineDrafts.length ? (
                <p className="text-sm text-muted">Select a PO with remaining quantity to receive.</p>
              ) : (
                lineDrafts.map((line, index) => (
                  <div key={line.purchaseOrderLineId} className="grid gap-2 rounded border border-border p-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <p className="text-sm">{line.description}</p>
                      <p className="text-xs text-muted">Remaining: {line.remaining}</p>
                    </div>
                    <div>
                      <Label>Qty received</Label>
                      <Input
                        type="number"
                        min={0}
                        max={line.remaining}
                        step="any"
                        value={line.quantityReceived}
                        onChange={(event) =>
                          setLineDrafts((prev) =>
                            prev.map((item, i) =>
                              i === index ? { ...item, quantityReceived: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creating} disabled={!purchaseOrderId}>
                Create receipt
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
