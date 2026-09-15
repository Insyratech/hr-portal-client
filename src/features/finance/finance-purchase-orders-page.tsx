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
  procurementStatusTone,
  type MoneyLineDraft,
} from '@/features/finance/finance-procurement-utils';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useApproveFinancePurchaseOrderMutation,
  useCreateFinancePurchaseOrderFromQuoteMutation,
  useCreateFinancePurchaseOrderMutation,
  useGetFinancePurchaseOrdersQuery,
  useGetFinanceRfqsQuery,
  useGetFinanceRfqQuotesQuery,
  useGetFinanceVendorsQuery,
  useIssueFinancePurchaseOrderMutation,
  useLazyGetFinancePurchaseOrderPrintQuery,
} from '@/store/api/api';
import type { PurchaseOrder, PurchaseOrderPrint } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

function printPurchaseOrder(payload: PurchaseOrderPrint) {
  const { organization, order, vendor } = payload;
  const linesHtml = order.lines
    .map(
      (line) =>
        `<tr><td>${line.description}</td><td>${line.quantity} ${line.unit || ''}</td><td>${line.rate}</td><td>${line.taxPercent}%</td><td>${line.amount + line.taxAmount}</td></tr>`,
    )
    .join('');
  const html = `<!DOCTYPE html><html><head><title>${order.documentNumber}</title>
    <style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{margin:0 0 8px}</style>
    </head><body>
    <h1>Purchase Order ${order.documentNumber}</h1>
    <p><strong>${organization.tradeName || organization.legalName}</strong><br/>${organization.addressLine1}, ${organization.city} ${organization.postalCode}${organization.gstin ? `<br/>GSTIN: ${organization.gstin}` : ''}</p>
    <p><strong>Vendor:</strong> ${vendor.displayName}${vendor.gstin ? ` · GSTIN ${vendor.gstin}` : ''}<br/>${vendor.billingAddress || ''}</p>
    <p>Order date: ${order.orderDate} · Status: ${order.status}</p>
    <table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Tax</th><th>Amount</th></tr></thead><tbody>${linesHtml}</tbody></table>
    <p style="margin-top:16px"><strong>Subtotal:</strong> ${order.subtotal}<br/><strong>Tax:</strong> ${order.taxTotal}<br/><strong>Grand total:</strong> ${order.grandTotal}</p>
    ${order.notes ? `<p>Notes: ${order.notes}</p>` : ''}
    </body></html>`;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
}

export function FinancePurchaseOrdersPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_INDENT_APPROVE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE);

  const { data, isLoading, isError } = useGetFinancePurchaseOrdersQuery(undefined, { skip: !canView });
  const { data: vendorsData } = useGetFinanceVendorsQuery(undefined, { skip: !canManage });
  const { data: rfqsData } = useGetFinanceRfqsQuery(undefined, { skip: !canManage });
  const [createPo, { isLoading: creating }] = useCreateFinancePurchaseOrderMutation();
  const [createFromQuote, { isLoading: converting }] = useCreateFinancePurchaseOrderFromQuoteMutation();
  const [approvePo, { isLoading: approving }] = useApproveFinancePurchaseOrderMutation();
  const [issuePo, { isLoading: issuing }] = useIssueFinancePurchaseOrderMutation();
  const [fetchPrint, { isFetching: printing }] = useLazyGetFinancePurchaseOrderPrintQuery();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [fromQuoteOpen, setFromQuoteOpen] = useState(false);
  const [detail, setDetail] = useState<PurchaseOrder | null>(null);
  const [lines, setLines] = useState<MoneyLineDraft[]>([newMoneyLine()]);
  const [quoteRfqId, setQuoteRfqId] = useState('');

  const { data: quotesData } = useGetFinanceRfqQuotesQuery(quoteRfqId, { skip: !quoteRfqId });

  const selectedQuotes = useMemo(
    () => (quotesData?.data ?? []).filter((quote) => quote.status === 'selected'),
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
      setError('Add at least one PO line.');
      return;
    }
    try {
      await createPo({
        vendorId: String(form.get('vendorId') ?? ''),
        orderDate: String(form.get('orderDate') ?? '').trim() || undefined,
        expectedDelivery: String(form.get('expectedDelivery') ?? '').trim() || null,
        billingAddress: String(form.get('billingAddress') ?? '').trim() || undefined,
        deliveryAddress: String(form.get('deliveryAddress') ?? '').trim() || undefined,
        paymentTermsDays: Number(form.get('paymentTermsDays') ?? 0) || 0,
        notes: String(form.get('notes') ?? '').trim() || undefined,
        lines: prepared,
      }).unwrap();
      setCreateOpen(false);
      setLines([newMoneyLine()]);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create purchase order.'));
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
        notes: String(form.get('notes') ?? '').trim() || undefined,
      }).unwrap();
      setFromQuoteOpen(false);
      setQuoteRfqId('');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create PO from quote.'));
    }
  }

  async function onApprove(id: string) {
    setError(null);
    try {
      const result = await approvePo(id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to approve purchase order.'));
    }
  }

  async function onIssue(id: string) {
    setError(null);
    try {
      const result = await issuePo(id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to issue purchase order.'));
    }
  }

  async function onPrint(id: string) {
    setError(null);
    try {
      const result = await fetchPrint(id).unwrap();
      printPurchaseOrder(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to load print payload.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Purchases" title="Purchase orders" />
        <p className="max-w-2xl text-sm text-muted">You need purchase view permission to open POs.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || converting || approving || issuing || printing} />
      <PageHeader
        kicker="Purchases"
        title="Purchase orders"
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setQuoteRfqId('');
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
                New PO
              </Button>
            </div>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Create purchase orders manually or from a selected quote, then approve, issue, and print.
      </p>
      {error && !createOpen && !fromQuoteOpen && !detail ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load purchase orders.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'vendor', header: 'Vendor', cell: (row) => row.vendorName || '—' },
          { id: 'orderDate', header: 'Date', cell: (row) => row.orderDate },
          { id: 'total', header: 'Total', cell: (row) => formatInr(row.grandTotal) },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={procurementStatusTone(row.status)} label={row.status} />,
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
        emptyTitle="No purchase orders"
        emptyDescription="Create a PO from a quote or enter one manually."
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>New purchase order</DialogTitle>
          <DialogDescription>Manual PO with line items and tax.</DialogDescription>
          <form onSubmit={onCreateManual} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="vendorId">Vendor</Label>
              <select id="vendorId" name="vendorId" className={SELECT_CLASS} required>
                <option value="">Select vendor</option>
                {(vendorsData?.data ?? []).map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.displayName}
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
                <Label htmlFor="paymentTermsDays">Payment terms (days)</Label>
                <Input id="paymentTermsDays" name="paymentTermsDays" type="number" min={0} defaultValue={0} />
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
              <Label htmlFor="deliveryAddress">Delivery address</Label>
              <Input id="deliveryAddress" name="deliveryAddress" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Lines</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, newMoneyLine()])}>
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
                Create PO
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={fromQuoteOpen} onOpenChange={setFromQuoteOpen}>
        <DialogContent>
          <DialogTitle>PO from selected quote</DialogTitle>
          <DialogDescription>Convert a selected vendor quote into a purchase order.</DialogDescription>
          <form onSubmit={onCreateFromQuote} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="rfqId">RFQ</Label>
              <select
                id="rfqId"
                className={SELECT_CLASS}
                value={quoteRfqId}
                onChange={(event) => setQuoteRfqId(event.target.value)}
                required
              >
                <option value="">Select RFQ</option>
                {(rfqsData?.data ?? []).map((rfq) => (
                  <option key={rfq.id} value={rfq.id}>
                    {rfq.documentNumber} — {rfq.title || 'RFQ'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="quoteId">Selected quote</Label>
              <select id="quoteId" name="quoteId" className={SELECT_CLASS} required>
                <option value="">Select quote</option>
                {selectedQuotes.map((quote) => (
                  <option key={quote.id} value={quote.id}>
                    {quote.documentNumber} — {quote.vendorName || 'Vendor'} ({formatInr(quote.grandTotal)})
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
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setFromQuoteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={converting}>
                Create PO
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>{detail?.documentNumber ?? 'Purchase order'}</DialogTitle>
          <DialogDescription>Approve, issue, or print this purchase order.</DialogDescription>
          {detail ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted">Vendor:</span> {detail.vendorName || '—'}
                </p>
                <p>
                  <StatusBadge status={procurementStatusTone(detail.status)} label={detail.status} />
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
                    cell: (row) => `${row.quantity} (${row.quantityReceived} recv)`,
                  },
                  { id: 'rate', header: 'Rate', cell: (row) => formatInr(row.rate) },
                  { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount + row.taxAmount) },
                ]}
                rows={detail.lines}
                emptyTitle="No lines"
                emptyDescription="This purchase order has no lines."
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void onPrint(detail.id)}>
                  Print
                </Button>
                {canManage && detail.status === 'draft' ? (
                  <Button type="button" onClick={() => void onApprove(detail.id)}>
                    Approve
                  </Button>
                ) : null}
                {canManage && detail.status === 'approved' ? (
                  <Button type="button" onClick={() => void onIssue(detail.id)}>
                    Issue
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
