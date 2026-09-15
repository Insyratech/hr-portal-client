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
  useCloseFinanceRfqMutation,
  useCreateFinanceRfqFromIndentMutation,
  useCreateFinanceVendorQuoteMutation,
  useGetFinanceIndentsQuery,
  useGetFinanceRfqQuotesQuery,
  useGetFinanceRfqsQuery,
  useGetFinanceVendorsQuery,
  useSelectFinanceVendorQuoteMutation,
} from '@/store/api/api';
import type { Rfq } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceRfqsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_INDENT_APPROVE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE);

  const { data, isLoading, isError } = useGetFinanceRfqsQuery(undefined, { skip: !canView });
  const { data: indentsData } = useGetFinanceIndentsQuery(undefined, { skip: !canManage });
  const { data: vendorsData } = useGetFinanceVendorsQuery(undefined, { skip: !canManage });
  const [createRfq, { isLoading: creating }] = useCreateFinanceRfqFromIndentMutation();
  const [closeRfq, { isLoading: closing }] = useCloseFinanceRfqMutation();
  const [createQuote, { isLoading: quoting }] = useCreateFinanceVendorQuoteMutation();
  const [selectQuote, { isLoading: selecting }] = useSelectFinanceVendorQuoteMutation();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [activeRfq, setActiveRfq] = useState<Rfq | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteLines, setQuoteLines] = useState<MoneyLineDraft[]>([newMoneyLine()]);

  const { data: quotesData, isLoading: quotesLoading } = useGetFinanceRfqQuotesQuery(activeRfq?.id ?? '', {
    skip: !activeRfq,
  });

  const approvedIndents = useMemo(
    () => (indentsData?.data ?? []).filter((indent) => indent.status === 'approved'),
    [indentsData],
  );
  const vendors = vendorsData?.data ?? [];
  const quotes = quotesData?.data ?? [];

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    if (!selectedVendorIds.length) {
      setError('Select at least one vendor.');
      return;
    }
    try {
      await createRfq({
        indentId: String(form.get('indentId') ?? ''),
        vendorIds: selectedVendorIds,
        title: String(form.get('title') ?? '').trim() || undefined,
        notes: String(form.get('notes') ?? '').trim() || undefined,
      }).unwrap();
      setCreateOpen(false);
      setSelectedVendorIds([]);
      event.currentTarget.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create RFQ.'));
    }
  }

  async function onClose(id: string) {
    setError(null);
    try {
      const result = await closeRfq(id).unwrap();
      if (activeRfq?.id === id) setActiveRfq(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to close RFQ.'));
    }
  }

  async function onCreateQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeRfq) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    const lines = quoteLines
      .map((line) => ({
        description: line.description.trim(),
        quantity: Number(line.quantity),
        unit: line.unit.trim() || 'nos',
        rate: Number(line.rate),
        taxPercent: Number(line.taxPercent),
      }))
      .filter((line) => line.description && line.quantity > 0);
    if (!lines.length) {
      setError('Add at least one quote line.');
      return;
    }
    try {
      await createQuote({
        rfqId: activeRfq.id,
        body: {
          vendorId: String(form.get('vendorId') ?? ''),
          deliveryDays: Number(form.get('deliveryDays') ?? 0) || 0,
          shippingAmount: Number(form.get('shippingAmount') ?? 0) || 0,
          notes: String(form.get('notes') ?? '').trim() || undefined,
          lines,
        },
      }).unwrap();
      setQuoteOpen(false);
      setQuoteLines([newMoneyLine()]);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create quote.'));
    }
  }

  async function onSelectQuote(id: string) {
    setError(null);
    try {
      await selectQuote(id).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to select quote.'));
    }
  }

  function openRfq(rfq: Rfq) {
    setError(null);
    setActiveRfq(rfq);
    setQuoteLines(
      rfq.lines.length
        ? rfq.lines.map((line) => ({
            key: crypto.randomUUID(),
            description: line.description,
            quantity: String(line.quantity),
            unit: line.unit || 'nos',
            rate: '0',
            taxPercent: '18',
          }))
        : [newMoneyLine()],
    );
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Purchases" title="RFQs" />
        <p className="max-w-2xl text-sm text-muted">You need purchase view permission to open RFQs.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || closing || quoting || selecting} />
      <PageHeader
        kicker="Purchases"
        title="RFQs"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setSelectedVendorIds([]);
                setCreateOpen(true);
              }}
            >
              Create from indent
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Request quotes from vendors against an approved indent, then select a winning quote.
      </p>
      {error && !createOpen && !activeRfq ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load RFQs.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'title', header: 'Title', cell: (row) => row.title || '—' },
          { id: 'vendors', header: 'Vendors', cell: (row) => String(row.vendorIds.length) },
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
                <Button type="button" variant="outline" size="sm" onClick={() => openRfq(row)}>
                  Quotes
                </Button>
                {canManage && row.status === 'open' ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => void onClose(row.id)}>
                    Close
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No RFQs"
        emptyDescription="Create an RFQ from an approved indent."
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogTitle>Create RFQ from indent</DialogTitle>
          <DialogDescription>Pick an approved indent and vendors to invite.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="indentId">Approved indent</Label>
              <select id="indentId" name="indentId" className={SELECT_CLASS} required>
                <option value="">Select indent</option>
                {approvedIndents.map((indent) => (
                  <option key={indent.id} value={indent.id}>
                    {indent.documentNumber} — {indent.purpose}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <div className="space-y-2">
              <Label>Vendors</Label>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded border border-border p-3">
                {vendors.map((vendor) => {
                  const checked = selectedVendorIds.includes(vendor.id);
                  return (
                    <label key={vendor.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedVendorIds((prev) =>
                            checked ? prev.filter((id) => id !== vendor.id) : [...prev, vendor.id],
                          )
                        }
                      />
                      {vendor.displayName}
                    </label>
                  );
                })}
                {!vendors.length ? <p className="text-sm text-muted">No vendors available.</p> : null}
              </div>
            </div>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creating}>
                Create RFQ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(activeRfq)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveRfq(null);
            setQuoteOpen(false);
            setError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogTitle>{activeRfq?.documentNumber ?? 'RFQ'}</DialogTitle>
          <DialogDescription>{activeRfq?.title || 'Vendor quotations for this RFQ.'}</DialogDescription>
          {activeRfq ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={procurementStatusTone(activeRfq.status)} label={activeRfq.status} />
                {canManage && activeRfq.status === 'open' ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setQuoteOpen(true);
                    }}
                  >
                    Add quote
                  </Button>
                ) : null}
              </div>
              <DataTable
                columns={[
                  { id: 'documentNumber', header: 'Quote', cell: (row) => row.documentNumber },
                  { id: 'vendor', header: 'Vendor', cell: (row) => row.vendorName || '—' },
                  { id: 'total', header: 'Total', cell: (row) => formatInr(row.grandTotal) },
                  { id: 'delivery', header: 'Delivery days', cell: (row) => String(row.deliveryDays) },
                  {
                    id: 'status',
                    header: 'Status',
                    cell: (row) => (
                      <StatusBadge status={procurementStatusTone(row.status)} label={row.status} />
                    ),
                  },
                  {
                    id: 'actions',
                    header: 'Actions',
                    cell: (row) =>
                      canManage && activeRfq.status === 'open' && row.status !== 'selected' ? (
                        <Button type="button" size="sm" onClick={() => void onSelectQuote(row.id)}>
                          Select
                        </Button>
                      ) : (
                        '—'
                      ),
                  },
                ]}
                rows={quotes}
                loading={quotesLoading}
                emptyTitle="No quotes yet"
                emptyDescription="Capture vendor quotations to compare."
              />
              {quoteOpen ? (
                <form onSubmit={onCreateQuote} className="space-y-4 rounded border border-border p-4">
                  <h3 className="text-sm font-medium">New vendor quote</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="vendorId">Vendor</Label>
                      <select id="vendorId" name="vendorId" className={SELECT_CLASS} required>
                        <option value="">Select vendor</option>
                        {vendors
                          .filter((vendor) => activeRfq.vendorIds.includes(vendor.id))
                          .map((vendor) => (
                            <option key={vendor.id} value={vendor.id}>
                              {vendor.displayName}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="deliveryDays">Delivery days</Label>
                      <Input id="deliveryDays" name="deliveryDays" type="number" min={0} defaultValue={0} />
                    </div>
                    <div>
                      <Label htmlFor="shippingAmount">Shipping</Label>
                      <Input id="shippingAmount" name="shippingAmount" type="number" min={0} step="any" defaultValue={0} />
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
                        onClick={() => setQuoteLines((prev) => [...prev, newMoneyLine()])}
                      >
                        Add line
                      </Button>
                    </div>
                    {quoteLines.map((line, index) => (
                      <div key={line.key} className="grid gap-2 sm:grid-cols-12">
                        <Input
                          className="sm:col-span-4"
                          placeholder="Description"
                          value={line.description}
                          onChange={(event) =>
                            setQuoteLines((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, description: event.target.value } : item,
                              ),
                            )
                          }
                          required
                        />
                        <Input
                          className="sm:col-span-2"
                          type="number"
                          min={0.01}
                          step="any"
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={(event) =>
                            setQuoteLines((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, quantity: event.target.value } : item,
                              ),
                            )
                          }
                          required
                        />
                        <Input
                          className="sm:col-span-2"
                          placeholder="Unit"
                          value={line.unit}
                          onChange={(event) =>
                            setQuoteLines((prev) =>
                              prev.map((item, i) => (i === index ? { ...item, unit: event.target.value } : item)),
                            )
                          }
                        />
                        <Input
                          className="sm:col-span-2"
                          type="number"
                          min={0}
                          step="any"
                          placeholder="Rate"
                          value={line.rate}
                          onChange={(event) =>
                            setQuoteLines((prev) =>
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
                          placeholder="Tax %"
                          value={line.taxPercent}
                          onChange={(event) =>
                            setQuoteLines((prev) =>
                              prev.map((item, i) =>
                                i === index ? { ...item, taxPercent: event.target.value } : item,
                              ),
                            )
                          }
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="sm:col-span-1"
                          disabled={quoteLines.length === 1}
                          onClick={() => setQuoteLines((prev) => prev.filter((_, i) => i !== index))}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                  {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setQuoteOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" loading={quoting}>
                      Save quote
                    </Button>
                  </div>
                </form>
              ) : null}
              {error && !quoteOpen ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
