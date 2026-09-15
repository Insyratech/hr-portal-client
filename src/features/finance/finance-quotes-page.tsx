'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
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
import { printSalesDocument } from '@/features/finance/finance-sales-print';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useConvertFinanceSalesQuoteToInvoiceMutation,
  useConvertFinanceSalesQuoteToOrderMutation,
  useCreateFinanceSalesQuoteMutation,
  useDecideFinanceSalesQuoteMutation,
  useExpireFinanceSalesQuoteMutation,
  useGetFinanceCustomersQuery,
  useGetFinanceSalesQuotesQuery,
  useLazyGetFinanceSalesQuotePrintQuery,
  useSendFinanceSalesQuoteMutation,
} from '@/store/api/api';
import type { SalesQuote } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceQuotesPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_SALES_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_SALES_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_SALES_MANAGE);

  const { data, isLoading, isError } = useGetFinanceSalesQuotesQuery(undefined, { skip: !canView });
  const { data: customersData } = useGetFinanceCustomersQuery(undefined, { skip: !canManage });
  const [createQuote, { isLoading: creating }] = useCreateFinanceSalesQuoteMutation();
  const [sendQuote, { isLoading: sending }] = useSendFinanceSalesQuoteMutation();
  const [decideQuote, { isLoading: deciding }] = useDecideFinanceSalesQuoteMutation();
  const [expireQuote, { isLoading: expiring }] = useExpireFinanceSalesQuoteMutation();
  const [convertToOrder, { isLoading: convertingOrder }] = useConvertFinanceSalesQuoteToOrderMutation();
  const [convertToInvoice, { isLoading: convertingInvoice }] =
    useConvertFinanceSalesQuoteToInvoiceMutation();
  const [fetchPrint, { isFetching: printing }] = useLazyGetFinanceSalesQuotePrintQuery();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<SalesQuote | null>(null);
  const [lines, setLines] = useState<MoneyLineDraft[]>([newMoneyLine()]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
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
      setError('Add at least one quote line.');
      return;
    }
    try {
      await createQuote({
        customerId: String(form.get('customerId') ?? ''),
        quoteDate: String(form.get('quoteDate') ?? '').trim() || undefined,
        expiryDate: String(form.get('expiryDate') ?? '').trim() || null,
        notes: String(form.get('notes') ?? '').trim() || undefined,
        terms: String(form.get('terms') ?? '').trim() || undefined,
        lines: prepared,
      }).unwrap();
      setCreateOpen(false);
      setLines([newMoneyLine()]);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create quote.'));
    }
  }

  async function onSend(id: string) {
    setError(null);
    try {
      const result = await sendQuote(id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to send quote.'));
    }
  }

  async function onDecide(id: string, decision: 'accept' | 'decline') {
    setError(null);
    try {
      const result = await decideQuote({ id, decision }).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, `Unable to ${decision} quote.`));
    }
  }

  async function onExpire(id: string) {
    setError(null);
    try {
      const result = await expireQuote(id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to expire quote.'));
    }
  }

  async function onConvertToOrder(id: string) {
    setError(null);
    try {
      await convertToOrder(id).unwrap();
      setDetail(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to convert quote to sales order.'));
    }
  }

  async function onConvertToInvoice(id: string) {
    setError(null);
    try {
      await convertToInvoice(id).unwrap();
      setDetail(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to convert quote to invoice.'));
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
        <PageHeader kicker="Sales" title="Quotes" />
        <p className="max-w-2xl text-sm text-muted">You need sales view permission to open quotes.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay
        active={
          creating || sending || deciding || expiring || convertingOrder || convertingInvoice || printing
        }
      />
      <PageHeader
        kicker="Sales"
        title="Quotes"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setLines([newMoneyLine()]);
                setCreateOpen(true);
              }}
            >
              New quote
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Create customer quotes, send them, accept or decline, then convert to a sales order or invoice.
      </p>
      {error && !createOpen && !detail ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load quotes.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'customer', header: 'Customer', cell: (row) => row.customerName || '—' },
          { id: 'quoteDate', header: 'Date', cell: (row) => row.quoteDate },
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
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDetail(row)}>
                  Open
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => void onPrint(row.id)}>
                  Print
                </Button>
              </div>
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No quotes"
        emptyDescription="Create a quote for a customer."
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>New quote</DialogTitle>
          <DialogDescription>Customer quote with line items and tax.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
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
                <Label htmlFor="quoteDate">Quote date</Label>
                <Input id="quoteDate" name="quoteDate" type="date" />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry date</Label>
                <Input id="expiryDate" name="expiryDate" type="date" />
              </div>
              <div>
                <Label htmlFor="terms">Terms</Label>
                <Input id="terms" name="terms" />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" />
              </div>
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
                Create quote
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>{detail?.documentNumber ?? 'Quote'}</DialogTitle>
          <DialogDescription>Send, decide, expire, convert, or print this quote.</DialogDescription>
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
                  <span className="text-muted">Quote date:</span> {detail.quoteDate}
                </p>
                {detail.expiryDate ? (
                  <p>
                    <span className="text-muted">Expires:</span> {detail.expiryDate}
                  </p>
                ) : null}
              </div>
              <DataTable
                columns={[
                  { id: 'description', header: 'Description', cell: (row) => row.description },
                  { id: 'qty', header: 'Qty', cell: (row) => `${row.quantity} ${row.unit || ''}` },
                  { id: 'rate', header: 'Rate', cell: (row) => formatInr(row.rate) },
                  { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount + row.taxAmount) },
                ]}
                rows={detail.lines}
                emptyTitle="No lines"
                emptyDescription="This quote has no lines."
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void onPrint(detail.id)}>
                  Print
                </Button>
                {canManage && detail.status === 'draft' ? (
                  <Button type="button" onClick={() => void onSend(detail.id)}>
                    Send
                  </Button>
                ) : null}
                {canManage && detail.status === 'sent' ? (
                  <>
                    <Button type="button" onClick={() => void onDecide(detail.id, 'accept')}>
                      Accept
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void onDecide(detail.id, 'decline')}>
                      Decline
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void onExpire(detail.id)}>
                      Expire
                    </Button>
                  </>
                ) : null}
                {canManage && detail.status === 'accepted' ? (
                  <>
                    <Button type="button" onClick={() => void onConvertToOrder(detail.id)}>
                      Convert to SO
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void onConvertToInvoice(detail.id)}>
                      Convert to invoice
                    </Button>
                  </>
                ) : null}
              </div>
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
