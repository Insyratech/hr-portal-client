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
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useCreateFinanceCreditNoteMutation,
  useGetFinanceCreditNotesQuery,
  useGetFinanceCustomersQuery,
  useGetFinanceInvoicesQuery,
  usePostFinanceCreditNoteMutation,
} from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceCreditNotesPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_SALES_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_SALES_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_SALES_MANAGE);

  const { data, isLoading, isError } = useGetFinanceCreditNotesQuery(undefined, { skip: !canView });
  const { data: customersData } = useGetFinanceCustomersQuery(undefined, { skip: !canManage });
  const { data: invoicesData } = useGetFinanceInvoicesQuery(undefined, { skip: !canManage });
  const [createCredit, { isLoading: creating }] = useCreateFinanceCreditNoteMutation();
  const [postCredit, { isLoading: posting }] = usePostFinanceCreditNoteMutation();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<MoneyLineDraft[]>([newMoneyLine()]);

  const customerInvoices = (invoicesData?.data ?? []).filter((invoice) => invoice.customerId === customerId);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const prepared = lines
      .map((line) => ({
        description: line.description.trim(),
        quantity: Number(line.quantity),
        rate: Number(line.rate),
        taxPercent: Number(line.taxPercent),
      }))
      .filter((line) => line.description && line.quantity > 0);
    if (!prepared.length) {
      setError('Add at least one credit line.');
      return;
    }
    try {
      await createCredit({
        customerId,
        invoiceId: String(form.get('invoiceId') ?? '').trim() || null,
        creditDate: String(form.get('creditDate') ?? '').trim() || undefined,
        reason: String(form.get('reason') ?? '').trim() || undefined,
        lines: prepared,
      }).unwrap();
      setCreateOpen(false);
      setCustomerId('');
      setLines([newMoneyLine()]);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create credit note.'));
    }
  }

  async function onPost(id: string) {
    setError(null);
    try {
      await postCredit(id).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to post credit note.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Sales" title="Credit notes" />
        <p className="max-w-2xl text-sm text-muted">You need sales view permission to open credit notes.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || posting} />
      <PageHeader
        kicker="Sales"
        title="Credit notes"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setCustomerId('');
                setLines([newMoneyLine()]);
                setCreateOpen(true);
              }}
            >
              New credit note
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Capture customer credit notes and post them when ready.
      </p>
      {error && !createOpen ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load credit notes.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'customer', header: 'Customer', cell: (row) => row.customerName || '—' },
          { id: 'date', header: 'Date', cell: (row) => row.creditDate },
          { id: 'total', header: 'Total', cell: (row) => formatInr(row.grandTotal) },
          { id: 'reason', header: 'Reason', cell: (row) => row.reason || '—' },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={salesStatusTone(row.status)} label={row.status} />,
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
        emptyTitle="No credit notes"
        emptyDescription="Create a credit note against a customer."
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>New credit note</DialogTitle>
          <DialogDescription>Optional link to an invoice, plus credit lines.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="customerId">Customer</Label>
              <select
                id="customerId"
                className={SELECT_CLASS}
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                required
              >
                <option value="">Select customer</option>
                {(customersData?.data ?? []).map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="invoiceId">Related invoice (optional)</Label>
              <select id="invoiceId" name="invoiceId" className={SELECT_CLASS} defaultValue="">
                <option value="">None</option>
                {customerInvoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.documentNumber} — {formatInr(invoice.grandTotal)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="creditDate">Credit date</Label>
                <Input id="creditDate" name="creditDate" type="date" />
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Input id="reason" name="reason" />
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
                    className="sm:col-span-5"
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
                    className="sm:col-span-2"
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
              <Button type="submit" loading={creating} disabled={!customerId}>
                Create credit note
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
