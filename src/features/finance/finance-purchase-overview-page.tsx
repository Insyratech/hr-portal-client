'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/theme-provider';
import { FinanceChartCard, FinanceEmptyChart } from '@/features/finance/finance-chart-card';
import { FinanceKpiCard, kpiTrend } from '@/features/finance/finance-kpi-card';
import { defaultMonthRange } from '@/features/finance/finance-gst-utils';
import { formatInr } from '@/features/finance/finance-procurement-utils';
import { CHART, chartTooltipStyle } from '@/features/reports/chart-theme';
import { useAppSelector } from '@/store/hooks';
import { useGetFinancePurchaseOverviewQuery } from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

function statusLabel(status: string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function FinancePurchaseOverviewPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_REPORTS_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_MANAGE);

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tooltip = chartTooltipStyle(isDark);
  const axisStroke = isDark ? '#737373' : '#a3a3a3';
  const gridStroke = isDark ? '#262626' : '#e5e5e5';

  const defaults = useMemo(() => defaultMonthRange(), []);
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [applied, setApplied] = useState(defaults);

  const { data, isLoading, isError, isFetching } = useGetFinancePurchaseOverviewQuery(applied, {
    skip: !canView,
  });
  const overview = data?.data;

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Purchases" title="Overview" />
        <p className="max-w-2xl text-sm text-muted">
          You need purchase or reports permission to open the purchase overview.
        </p>
      </>
    );
  }

  const statusChart = (overview?.byStatus ?? []).map((row) => ({
    ...row,
    label: statusLabel(row.status),
  }));

  return (
    <>
      <PageHeader kicker="Purchases" title="Overview" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Billed totals, payments made, and procurement pipeline counts for the selected period.
      </p>

      <form
        className="mb-6 flex max-w-2xl flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied({ fromDate, toDate });
        }}
      >
        <div className="min-w-[10rem] flex-1">
          <Label htmlFor="purchase-from">From</Label>
          <Input
            id="purchase-from"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            required
          />
        </div>
        <div className="min-w-[10rem] flex-1">
          <Label htmlFor="purchase-to">To</Label>
          <Input
            id="purchase-to"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={isFetching}>
          {isFetching ? 'Loading…' : 'Apply'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/finance/bills">Bills</Link>
        </Button>
      </form>

      {isError ? <p className="mb-4 text-sm">Unable to load purchase overview.</p> : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <FinanceKpiCard
          title="Billed"
          accent="amber"
          value={overview ? formatInr(overview.billedTotal) : isLoading ? '—' : formatInr(0)}
          secondary={overview ? `${overview.billedCount} posted bills` : undefined}
          trend={overview ? kpiTrend(overview.billedTotal, overview.priorBilledTotal) : null}
          priorLabel={
            overview
              ? `${formatInr(overview.billedTotal - overview.priorBilledTotal)} vs prior (${formatInr(overview.priorBilledTotal)})`
              : undefined
          }
        />
        <FinanceKpiCard
          title="Payments made"
          accent="rose"
          value={overview ? formatInr(overview.paymentsMade) : isLoading ? '—' : formatInr(0)}
          secondary="Posted in range"
        />
        <FinanceKpiCard
          title="Outstanding"
          accent="amber"
          value={overview ? formatInr(overview.outstanding) : isLoading ? '—' : formatInr(0)}
          secondary={
            overview
              ? `Overdue ${formatInr(overview.overdueAmount)} · ${overview.overdueCount} bills`
              : undefined
          }
        />
        <FinanceKpiCard
          title="Indents pending"
          accent="violet"
          value={overview ? String(overview.indentsPending) : isLoading ? '—' : '0'}
          secondary="Submitted awaiting approval"
        />
        <FinanceKpiCard
          title="Open POs"
          accent="sky"
          value={overview ? String(overview.posOpen) : isLoading ? '—' : '0'}
          secondary="Draft through received"
        />
        <FinanceKpiCard
          title="Draft bills"
          accent="cyan"
          value={overview ? String(overview.billsDraft) : isLoading ? '—' : '0'}
          secondary="Not yet posted"
        />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <FinanceChartCard title="Purchase trend" description="Posted bill totals by month.">
          {(overview?.trend.length ?? 0) === 0 && !isLoading ? (
            <FinanceEmptyChart message="No billed amount in this range." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overview?.trend ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 12 }} />
                <YAxis
                  stroke={axisStroke}
                  tick={{ fill: axisStroke, fontSize: 12 }}
                  tickFormatter={(v: number) => formatInr(v)}
                  width={72}
                />
                <Tooltip {...tooltip} formatter={(value: number | string) => formatInr(Number(value))} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Billed"
                  stroke={CHART.amber}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART.amber }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </FinanceChartCard>
        <FinanceChartCard title="By status" description="Posted bills in range grouped by status.">
          {statusChart.length === 0 && !isLoading ? (
            <FinanceEmptyChart message="No status breakdown yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} />
                <YAxis
                  stroke={axisStroke}
                  tick={{ fill: axisStroke, fontSize: 12 }}
                  tickFormatter={(v: number) => formatInr(v)}
                  width={72}
                />
                <Tooltip {...tooltip} formatter={(value: number | string) => formatInr(Number(value))} />
                <Bar dataKey="amount" name="Amount" fill={CHART.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </FinanceChartCard>
      </div>

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium">Top vendors</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/finance/vendors" className="underline-offset-2 hover:underline">
              Vendors
            </Link>
            <Link href="/finance/indents" className="underline-offset-2 hover:underline">
              Indents
            </Link>
            <Link href="/finance/purchase-orders" className="underline-offset-2 hover:underline">
              Purchase orders
            </Link>
            <Link href="/finance/payments" className="underline-offset-2 hover:underline">
              Payments
            </Link>
          </div>
        </div>
        <DataTable
          columns={[
            {
              id: 'name',
              header: 'Vendor',
              cell: (row) =>
                row.href ? (
                  <Link href={row.href} className="underline-offset-2 hover:underline">
                    {row.name}
                  </Link>
                ) : (
                  row.name
                ),
            },
            { id: 'count', header: 'Bills', cell: (row) => row.count ?? 0 },
            { id: 'amount', header: 'Billed', cell: (row) => formatInr(row.amount) },
          ]}
          rows={overview?.topVendors ?? []}
          loading={isLoading}
          emptyTitle="No vendors in range"
          emptyDescription="Posted bills will rank vendors here."
        />
      </section>
    </>
  );
}
