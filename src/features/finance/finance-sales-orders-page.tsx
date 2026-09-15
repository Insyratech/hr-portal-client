'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
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
import {
  formatInr,
  newMoneyLine,
  salesStatusTone,
  type MoneyLineDraft,
} from '@/features/finance/finance-procurement-utils';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useConfirmFinanceSalesOrderMutation,
  useCreateFinanceSalesOrderFromQuoteMutation,
  useCreateFinanceSalesOrderMutation,
  useGetFinanceCustomersQuery,
  useGetFinanceSalesOrdersQuery,
  useGetFinanceSalesQuotesQuery,
} from '@/store/api/api';
import type { SalesOrder } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceSalesOrdersPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_SALES_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_SALES_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_SALES_MANAGE);

  const { data, isLoading, isError } = useGetFinanceSalesOrdersQuery(undefined, { skip: !canView });
  const { data: customersData } = useGetFinanceCustomersQuery(undefined, { skip: !canManage });
  const { data: quotesData } = useGetFinanceSalesQuotesQuery(undefined, { skip: !canManage });
  const [createOrder, { isLoading: creating }] = useCreateFinanceSalesOrderMutation();
  const [createFromQuote, { isLoading: converting }] = useCreateFinanceSalesOrderFromQuoteMutation();
  const [confirmOrder, { isLoading: confirming }] = useConfirmFinanceSalesOrderMutation();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [fromQuoteOpen, setFromQuoteOpen] = useState(false);
  const [detail, setDetail] = useState<SalesOrder | null>(null);
  const [lines, setLines] = useState<MoneyLineDraft[]>([newMoneyLine()]);

  const acceptedQuotes = useMemo(
    () => (quotesData?.data ?? []).filter((quote) => quote.status === 'accepted'),
    [quotesData],
  );

  async function onCreateManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const prepared = lines
      .map((line) => ({
        description: line.description.trim(),
        quantity: Number(line.quantity),
        unit: line.unit.trim() || 'nos',
        rate: Number(line.rate),
        taxPercent: Number(line.taxPercent),
      }))
      .filter((line) => line.description && line.quantity > 0);
    if (!prepared.length) {
      setError('Add at least one sales order line.');
      return;
    }
    try {
      await createOrder({
        customerId: String(form.get('customerId') ?? ''),
        orderDate: String(form.get('orderDate') ?? '').trim() || undefined,
        expectedDelivery: String(form.get('expectedDelivery') ?? '').trim() || null,
        billingAddress: String(form.get('billingAddress') ?? '').trim() || undefined,
        shippingAddress: String(form.get('shippingAddress') ?? '').trim() || undefined,
        notes: String(form.get('notes') ?? '').trim() || undefined,
        lines: prepared,
      }).unwrap();
      setCreateOpen(false);
      setLines([newMoneyLine()]);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create sales order.'));
    }
  }

  async function onCreateFromQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await createFromQuote({
        quoteId: String(form.get('quoteId') ?? ''),
        orderDate: String(form.get('orderDate') ?? '').trim() || undefined,
        expectedDelivery: String(form.get('expectedDelivery') ?? '').trim() || null,
        billingAddress: String(form.get('billingAddress') ?? '').trim() || undefined,
        shippingAddress: String(form.get('shippingAddress') ?? '').trim() || undefined,
        notes: String(form.get('notes') ?? '').trim() || undefined,
      }).unwrap();
      setFromQuoteOpen(false);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create sales order from quote.'));
    }
  }

  async function onConfirm(id: string) {
    setError(null);
    try {
      const result = await confirmOrder(id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to confirm sales order.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Sales" title="Sales orders" />
        <p className="max-w-2xl text-sm text-muted">You need sales view permission to open sales orders.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || converting || confirming} />
      <PageHeader
        kicker="Sales"
        title="Sales orders"
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setFromQuoteOpen(true);
                }}
              >
                From quote
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setError(null);
                  setLines([newMoneyLine()]);
                  setCreateOpen(true);
                }}
              >
                New sales order
              </Button>
            </div>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Create sales orders manually or from an accepted quote, then confirm for fulfillment.
      </p>
      {error && !createOpen && !fromQuoteOpen && !detail ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load sales orders.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'customer', header: 'Customer', cell: (row) => row.customerName || '—' },
          { id: 'orderDate', header: 'Date', cell: (row) => row.orderDate },
          { id: 'total', header: 'Total', cell: (row) => formatInr(row.grandTotal) },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={salesStatusTone(row.status)} label={row.status} />,
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (row) => (
              <Button type="button" variant="outline" size="sm" onClick={() => setDetail(row)}>
                Open
              </Button>
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No sales orders"
        emptyDescription="Create a sales order from a quote or enter one manually."
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>New sales order</DialogTitle>
          <DialogDescription>Manual sales order with line items and tax.</DialogDescription>
          <form onSubmit={onCreateManual} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="customerId">Customer</Label>
              <select id="customerId" name="customerId" className={SELECT_CLASS} required>
                <option value="">Select customer</option>
                {(customersData?.data ?? []).map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="orderDate">Order date</Label>
                <Input id="orderDate" name="orderDate" type="date" />
              </div>
              <div>
                <Label htmlFor="expectedDelivery">Expected delivery</Label>
                <Input id="expectedDelivery" name="expectedDelivery" type="date" />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" />
              </div>
            </div>
            <div>
              <Label htmlFor="billingAddress">Billing address</Label>
              <Input id="billingAddress" name="billingAddress" />
            </div>
            <div>
              <Label htmlFor="shippingAddress">Shipping address</Label>
              <Input id="shippingAddress" name="shippingAddress" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Lines</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLines((prev) => [...prev, newMoneyLine()])}
                >
                  Add line
                </Button>
              </div>
              {lines.map((line, index) => (
                <div key={line.key} className="grid gap-2 sm:grid-cols-12">
                  <Input
                    className="sm:col-span-4"
                    placeholder="Description"
                    value={line.description}
                    onChange={(event) =>
                      setLines((prev) =>
                        prev.map((item, i) => (i === index ? { ...item, description: event.target.value } : item)),
                      )
                    }
                    required
                  />
                  <Input
                    className="sm:col-span-2"
                    type="number"
                    min={0.01}
                    step="any"
                    value={line.quantity}
                    onChange={(event) =>
                      setLines((prev) =>
                        prev.map((item, i) => (i === index ? { ...item, quantity: event.target.value } : item)),
                      )
                    }
                    required
                  />
                  <Input
                    className="sm:col-span-2"
                    value={line.unit}
                    onChange={(event) =>
                      setLines((prev) =>
                        prev.map((item, i) => (i === index ? { ...item, unit: event.target.value } : item)),
                      )
                    }
                  />
                  <Input
                    className="sm:col-span-2"
                    type="number"
                    min={0}
                    step="any"
                    value={line.rate}
                    onChange={(event) =>
                      setLines((prev) =>
                        prev.map((item, i) => (i === index ? { ...item, rate: event.target.value } : item)),
                      )
                    }
                    required
                  />
                  <Input
                    className="sm:col-span-1"
                    type="number"
                    min={0}
                    step="any"
                    value={line.taxPercent}
                    onChange={(event) =>
                      setLines((prev) =>
                        prev.map((item, i) => (i === index ? { ...item, taxPercent: event.target.value } : item)),
                      )
                    }
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="sm:col-span-1"
                    disabled={lines.length === 1}
                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creating}>
                Create sales order
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={fromQuoteOpen} onOpenChange={setFromQuoteOpen}>
        <DialogContent>
          <DialogTitle>Sales order from quote</DialogTitle>
          <DialogDescription>Convert an accepted quote into a sales order.</DialogDescription>
          <form onSubmit={onCreateFromQuote} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="quoteId">Accepted quote</Label>
              <select id="quoteId" name="quoteId" className={SELECT_CLASS} required>
                <option value="">Select quote</option>
                {acceptedQuotes.map((quote) => (
                  <option key={quote.id} value={quote.id}>
                    {quote.documentNumber} — {quote.customerName || 'Customer'} ({formatInr(quote.grandTotal)})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="orderDate">Order date</Label>
                <Input id="orderDate" name="orderDate" type="date" />
              </div>
              <div>
                <Label htmlFor="expectedDelivery">Expected delivery</Label>
                <Input id="expectedDelivery" name="expectedDelivery" type="date" />
              </div>
            </div>
            <div>
              <Label htmlFor="billingAddress">Billing address</Label>
              <Input id="billingAddress" name="billingAddress" />
            </div>
            <div>
              <Label htmlFor="shippingAddress">Shipping address</Label>
              <Input id="shippingAddress" name="shippingAddress" />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setFromQuoteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={converting}>
                Create sales order
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>{detail?.documentNumber ?? 'Sales order'}</DialogTitle>
          <DialogDescription>Confirm the order and review delivered / invoiced quantities.</DialogDescription>
          {detail ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted">Customer:</span> {detail.customerName || '—'}
                </p>
                <p>
                  <StatusBadge status={salesStatusTone(detail.status)} label={detail.status} />
                </p>
                <p>
                  <span className="text-muted">Total:</span> {formatInr(detail.grandTotal)}
                </p>
                <p>
                  <span className="text-muted">Order date:</span> {detail.orderDate}
                </p>
              </div>
              <DataTable
                columns={[
                  { id: 'description', header: 'Description', cell: (row) => row.description },
                  {
                    id: 'qty',
                    header: 'Qty',
                    cell: (row) =>
                      `${row.quantity} (${row.quantityDelivered} del · ${row.quantityInvoiced} inv)`,
                  },
                  { id: 'rate', header: 'Rate', cell: (row) => formatInr(row.rate) },
                  { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount + row.taxAmount) },
                ]}
                rows={detail.lines}
                emptyTitle="No lines"
                emptyDescription="This sales order has no lines."
              />
              {canManage && detail.status === 'draft' ? (
                <Button type="button" onClick={() => void onConfirm(detail.id)}>
                  Confirm
                </Button>
              ) : null}
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
