'use client';

import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { defaultMonthRange } from '@/features/finance/finance-gst-utils';
import { formatInr } from '@/features/finance/finance-procurement-utils';
import { useAppSelector } from '@/store/hooks';
import {
  useGetFinanceGstOutwardQuery,
  useGetFinanceGstSummaryQuery,
} from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceGstOutwardPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_GST_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_GST_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_TAX_MANAGE);

  const defaults = defaultMonthRange();
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [applied, setApplied] = useState(defaults);

  const { data: summaryData } = useGetFinanceGstSummaryQuery(applied, { skip: !canView });
  const { data, isLoading, isError, isFetching } = useGetFinanceGstOutwardQuery(applied, {
    skip: !canView,
  });

  const rows = data?.data ?? [];
  const summary = summaryData?.data;

  if (!canView) {
    return (
      <>
        <PageHeader kicker="GST & Tax" title="Outward register" />
        <p className="max-w-2xl text-sm text-muted">You need GST view permission to open this register.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="GST & Tax" title="Outward register" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Posted invoices and credit notes for the selected period. Credit notes reduce taxable value and tax.
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
          <span>Taxable {formatInr(summary.outwardTaxable)}</span>
          <span>Tax {formatInr(summary.outwardTax)}</span>
          <span>Net GST liability {formatInr(summary.netGstLiability)}</span>
        </div>
      ) : null}

      {isError ? <p className="mb-4 text-sm">Unable to load outward register.</p> : null}

      <DataTable
        columns={[
          {
            id: 'type',
            header: 'Type',
            cell: (row) => (
              <StatusBadge
                status={row.documentType === 'credit_note' ? 'rejected' : 'approved'}
                label={row.documentType === 'credit_note' ? 'Credit note' : 'Invoice'}
              />
            ),
          },
          { id: 'number', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'date', header: 'Date', cell: (row) => row.documentDate },
          { id: 'customer', header: 'Customer', cell: (row) => row.customerName ?? '—' },
          { id: 'gstin', header: 'GSTIN', cell: (row) => row.customerGstin ?? '—' },
          { id: 'supply', header: 'Supply', cell: (row) => row.supplyType },
          { id: 'pos', header: 'Place of supply', cell: (row) => row.placeOfSupplyState ?? '—' },
          {
            id: 'taxable',
            header: 'Taxable',
            cell: (row) => formatInr(row.signedTaxableValue),
          },
          { id: 'cgst', header: 'CGST', cell: (row) => formatInr(row.documentType === 'credit_note' ? -row.cgst : row.cgst) },
          { id: 'sgst', header: 'SGST', cell: (row) => formatInr(row.documentType === 'credit_note' ? -row.sgst : row.sgst) },
          { id: 'igst', header: 'IGST', cell: (row) => formatInr(row.documentType === 'credit_note' ? -row.igst : row.igst) },
          {
            id: 'issues',
            header: 'Issues',
            cell: (row) =>
              row.issues.length ? row.issues.map((issue) => issue.code).join(', ') : '—',
          },
        ]}
        rows={rows.map((row) => ({ ...row, id: row.documentId }))}
        loading={isLoading}
        emptyTitle="No outward documents"
        emptyDescription="No posted invoices or credit notes in this period."
      />
    </>
  );
}
