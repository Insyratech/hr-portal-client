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
import { formatInr, salesStatusTone } from '@/features/finance/finance-procurement-utils';
import { printSalesDocument } from '@/features/finance/finance-sales-print';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useCreateFinanceInvoiceFromQuoteMutation,
  useCreateFinanceInvoiceFromSalesOrderMutation,
  useGenerateFinanceEinvoiceMutation,
  useGetFinanceDeliveryNotesQuery,
  useGetFinanceInvoicesQuery,
  useGetFinanceSalesOrdersQuery,
  useGetFinanceSalesQuotesQuery,
  useLazyGetFinanceInvoicePrintQuery,
  usePostFinanceInvoiceMutation,
  useSendFinanceInvoiceMutation,
} from '@/store/api/api';
import type { SalesInvoice } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceInvoicesPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_SALES_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_SALES_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_SALES_MANAGE);
  const canManageIntegrations =
    permissions.includes(PERMISSIONS.FINANCE_INTEGRATIONS_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_GST_MANAGE);

  const { data, isLoading, isError } = useGetFinanceInvoicesQuery(undefined, { skip: !canView });
  const { data: ordersData } = useGetFinanceSalesOrdersQuery(undefined, { skip: !canManage });
  const { data: quotesData } = useGetFinanceSalesQuotesQuery(undefined, { skip: !canManage });
  const { data: notesData } = useGetFinanceDeliveryNotesQuery(undefined, { skip: !canManage });
  const [createFromSo, { isLoading: creatingSo }] = useCreateFinanceInvoiceFromSalesOrderMutation();
  const [createFromQuote, { isLoading: creatingQuote }] = useCreateFinanceInvoiceFromQuoteMutation();
  const [sendInvoice, { isLoading: sending }] = useSendFinanceInvoiceMutation();
  const [postInvoice, { isLoading: posting }] = usePostFinanceInvoiceMutation();
  const [fetchPrint, { isFetching: printing }] = useLazyGetFinanceInvoicePrintQuery();
  const [generateEinvoice, { isLoading: generatingIrn }] = useGenerateFinanceEinvoiceMutation();

  const [error, setError] = useState<string | null>(null);
  const [fromSoOpen, setFromSoOpen] = useState(false);
  const [fromQuoteOpen, setFromQuoteOpen] = useState(false);
  const [detail, setDetail] = useState<SalesInvoice | null>(null);
  const [salesOrderId, setSalesOrderId] = useState('');

  const invoiceableOrders = useMemo(
    () =>
      (ordersData?.data ?? []).filter((order) =>
        ['confirmed', 'partially_delivered', 'delivered', 'partially_invoiced'].includes(
          order.status.toLowerCase(),
        ),
      ),
    [ordersData],
  );

  const acceptedQuotes = useMemo(
    () => (quotesData?.data ?? []).filter((quote) => quote.status === 'accepted'),
    [quotesData],
  );

  const matchingNotes = useMemo(
    () =>
      (notesData?.data ?? []).filter(
        (note) => note.salesOrderId === salesOrderId && note.status.toLowerCase() === 'posted',
      ),
    [notesData, salesOrderId],
  );

  async function onCreateFromSo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await createFromSo({
        salesOrderId: String(form.get('salesOrderId') ?? ''),
        deliveryNoteId: String(form.get('deliveryNoteId') ?? '').trim() || null,
        invoiceDate: String(form.get('invoiceDate') ?? '').trim() || undefined,
        dueDate: String(form.get('dueDate') ?? '').trim() || null,
        notes: String(form.get('notes') ?? '').trim() || undefined,
      }).unwrap();
      setFromSoOpen(false);
      setSalesOrderId('');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create invoice from sales order.'));
    }
  }

  async function onCreateFromQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await createFromQuote({
        quoteId: String(form.get('quoteId') ?? ''),
        invoiceDate: String(form.get('invoiceDate') ?? '').trim() || undefined,
        dueDate: String(form.get('dueDate') ?? '').trim() || null,
        notes: String(form.get('notes') ?? '').trim() || undefined,
      }).unwrap();
      setFromQuoteOpen(false);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create invoice from quote.'));
    }
  }

  async function onSend(id: string) {
    setError(null);
    try {
      const result = await sendInvoice(id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to send invoice.'));
    }
  }

  async function onPost(id: string) {
    setError(null);
    try {
      const result = await postInvoice(id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to post invoice.'));
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

  async function onGenerateIrn(id: string) {
    setError(null);
    try {
      await generateEinvoice(id).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to generate IRN.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Sales" title="Invoices" />
        <p className="max-w-2xl text-sm text-muted">You need sales view permission to open invoices.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay
        active={creatingSo || creatingQuote || sending || posting || printing || generatingIrn}
      />
      <PageHeader
        kicker="Sales"
        title="Invoices"
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
                  setSalesOrderId('');
                  setFromSoOpen(true);
                }}
              >
                From sales order
              </Button>
            </div>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Create invoices from sales orders or quotes, send to the customer, then post to AR.
      </p>
      {error && !fromSoOpen && !fromQuoteOpen && !detail ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load invoices.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'customer', header: 'Customer', cell: (row) => row.customerName || '—' },
          { id: 'date', header: 'Invoice date', cell: (row) => row.invoiceDate },
          { id: 'total', header: 'Total', cell: (row) => formatInr(row.grandTotal) },
          {
            id: 'paid',
            header: 'Paid',
            cell: (row) => formatInr(row.amountPaid),
          },
          {
            id: 'due',
            header: 'Due',
            cell: (row) => formatInr(Math.max(0, row.grandTotal - row.amountPaid)),
          },
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
        emptyTitle="No invoices"
        emptyDescription="Create an invoice from a sales order or accepted quote."
      />

      <Dialog open={fromSoOpen} onOpenChange={setFromSoOpen}>
        <DialogContent>
          <DialogTitle>Invoice from sales order</DialogTitle>
          <DialogDescription>Optionally link a posted delivery note.</DialogDescription>
          <form onSubmit={onCreateFromSo} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="salesOrderId">Sales order</Label>
              <select
                id="salesOrderId"
                name="salesOrderId"
                className={SELECT_CLASS}
                value={salesOrderId}
                onChange={(event) => setSalesOrderId(event.target.value)}
                required
              >
                <option value="">Select sales order</option>
                {invoiceableOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.documentNumber} — {order.customerName || 'Customer'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="deliveryNoteId">Delivery note (optional)</Label>
              <select id="deliveryNoteId" name="deliveryNoteId" className={SELECT_CLASS} defaultValue="">
                <option value="">None</option>
                {matchingNotes.map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.documentNumber} ({note.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="invoiceDate">Invoice date</Label>
                <Input id="invoiceDate" name="invoiceDate" type="date" />
              </div>
              <div>
                <Label htmlFor="dueDate">Due date</Label>
                <Input id="dueDate" name="dueDate" type="date" />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setFromSoOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creatingSo}>
                Create invoice
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={fromQuoteOpen} onOpenChange={setFromQuoteOpen}>
        <DialogContent>
          <DialogTitle>Invoice from quote</DialogTitle>
          <DialogDescription>Convert an accepted quote directly to an invoice.</DialogDescription>
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
                <Label htmlFor="invoiceDateQuote">Invoice date</Label>
                <Input id="invoiceDateQuote" name="invoiceDate" type="date" />
              </div>
              <div>
                <Label htmlFor="dueDateQuote">Due date</Label>
                <Input id="dueDateQuote" name="dueDate" type="date" />
              </div>
            </div>
            <div>
              <Label htmlFor="notesQuote">Notes</Label>
              <Input id="notesQuote" name="notes" />
            </div>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setFromQuoteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creatingQuote}>
                Create invoice
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>{detail?.documentNumber ?? 'Invoice'}</DialogTitle>
          <DialogDescription>Send, post, or print this customer invoice.</DialogDescription>
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
                  <span className="text-muted">Paid:</span> {formatInr(detail.amountPaid)}
                </p>
                <p>
                  <span className="text-muted">Due:</span>{' '}
                  {formatInr(Math.max(0, detail.grandTotal - detail.amountPaid))}
                </p>
                <p>
                  <span className="text-muted">Invoice date:</span> {detail.invoiceDate}
                </p>
              </div>
              <DataTable
                columns={[
                  { id: 'description', header: 'Description', cell: (row) => row.description },
                  { id: 'qty', header: 'Qty', cell: (row) => String(row.quantity) },
                  { id: 'rate', header: 'Rate', cell: (row) => formatInr(row.rate) },
                  { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount + row.taxAmount) },
                ]}
                rows={detail.lines}
                emptyTitle="No lines"
                emptyDescription="This invoice has no lines."
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
                {canManage && (detail.status === 'draft' || detail.status === 'sent') ? (
                  <Button type="button" onClick={() => void onPost(detail.id)}>
                    Post
                  </Button>
                ) : null}
                {canManageIntegrations && detail.journalId ? (
                  <Button
                    type="button"
                    variant="outline"
                    loading={generatingIrn}
                    onClick={() => void onGenerateIrn(detail.id)}
                  >
                    Generate IRN
                  </Button>
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
