'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
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
import { defaultMonthRange } from '@/features/finance/finance-gst-utils';
import { formatInr } from '@/features/finance/finance-procurement-utils';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useApplyFinanceBillTdsMutation,
  useGetFinanceBillsQuery,
  useGetFinanceGstTdsQuery,
} from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceGstTdsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_GST_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_GST_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_TAX_MANAGE);
  const canManage =
    permissions.includes(PERMISSIONS.FINANCE_GST_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_TAX_MANAGE);

  const defaults = defaultMonthRange();
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [applied, setApplied] = useState(defaults);
  const [error, setError] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);

  const { data, isLoading, isError, isFetching } = useGetFinanceGstTdsQuery(applied, {
    skip: !canView,
  });
  const { data: billsData } = useGetFinanceBillsQuery(undefined, { skip: !canManage });
  const [applyTds, { isLoading: applying }] = useApplyFinanceBillTdsMutation();

  const draftBills = useMemo(
    () => (billsData?.data ?? []).filter((bill) => bill.status === 'draft'),
    [billsData],
  );
  const rows = data?.data ?? [];

  async function onApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const billId = String(form.get('billId') ?? '').trim();
    const tdsSection = String(form.get('tdsSection') ?? '').trim();
    const tdsPercent = Number(form.get('tdsPercent') ?? 0);
    try {
      await applyTds({ id: billId, body: { tdsSection, tdsPercent } }).unwrap();
      setApplyOpen(false);
      event.currentTarget.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to apply TDS.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="GST & Tax" title="TDS" />
        <p className="max-w-2xl text-sm text-muted">You need GST view permission to open TDS deductions.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={applying} />
      <PageHeader
        kicker="GST & Tax"
        title="TDS"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setApplyOpen(true);
              }}
            >
              Apply TDS to draft bill
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Track TDS deducted on vendor bills. Apply section and percent on draft bills before posting.
      </p>

      <form
        className="mb-6 flex max-w-2xl flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied({ fromDate, toDate });
        }}
      >
        <div className="min-w-[10rem] flex-1">
          <Label htmlFor="fromDate">From</Label>
          <Input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            required
          />
        </div>
        <div className="min-w-[10rem] flex-1">
          <Label htmlFor="toDate">To</Label>
          <Input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={isFetching}>
          {isFetching ? 'Loading…' : 'Run'}
        </Button>
      </form>

      {error && !applyOpen ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load TDS deductions.</p> : null}

      <DataTable
        columns={[
          { id: 'number', header: 'Bill', cell: (row) => row.documentNumber },
          { id: 'date', header: 'Date', cell: (row) => row.billDate },
          { id: 'vendor', header: 'Vendor', cell: (row) => row.vendorName ?? '—' },
          { id: 'section', header: 'Section', cell: (row) => row.tdsSection || '—' },
          { id: 'percent', header: 'Percent', cell: (row) => `${row.tdsPercent}%` },
          { id: 'taxable', header: 'Taxable', cell: (row) => formatInr(row.taxableValue) },
          { id: 'amount', header: 'TDS amount', cell: (row) => formatInr(row.tdsAmount) },
          { id: 'status', header: 'Status', cell: (row) => row.status },
        ]}
        rows={rows.map((row) => ({ ...row, id: row.billId }))}
        loading={isLoading}
        emptyTitle="No TDS deductions"
        emptyDescription="No bills with TDS in this period."
      />

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogTitle>Apply TDS</DialogTitle>
          <DialogDescription>Set TDS section and percent on a draft vendor bill.</DialogDescription>
          {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
          <form className="mt-4 space-y-4" onSubmit={onApply}>
            <div>
              <Label htmlFor="billId">Draft bill</Label>
              <select id="billId" name="billId" className={SELECT_CLASS} required>
                <option value="">Select bill</option>
                {draftBills.map((bill) => (
                  <option key={bill.id} value={bill.id}>
                    {bill.documentNumber} — {bill.vendorName ?? 'Vendor'} ({formatInr(bill.subtotal)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="tdsSection">Section</Label>
              <Input id="tdsSection" name="tdsSection" placeholder="194C" required />
            </div>
            <div>
              <Label htmlFor="tdsPercent">Percent</Label>
              <Input
                id="tdsPercent"
                name="tdsPercent"
                type="number"
                min={0}
                max={100}
                step={0.01}
                defaultValue={2}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setApplyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={applying || !draftBills.length}>
                {applying ? 'Saving…' : 'Apply'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
