'use client';

import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
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
  useGetFinanceGstInwardQuery,
  useGetFinanceGstSummaryQuery,
  useSetFinanceBillItcMutation,
} from '@/store/api/api';
import type { GstInwardRow } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceGstInwardPage() {
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

  const { data: summaryData } = useGetFinanceGstSummaryQuery(applied, { skip: !canView });
  const { data, isLoading, isError, isFetching } = useGetFinanceGstInwardQuery(applied, {
    skip: !canView,
  });
  const [setItc, { isLoading: saving }] = useSetFinanceBillItcMutation();

  const rows = data?.data ?? [];
  const summary = summaryData?.data;

  async function onItcChange(row: GstInwardRow, itcEligibility: GstInwardRow['itcEligibility']) {
    if (!canManage || itcEligibility === row.itcEligibility) return;
    setError(null);
    try {
      await setItc({ id: row.documentId, body: { itcEligibility } }).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update ITC eligibility.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="GST & Tax" title="Inward / ITC" />
        <p className="max-w-2xl text-sm text-muted">You need GST view permission to open this register.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={saving} />
      <PageHeader kicker="GST & Tax" title="Inward / ITC" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Posted vendor bills with place-of-supply validation, TDS snapshot, and ITC eligibility.
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

      {summary ? (
        <div className="mb-4 flex flex-wrap gap-4 text-sm text-muted">
          <span>Inward taxable {formatInr(summary.inwardTaxable)}</span>
          <span>Inward tax {formatInr(summary.inwardTax)}</span>
          <span>ITC eligible {formatInr(summary.itcEligible)}</span>
          <span>ITC claimed {formatInr(summary.itcClaimed)}</span>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load inward register.</p> : null}

      <DataTable
        columns={[
          { id: 'number', header: 'Bill', cell: (row) => row.documentNumber },
          { id: 'date', header: 'Date', cell: (row) => row.documentDate },
          { id: 'vendor', header: 'Vendor', cell: (row) => row.vendorName ?? '—' },
          { id: 'gstin', header: 'GSTIN', cell: (row) => row.vendorGstin ?? '—' },
          { id: 'pos', header: 'Place of supply', cell: (row) => row.placeOfSupplyState ?? '—' },
          { id: 'taxable', header: 'Taxable', cell: (row) => formatInr(row.taxableValue) },
          { id: 'tax', header: 'Tax', cell: (row) => formatInr(row.taxTotal) },
          { id: 'itcAmt', header: 'ITC amount', cell: (row) => formatInr(row.itcAmount) },
          {
            id: 'itc',
            header: 'ITC eligibility',
            cell: (row) =>
              canManage ? (
                <select
                  className={SELECT_CLASS}
                  value={row.itcEligibility}
                  onChange={(event) =>
                    void onItcChange(
                      row,
                      event.target.value as GstInwardRow['itcEligibility'],
                    )
                  }
                >
                  <option value="eligible">Eligible</option>
                  <option value="ineligible">Ineligible</option>
                  <option value="claimed">Claimed</option>
                  <option value="reversed">Reversed</option>
                </select>
              ) : (
                row.itcEligibility
              ),
          },
          {
            id: 'issues',
            header: 'Issues',
            cell: (row) =>
              row.issues.length ? (
                <span className="text-danger" title={row.issues.map((i) => i.message).join('; ')}>
                  {row.issues.map((issue) => issue.code).join(', ')}
                </span>
              ) : (
                '—'
              ),
          },
        ]}
        rows={rows.map((row) => ({ ...row, id: row.documentId }))}
        loading={isLoading}
        emptyTitle="No inward documents"
        emptyDescription="No posted vendor bills in this period."
      />
    </>
  );
}
