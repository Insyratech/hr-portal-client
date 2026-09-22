'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatInr } from '@/features/finance/finance-procurement-utils';
import {
  INVENTORY_PERIOD_OPTIONS,
  inventoryMonthRange,
  queryFromPeriodSelection,
  type InventoryReportQuery,
} from '@/features/inventory/inventory-report-range';
import { InventoryReportsPanels } from '@/features/inventory/inventory-reports-panels';
import { useGetInventoryAdminDashboardQuery } from '@/store/api/api';
import type { InventoryReportPeriod } from '@/types/api';

type PeriodSelection = InventoryReportPeriod | 'last_month';

function kindLabel(kind: string): string {
  if (kind === 'expiry') return 'Expiry';
  if (kind === 'reorder') return 'Reorder';
  if (kind === 'velocity') return 'Velocity';
  return kind;
}

export function InventoryAdminOverviewPage() {
  const defaults = useMemo(() => inventoryMonthRange(-1), []);
  const [selection, setSelection] = useState<PeriodSelection>('last_month');
  const [customFrom, setCustomFrom] = useState(defaults.from);
  const [customTo, setCustomTo] = useState(defaults.to);
  const [applied, setApplied] = useState<InventoryReportQuery>(() =>
    queryFromPeriodSelection('last_month', defaults.from, defaults.to),
  );

  const { data, isLoading, isError, isFetching } = useGetInventoryAdminDashboardQuery(applied);
  const dashboard = data?.data;

  return (
    <>
      <PageHeader kicker="Super Admin" title={dashboard?.title ?? 'Inventory'} />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        {isLoading && !dashboard
          ? 'Loading inventory dashboard…'
          : isError
            ? 'Unable to load inventory dashboard.'
            : (dashboard?.message ??
              'Stock health, spend, usage, and alert queue. Inventory Manager operates day-to-day.')}
      </p>

      <form
        className="mb-8 flex max-w-3xl flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(queryFromPeriodSelection(selection, customFrom, customTo));
        }}
      >
        <div className="min-w-[10rem]">
          <Label htmlFor="sa-inv-period">Period</Label>
          <select
            id="sa-inv-period"
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
              <Label htmlFor="sa-inv-from">From</Label>
              <Input
                id="sa-inv-from"
                type="date"
                className="mt-1"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="sa-inv-to">To</Label>
              <Input
                id="sa-inv-to"
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
          {isFetching ? 'Loading…' : 'Refresh'}
        </Button>
      </form>

      {dashboard ? (
        <>
          <p className="mb-4 text-sm text-muted">
            Range: <span className="text-foreground">{dashboard.range.label}</span> (
            {dashboard.range.from} → {dashboard.range.to})
          </p>

          <div className="mb-8 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(
              [
                ['Locations', dashboard.kpis.locations],
                ['Catalog', dashboard.kpis.catalogItems],
                ['Active lots', dashboard.kpis.activeLots],
                ['Plastic SKUs', dashboard.kpis.plasticStock],
                ['Stations', dashboard.kpis.stations],
                ['Authorizations', dashboard.kpis.authorizations],
                ['Active alerts', dashboard.kpis.activeAlerts],
                ['Spend in range', formatInr(dashboard.kpis.spendInRange)],
                ['Issues in range', dashboard.kpis.issuesInRange],
                ['Adjustments', dashboard.kpis.adjustmentsInRange],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded border border-border px-4 py-3">
                <p className="text-2xl font-medium tabular-nums">{value}</p>
                <p className="text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>

          <section className="mb-10 max-w-3xl">
            <h2 className="mb-1 text-sm font-medium">Stock health</h2>
            <Meta>Phase {dashboard.phase}</Meta>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(
                [
                  ['Active lots', dashboard.stockHealth.activeLots],
                  ['Depleted lots', dashboard.stockHealth.depletedLots],
                  ['Void lots', dashboard.stockHealth.voidLots],
                  ['Active plastic', dashboard.stockHealth.activePlastic],
                  ['Depleted plastic', dashboard.stockHealth.depletedPlastic],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded border border-border px-4 py-3">
                  <p className="text-xl font-medium tabular-nums">{value}</p>
                  <p className="text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-sm font-medium">Active alert queue</h2>
            <DataTable
              columns={[
                { id: 'kind', header: 'Kind', cell: (row) => kindLabel(row.alertKind) },
                {
                  id: 'title',
                  header: 'Alert',
                  cell: (row) =>
                    row.deepLink ? (
                      <Link href={row.deepLink} className="underline-offset-2 hover:underline">
                        {row.title}
                      </Link>
                    ) : (
                      row.title
                    ),
                },
                { id: 'code', header: 'Code', cell: (row) => row.subjectCode || '—' },
                { id: 'detail', header: 'Detail', cell: (row) => row.detail },
              ]}
              rows={dashboard.activeAlerts.map((row) => ({
                ...row,
                id: `${row.subjectType}:${row.subjectId}:${row.alertKind}`,
              }))}
              loading={isLoading}
              emptyTitle="No active alerts"
              emptyDescription="Stock levels and expiry dates are within thresholds."
            />
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-sm font-medium">Recent alert notifications (14 days)</h2>
            <DataTable
              columns={[
                { id: 'date', header: 'Date', cell: (row) => row.alertDate },
                { id: 'kind', header: 'Kind', cell: (row) => kindLabel(row.alertKind) },
                {
                  id: 'title',
                  header: 'Alert',
                  cell: (row) =>
                    row.deepLink ? (
                      <Link href={row.deepLink} className="underline-offset-2 hover:underline">
                        {row.title}
                      </Link>
                    ) : (
                      row.title
                    ),
                },
                { id: 'detail', header: 'Detail', cell: (row) => row.detail },
              ]}
              rows={dashboard.alertQueue}
              loading={isLoading}
              emptyTitle="No alert mail yet"
              emptyDescription="Claimed daily alerts appear here after the job runs."
            />
          </section>

          <InventoryReportsPanels
            reports={{
              range: dashboard.range,
              spend: dashboard.spend,
              usage: dashboard.usage,
              adjustments: dashboard.adjustments,
            }}
            loading={isLoading}
          />
        </>
      ) : null}
    </>
  );
}
