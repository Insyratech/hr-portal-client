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
import { salesStatusTone } from '@/features/finance/finance-procurement-utils';
import { printSalesDocument } from '@/features/finance/finance-sales-print';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useCreateFinanceDeliveryNoteFromSalesOrderMutation,
  useGetFinanceDeliveryNotesQuery,
  useGetFinanceSalesOrderQuery,
  useGetFinanceSalesOrdersQuery,
  useLazyGetFinanceDeliveryNotePrintQuery,
  usePostFinanceDeliveryNoteMutation,
} from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

type DeliveryLineDraft = {
  salesOrderLineId: string;
  description: string;
  remaining: number;
  quantityDelivered: string;
};

export function FinanceDeliveryNotesPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_SALES_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_SALES_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_SALES_MANAGE);

  const { data, isLoading, isError } = useGetFinanceDeliveryNotesQuery(undefined, { skip: !canView });
  const { data: ordersData } = useGetFinanceSalesOrdersQuery(undefined, { skip: !canManage });
  const [createNote, { isLoading: creating }] = useCreateFinanceDeliveryNoteFromSalesOrderMutation();
  const [postNote, { isLoading: posting }] = usePostFinanceDeliveryNoteMutation();
  const [fetchPrint, { isFetching: printing }] = useLazyGetFinanceDeliveryNotePrintQuery();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [salesOrderId, setSalesOrderId] = useState('');
  const [lineDrafts, setLineDrafts] = useState<DeliveryLineDraft[]>([]);

  const { data: orderDetail } = useGetFinanceSalesOrderQuery(salesOrderId, { skip: !salesOrderId });

  const deliverableOrders = useMemo(
    () =>
      (ordersData?.data ?? []).filter((order) =>
        ['confirmed', 'partially_delivered'].includes(order.status.toLowerCase()),
      ),
    [ordersData],
  );

  useEffect(() => {
    if (!orderDetail?.data) {
      setLineDrafts([]);
      return;
    }
    setLineDrafts(
      orderDetail.data.lines
        .map((line) => {
          const remaining = Math.max(0, line.quantity - line.quantityDelivered);
          return {
            salesOrderLineId: line.id,
            description: line.description,
            remaining,
            quantityDelivered: remaining > 0 ? String(remaining) : '0',
          };
        })
        .filter((line) => line.remaining > 0),
    );
  }, [orderDetail]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const lines = lineDrafts
      .map((line) => ({
        salesOrderLineId: line.salesOrderLineId,
        quantityDelivered: Number(line.quantityDelivered),
      }))
      .filter((line) => line.quantityDelivered > 0);
    if (!lines.length) {
      setError('Enter quantity delivered for at least one line.');
      return;
    }
    try {
      await createNote({
        salesOrderId,
        deliveryDate: String(form.get('deliveryDate') ?? '').trim() || undefined,
        notes: String(form.get('notes') ?? '').trim() || undefined,
        lines,
      }).unwrap();
      setCreateOpen(false);
      setSalesOrderId('');
      setLineDrafts([]);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create delivery note.'));
    }
  }

  async function onPost(id: string) {
    setError(null);
    try {
      await postNote(id).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to post delivery note.'));
    }
  }

  async function onPrint(id: string) {
    setError(null);
    try {
      const result = await fetchPrint(id).unwrap();
      printSalesDocument(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to load print payload.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Sales" title="Delivery notes" />
        <p className="max-w-2xl text-sm text-muted">You need sales view permission to open delivery notes.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || posting || printing} />
      <PageHeader
        kicker="Sales"
        title="Delivery notes"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setSalesOrderId('');
                setLineDrafts([]);
                setCreateOpen(true);
              }}
            >
              From sales order
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Record deliveries against confirmed sales orders, then post and print.
      </p>
      {error && !createOpen ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load delivery notes.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'so', header: 'Sales order', cell: (row) => row.salesOrderNumber || '—' },
          { id: 'customer', header: 'Customer', cell: (row) => row.customerName || '—' },
          { id: 'date', header: 'Date', cell: (row) => row.deliveryDate },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={salesStatusTone(row.status)} label={row.status} />,
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => void onPrint(row.id)}>
                  Print
                </Button>
                {canManage && row.status === 'draft' ? (
                  <Button type="button" size="sm" onClick={() => void onPost(row.id)}>
                    Post
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No delivery notes"
        emptyDescription="Create a delivery note from a confirmed sales order."
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>Delivery note from sales order</DialogTitle>
          <DialogDescription>Choose a sales order and enter quantities delivered.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="salesOrderId">Sales order</Label>
              <select
                id="salesOrderId"
                className={SELECT_CLASS}
                value={salesOrderId}
                onChange={(event) => setSalesOrderId(event.target.value)}
                required
              >
                <option value="">Select sales order</option>
                {deliverableOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.documentNumber} — {order.customerName || 'Customer'} ({order.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="deliveryDate">Delivery date</Label>
                <Input id="deliveryDate" name="deliveryDate" type="date" />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Lines</Label>
              {!lineDrafts.length ? (
                <p className="text-sm text-muted">Select a sales order with remaining quantity to deliver.</p>
              ) : (
                lineDrafts.map((line, index) => (
                  <div key={line.salesOrderLineId} className="grid gap-2 rounded border border-border p-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <p className="text-sm">{line.description}</p>
                      <p className="text-xs text-muted">Remaining: {line.remaining}</p>
                    </div>
                    <div>
                      <Label>Qty delivered</Label>
                      <Input
                        type="number"
                        min={0}
                        max={line.remaining}
                        step="any"
                        value={line.quantityDelivered}
                        onChange={(event) =>
                          setLineDrafts((prev) =>
                            prev.map((item, i) =>
                              i === index ? { ...item, quantityDelivered: event.target.value } : item,
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
              <Button type="submit" loading={creating} disabled={!salesOrderId}>
                Create delivery note
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
