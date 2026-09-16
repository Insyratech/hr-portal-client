'use client';

import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { defaultMonthRange } from '@/features/finance/finance-gst-utils';
import { formatInr } from '@/features/finance/finance-procurement-utils';
import { useAppSelector } from '@/store/hooks';
import { useGetFinanceGstHsnQuery } from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceGstHsnPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_GST_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_GST_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_TAX_MANAGE);

  const defaults = defaultMonthRange();
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [applied, setApplied] = useState(defaults);

  const { data, isLoading, isError, isFetching } = useGetFinanceGstHsnQuery(applied, {
    skip: !canView,
  });
  const rows = data?.data ?? [];

  if (!canView) {
    return (
      <>
        <PageHeader kicker="GST & Tax" title="HSN summary" />
        <p className="max-w-2xl text-sm text-muted">You need GST view permission to open HSN summary.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="GST & Tax" title="HSN summary" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Taxable value and tax totals grouped by HSN/SAC for outward and inward lines.
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

      {isError ? <p className="mb-4 text-sm">Unable to load HSN summary.</p> : null}

      <DataTable
        columns={[
          { id: 'hsn', header: 'HSN/SAC', cell: (row) => row.hsnSac },
          { id: 'dir', header: 'Direction', cell: (row) => row.direction },
          { id: 'lines', header: 'Lines', cell: (row) => String(row.lineCount) },
          { id: 'taxable', header: 'Taxable', cell: (row) => formatInr(row.taxableValue) },
          { id: 'cgst', header: 'CGST', cell: (row) => formatInr(row.cgst) },
          { id: 'sgst', header: 'SGST', cell: (row) => formatInr(row.sgst) },
          { id: 'igst', header: 'IGST', cell: (row) => formatInr(row.igst) },
          { id: 'tax', header: 'Tax total', cell: (row) => formatInr(row.taxTotal) },
        ]}
        rows={rows.map((row) => ({ ...row, id: `${row.direction}-${row.hsnSac}` }))}
        loading={isLoading}
        emptyTitle="No HSN rows"
        emptyDescription="No taxable lines in this period."
      />
    </>
  );
}
