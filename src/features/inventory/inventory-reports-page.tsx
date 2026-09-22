'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { downloadCsv } from '@/features/finance/finance-gst-utils';
import {
  INVENTORY_PERIOD_OPTIONS,
  inventoryMonthRange,
  queryFromPeriodSelection,
  type InventoryReportQuery,
} from '@/features/inventory/inventory-report-range';
import { InventoryReportsPanels } from '@/features/inventory/inventory-reports-panels';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { useGetInventoryReportsQuery, useLazyExportInventoryAuditQuery } from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';
import type { InventoryReportPeriod } from '@/types/api';

type PeriodSelection = InventoryReportPeriod | 'last_month';

export function InventoryReportsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.INVENTORY_REPORTS_VIEW) ||
    permissions.includes(PERMISSIONS.INVENTORY_OVERVIEW_VIEW) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);

  const defaults = useMemo(() => inventoryMonthRange(-1), []);
  const [selection, setSelection] = useState<PeriodSelection>('last_month');
  const [customFrom, setCustomFrom] = useState(defaults.from);
  const [customTo, setCustomTo] = useState(defaults.to);
  const [applied, setApplied] = useState<InventoryReportQuery>(() =>
    queryFromPeriodSelection('last_month', defaults.from, defaults.to),
  );
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isLoading, isError, isFetching } = useGetInventoryReportsQuery(applied, {
    skip: !canView,
  });
  const [exportAudit, { isFetching: exporting }] = useLazyExportInventoryAuditQuery();
  const reports = data?.data;

  async function onExportAudit() {
    setExportError(null);
    if (!reports) {
      setExportError('Run a report first, then export audit for that range.');
      return;
    }
    try {
      const result = await exportAudit({
        from: reports.range.from,
        to: reports.range.to,
      }).unwrap();
      downloadCsv(result.data.filename, result.data.csv, result.data.contentType);
    } catch (cause) {
      setExportError(apiErrorMessage(cause, 'Unable to export audit CSV.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Reports" />
        <p className="text-sm text-muted">You need reports view permission.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="Inventory" title="Reports" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Answer spend and usage for any period — day, week, month, quarter, year, or a custom range.
        Lab-made reagents are excluded from purchase spend (their cost sits in the chemicals and
        solvents bought earlier). Export Audit downloads inventory audit_log rows for the same range.
      </p>

      <form
        className="mb-8 flex max-w-3xl flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(queryFromPeriodSelection(selection, customFrom, customTo));
        }}
      >
        <div className="min-w-[10rem]">
          <Label htmlFor="inv-period">Period</Label>
          <select
            id="inv-period"
            className="mt-1 flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={selection}
            onChange={(event) => setSelection(event.target.value as PeriodSelection)}
          >
            {INVENTORY_PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {selection === 'custom' ? (
          <>
            <div>
              <Label htmlFor="inv-from">From</Label>
              <Input
                id="inv-from"
                type="date"
                className="mt-1"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="inv-to">To</Label>
              <Input
                id="inv-to"
                type="date"
                className="mt-1"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                required
              />
            </div>
          </>
        ) : null}
        <Button type="submit" disabled={isFetching}>
          {isFetching ? 'Loading…' : 'Run report'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={exporting || !reports}
          onClick={() => void onExportAudit()}
        >
          {exporting ? 'Exporting…' : 'Export audit CSV'}
        </Button>
      </form>

      {exportError ? <p className="mb-4 text-sm text-danger">{exportError}</p> : null}

      {reports ? (
        <p className="mb-4 text-sm text-muted">
          Range: <span className="text-foreground">{reports.range.label}</span> ({reports.range.from} →{' '}
          {reports.range.to})
        </p>
      ) : (
        <Meta>Pick a period and run the report.</Meta>
      )}

      {isError ? <p className="mb-4 text-sm">Unable to load inventory reports.</p> : null}

      {reports ? <InventoryReportsPanels reports={reports} loading={isLoading} /> : null}
    </>
  );
}
