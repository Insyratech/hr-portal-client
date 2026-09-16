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
import { useGetFinanceSalesOverviewQuery } from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

function statusLabel(status: string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function FinanceSalesOverviewPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_SALES_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_SALES_MANAGE) ||
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

  const { data, isLoading, isError, isFetching } = useGetFinanceSalesOverviewQuery(applied, {
    skip: !canView,
  });
  const overview = data?.data;

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Sales" title="Overview" />
        <p className="max-w-2xl text-sm text-muted">
          You need sales or reports permission to open the sales overview.
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
      <PageHeader kicker="Sales" title="Overview" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Invoiced totals, collections, and pipeline counts for the selected period.
      </p>

      <form
        className="mb-6 flex max-w-2xl flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied({ fromDate, toDate });
        }}
      >
        <div className="min-w-[10rem] flex-1">
          <Label htmlFor="sales-from">From</Label>
          <Input
            id="sales-from"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            required
          />
        </div>
        <div className="min-w-[10rem] flex-1">
          <Label htmlFor="sales-to">To</Label>
          <Input
            id="sales-to"
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
          <Link href="/finance/invoices">Invoices</Link>
        </Button>
      </form>

      {isError ? <p className="mb-4 text-sm">Unable to load sales overview.</p> : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <FinanceKpiCard
          title="Invoiced"
          accent="sky"
          value={overview ? formatInr(overview.invoicedTotal) : isLoading ? '—' : formatInr(0)}
          secondary={overview ? `${overview.invoicedCount} posted invoices` : undefined}
          trend={overview ? kpiTrend(overview.invoicedTotal, overview.priorInvoicedTotal) : null}
          priorLabel={
            overview
              ? `${formatInr(overview.invoicedTotal - overview.priorInvoicedTotal)} vs prior (${formatInr(overview.priorInvoicedTotal)})`
              : undefined
          }
        />
        <FinanceKpiCard
          title="Payments received"
          accent="emerald"
          value={overview ? formatInr(overview.paymentsReceived) : isLoading ? '—' : formatInr(0)}
          secondary="Posted in range"
        />
        <FinanceKpiCard
          title="Outstanding"
          accent="cyan"
          value={overview ? formatInr(overview.outstanding) : isLoading ? '—' : formatInr(0)}
          secondary={
            overview
              ? `Overdue ${formatInr(overview.overdueAmount)} · ${overview.overdueCount} invoices`
              : undefined
          }
        />
        <FinanceKpiCard
          title="Open quotes"
          accent="violet"
          value={overview ? String(overview.quotesOpen) : isLoading ? '—' : '0'}
          secondary="Draft + sent"
        />
        <FinanceKpiCard
          title="Open orders"
          accent="amber"
          value={overview ? String(overview.ordersOpen) : isLoading ? '—' : '0'}
          secondary="Confirmed through partially invoiced"
        />
        <FinanceKpiCard
          title="Draft invoices"
          accent="rose"
          value={overview ? String(overview.invoicesDraft) : isLoading ? '—' : '0'}
          secondary="Not yet posted"
        />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <FinanceChartCard title="Sales trend" description="Posted invoice totals by month.">
          {(overview?.trend.length ?? 0) === 0 && !isLoading ? (
            <FinanceEmptyChart message="No invoiced amount in this range." />
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
                  name="Invoiced"
                  stroke={CHART.sky}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART.sky }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </FinanceChartCard>
        <FinanceChartCard title="By status" description="Posted invoices in range grouped by status.">
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
                <Bar dataKey="amount" name="Amount" fill={CHART.violet} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </FinanceChartCard>
      </div>

      <section className="mb-8">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium">Top customers</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/finance/customers" className="underline-offset-2 hover:underline">
              Customers
            </Link>
            <Link href="/finance/quotes" className="underline-offset-2 hover:underline">
              Quotes
            </Link>
            <Link href="/finance/sales-orders" className="underline-offset-2 hover:underline">
              Sales orders
            </Link>
            <Link href="/finance/payments-received" className="underline-offset-2 hover:underline">
              Payments received
            </Link>
          </div>
        </div>
        <DataTable
          columns={[
            {
              id: 'name',
              header: 'Customer',
              cell: (row) =>
                row.href ? (
                  <Link href={row.href} className="underline-offset-2 hover:underline">
                    {row.name}
                  </Link>
                ) : (
                  row.name
                ),
            },
            { id: 'count', header: 'Invoices', cell: (row) => row.count ?? 0 },
            { id: 'amount', header: 'Invoiced', cell: (row) => formatInr(row.amount) },
          ]}
          rows={overview?.topCustomers ?? []}
          loading={isLoading}
          emptyTitle="No customers in range"
          emptyDescription="Posted invoices will rank customers here."
        />
      </section>
    </>
  );
}
