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
import { ACCENT, FORM_SECTION_TONE } from '@/lib/ui-accents';
import { FinanceQuoteForm } from '@/features/finance/finance-quote-form';
import { formatInr, salesStatusTone } from '@/features/finance/finance-procurement-utils';
import { printSalesDocument } from '@/features/finance/finance-sales-print';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useConvertFinanceSalesQuoteToInvoiceMutation,
  useConvertFinanceSalesQuoteToOrderMutation,
  useDecideFinanceSalesQuoteMutation,
  useEmailFinanceSalesQuoteMutation,
  useExpireFinanceSalesQuoteMutation,
  useGetFinanceCustomersQuery,
  useGetFinanceSalesQuoteQuery,
  useGetFinanceSalesQuotesQuery,
  useLazyGetFinanceSalesQuotePrintQuery,
  useSendFinanceSalesQuoteMutation,
} from '@/store/api/api';
import type { SalesQuote } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

function canEditQuote(status: SalesQuote['status']): boolean {
  return status === 'draft' || status === 'sent' || status === 'accepted';
}

export function FinanceQuotesPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_SALES_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_SALES_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_SALES_MANAGE);

  const { data, isLoading, isError } = useGetFinanceSalesQuotesQuery(undefined, { skip: !canView });
  const [sendQuote, { isLoading: sending }] = useSendFinanceSalesQuoteMutation();
  const [decideQuote, { isLoading: deciding }] = useDecideFinanceSalesQuoteMutation();
  const [expireQuote, { isLoading: expiring }] = useExpireFinanceSalesQuoteMutation();
  const [convertToOrder, { isLoading: convertingOrder }] = useConvertFinanceSalesQuoteToOrderMutation();
  const [convertToInvoice, { isLoading: convertingInvoice }] =
    useConvertFinanceSalesQuoteToInvoiceMutation();
  const [emailQuote, { isLoading: emailing }] = useEmailFinanceSalesQuoteMutation();
  const [fetchPrint, { isFetching: printing }] = useLazyGetFinanceSalesQuotePrintQuery();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editQuote, setEditQuote] = useState<SalesQuote | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);

  const { data: customersData } = useGetFinanceCustomersQuery(undefined, { skip: !canManage });
  const { data: detailData, isLoading: loadingDetail } = useGetFinanceSalesQuoteQuery(detailId ?? '', {
    skip: !detailId,
  });
  const detail = detailData?.data ?? null;
  const customerEmail =
    customersData?.data.find((customer) => customer.id === detail?.customerId)?.email ?? '';

  async function onSend(id: string) {
    setError(null);
    try {
      await sendQuote(id).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to send quote.'));
    }
  }

  async function onDecide(id: string, decision: 'accept' | 'decline') {
    setError(null);
    try {
      await decideQuote({ id, decision }).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, `Unable to ${decision} quote.`));
    }
  }

  async function onExpire(id: string) {
    setError(null);
    try {
      await expireQuote(id).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to expire quote.'));
    }
  }

  async function onConvertToOrder(id: string) {
    setError(null);
    try {
      await convertToOrder(id).unwrap();
      setDetailId(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to convert quote to sales order.'));
    }
  }

  async function onConvertToInvoice(id: string) {
    setError(null);
    try {
      await convertToInvoice(id).unwrap();
      setDetailId(null);
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

  async function onEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await emailQuote({
        id: detail.id,
        body: {
          to: String(form.get('to') ?? '').trim(),
          subject: String(form.get('subject') ?? '').trim() || undefined,
          message: String(form.get('message') ?? '').trim() || undefined,
          saveEmailToCustomer: form.get('saveEmailToCustomer') === 'on',
        },
      }).unwrap();
      setEmailOpen(false);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to email quote.'));
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
          sending ||
          deciding ||
          expiring ||
          convertingOrder ||
          convertingInvoice ||
          printing ||
          emailing ||
          loadingDetail
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
                setCreateOpen(true);
              }}
            >
              New quote
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Create customer quotes with letterhead, structured addresses, version history, and Bioserve-style PDF output.
      </p>
      {error && !createOpen && !detailId && !editQuote ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load quotes.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'customer', header: 'Customer', cell: (row) => row.customerName || '—' },
          { id: 'subject', header: 'Subject', cell: (row) => row.subject || '—' },
          { id: 'quoteDate', header: 'Date', cell: (row) => row.quoteDate },
          { id: 'total', header: 'Total', cell: (row) => formatInr(row.grandTotal) },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={salesStatusTone(row.status)} label={row.status} />,
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No quotes"
        emptyDescription="Create a quote for a customer."
        onRowClick={(row) => {
          setError(null);
          setDetailId(row.id);
        }}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogTitle>New quote</DialogTitle>
          <DialogDescription>Step through letterhead, customer, lines, and review.</DialogDescription>
          <FinanceQuoteForm
            onCancel={() => setCreateOpen(false)}
            onSaved={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editQuote)} onOpenChange={(open) => !open && setEditQuote(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogTitle>Edit quote</DialogTitle>
          <DialogDescription>Update quote details. A change note creates a new version when provided.</DialogDescription>
          {editQuote ? (
            <FinanceQuoteForm
              key={editQuote.id}
              quote={editQuote}
              onCancel={() => setEditQuote(null)}
              onSaved={() => {
                setEditQuote(null);
                if (detailId === editQuote.id) {
                  /* refetch via tag invalidation */
                }
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detailId)} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogTitle>{detail?.documentNumber ?? 'Quote'}</DialogTitle>
          <DialogDescription>
            Version {detail?.versionNumber ?? 1} · Send, decide, convert, print, or email this quote.
          </DialogDescription>
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
                {detail.subject ? (
                  <p>
                    <span className="text-muted">Subject:</span> {detail.subject}
                  </p>
                ) : null}
                {detail.referenceText ? (
                  <p>
                    <span className="text-muted">Reference:</span> {detail.referenceText}
                  </p>
                ) : null}
                {detail.placeOfSupply ? (
                  <p>
                    <span className="text-muted">Place of supply:</span> {detail.placeOfSupply}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div className="rounded border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted">Bill To</p>
                  <p className="mt-1 whitespace-pre-wrap">{detail.billingAddressSnapshot || '—'}</p>
                  {detail.customerGstinSnapshot ? (
                    <p className="mt-1 text-muted">GSTIN: {detail.customerGstinSnapshot}</p>
                  ) : null}
                </div>
                <div className="rounded border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted">Ship To</p>
                  {detail.shipToName ? <p className="font-medium">{detail.shipToName}</p> : null}
                  <p className="mt-1 whitespace-pre-wrap">{detail.shippingAddressSnapshot || detail.billingAddressSnapshot || '—'}</p>
                </div>
              </div>

              <DataTable
                columns={[
                  { id: 'description', header: 'Description', cell: (row) => row.description },
                  {
                    id: 'catalog',
                    header: 'Catalog',
                    cell: (row) => row.catalogNo || '—',
                  },
                  { id: 'hsn', header: 'HSN/SAC', cell: (row) => row.hsnSac || '—' },
                  { id: 'qty', header: 'Qty', cell: (row) => `${row.quantity} ${row.unit || ''}` },
                  { id: 'rate', header: 'Rate', cell: (row) => formatInr(row.rate) },
                  { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount + row.taxAmount) },
                ]}
                rows={detail.lines}
                emptyTitle="No lines"
                emptyDescription="This quote has no lines."
              />

              {detail.versions.length ? (
                <div>
                  <h4 className="text-sm font-medium" style={{ color: ACCENT[FORM_SECTION_TONE] }}>
                    Version history
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {detail.versions.map((version) => (
                      <li key={version.id} className="rounded border border-border text-sm">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted/20"
                          onClick={() =>
                            setExpandedVersionId((prev) => (prev === version.id ? null : version.id))
                          }
                        >
                          <span>
                            v{version.versionNumber}
                            {version.changeNote ? ` — ${version.changeNote}` : ''}
                          </span>
                          <span className="text-xs text-muted">
                            {new Date(version.createdAt).toLocaleString('en-IN')}
                          </span>
                        </button>
                        {expandedVersionId === version.id ? (
                          <div className="border-t border-border px-3 py-2 text-xs text-muted">
                            <p>Total: {formatInr(version.snapshot.grandTotal)}</p>
                            <p>Lines: {version.snapshot.lines.length}</p>
                            {version.snapshot.subject ? <p>Subject: {version.snapshot.subject}</p> : null}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void onPrint(detail.id)}>
                  View / Print PDF
                </Button>
                {canManage ? (
                  <Button type="button" variant="outline" onClick={() => setEmailOpen(true)}>
                    Email
                  </Button>
                ) : null}
                {canManage && canEditQuote(detail.status) ? (
                  <Button type="button" variant="outline" onClick={() => setEditQuote(detail)}>
                    Edit
                  </Button>
                ) : null}
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
          ) : loadingDetail ? (
            <p className="mt-6 text-sm text-muted">Loading quote…</p>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogTitle>Email quote</DialogTitle>
          <DialogDescription>Send this quote to the customer by email.</DialogDescription>
          <form onSubmit={onEmail} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="to">To</Label>
              <Input id="to" name="to" type="email" required defaultValue={customerEmail} key={customerEmail} />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                defaultValue={detail?.subject ? `Quote ${detail.documentNumber} — ${detail.subject}` : `Quote ${detail?.documentNumber ?? ''}`}
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                name="message"
                className="min-h-[80px] w-full rounded border border-border bg-background px-3 py-2 text-sm"
                placeholder="Optional message to include in the email"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="saveEmailToCustomer" />
              Save email to customer record
            </label>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEmailOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={emailing}>
                Send email
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
