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
  procurementStatusTone,
  type MoneyLineDraft,
} from '@/features/finance/finance-procurement-utils';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useCreateFinanceVendorCreditMutation,
  useGetFinanceBillsQuery,
  useGetFinanceVendorCreditsQuery,
  useGetFinanceVendorsQuery,
  usePostFinanceVendorCreditMutation,
} from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceVendorCreditsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_INDENT_APPROVE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE);

  const { data, isLoading, isError } = useGetFinanceVendorCreditsQuery(undefined, { skip: !canView });
  const { data: vendorsData } = useGetFinanceVendorsQuery(undefined, { skip: !canManage });
  const { data: billsData } = useGetFinanceBillsQuery(undefined, { skip: !canManage });
  const [createCredit, { isLoading: creating }] = useCreateFinanceVendorCreditMutation();
  const [postCredit, { isLoading: posting }] = usePostFinanceVendorCreditMutation();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [vendorId, setVendorId] = useState('');
  const [lines, setLines] = useState<MoneyLineDraft[]>([newMoneyLine()]);

  const vendorBills = (billsData?.data ?? []).filter((bill) => bill.vendorId === vendorId);

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
        vendorId,
        billId: String(form.get('billId') ?? '').trim() || null,
        creditDate: String(form.get('creditDate') ?? '').trim() || undefined,
        reason: String(form.get('reason') ?? '').trim() || undefined,
        lines: prepared,
      }).unwrap();
      setCreateOpen(false);
      setVendorId('');
      setLines([newMoneyLine()]);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create vendor credit.'));
    }
  }

  async function onPost(id: string) {
    setError(null);
    try {
      await postCredit(id).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to post vendor credit.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Purchases" title="Vendor credits" />
        <p className="max-w-2xl text-sm text-muted">You need purchase view permission to open vendor credits.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || posting} />
      <PageHeader
        kicker="Purchases"
        title="Vendor credits"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setVendorId('');
                setLines([newMoneyLine()]);
                setCreateOpen(true);
              }}
            >
              New credit
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Capture vendor credit notes and post them when ready.
      </p>
      {error && !createOpen ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load vendor credits.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'vendor', header: 'Vendor', cell: (row) => row.vendorName || '—' },
          { id: 'date', header: 'Date', cell: (row) => row.creditDate },
          { id: 'total', header: 'Total', cell: (row) => formatInr(row.grandTotal) },
          { id: 'reason', header: 'Reason', cell: (row) => row.reason || '—' },
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
        emptyTitle="No vendor credits"
        emptyDescription="Create a credit note against a vendor."
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>New vendor credit</DialogTitle>
          <DialogDescription>Optional link to a bill, plus credit lines.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="vendorId">Vendor</Label>
              <select
                id="vendorId"
                className={SELECT_CLASS}
                value={vendorId}
                onChange={(event) => setVendorId(event.target.value)}
                required
              >
                <option value="">Select vendor</option>
                {(vendorsData?.data ?? []).map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="billId">Related bill (optional)</Label>
              <select id="billId" name="billId" className={SELECT_CLASS} defaultValue="">
                <option value="">None</option>
                {vendorBills.map((bill) => (
                  <option key={bill.id} value={bill.id}>
                    {bill.documentNumber} — {formatInr(bill.grandTotal)}
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
                <Button type="button" variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, newMoneyLine()])}>
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
              <Button type="submit" loading={creating} disabled={!vendorId}>
                Create credit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
