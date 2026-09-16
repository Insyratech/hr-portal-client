'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/components/theme-provider';
import { FinanceChartCard, FinanceEmptyChart } from '@/features/finance/finance-chart-card';
import { FinanceKpiCard, kpiTrend } from '@/features/finance/finance-kpi-card';
import { defaultMonthRange } from '@/features/finance/finance-gst-utils';
import { formatInr } from '@/features/finance/finance-procurement-utils';
import { CHART, chartTooltipStyle } from '@/features/reports/chart-theme';
import { useAppSelector } from '@/store/hooks';
import { useGetFinanceDashboardQuery, useGetFinanceSetupQuery } from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';
import { cn } from '@/lib/utils';

function priorCompareLabel(current: number, prior: number): string {
  const delta = current - prior;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${formatInr(delta)} vs prior period (${formatInr(prior)})`;
}

export function FinanceOverviewPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canViewReports =
    permissions.includes(PERMISSIONS.FINANCE_REPORTS_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_MANAGE);
  const canViewSales =
    permissions.includes(PERMISSIONS.FINANCE_SALES_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_SALES_MANAGE) ||
    canViewReports;
  const canViewPurchase =
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE) ||
    canViewReports;

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tooltip = chartTooltipStyle(isDark);
  const axisStroke = isDark ? '#737373' : '#a3a3a3';
  const gridStroke = isDark ? '#262626' : '#e5e5e5';

  const defaults = useMemo(() => defaultMonthRange(), []);
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [applied, setApplied] = useState(defaults);

  const { data, isLoading, isError, isFetching } = useGetFinanceDashboardQuery(applied, {
    skip: !canViewReports,
  });
  const { data: setupData } = useGetFinanceSetupQuery();
  const checklist = setupData?.data;
  const percent = checklist?.percentComplete ?? 0;
  const dash = data?.data;
  const [checklistOpen, setChecklistOpen] = useState(percent < 100);

  if (!canViewReports) {
    return (
      <>
        <PageHeader kicker="Finance" title="Overview" />
        <p className="max-w-2xl text-sm text-muted">
          You need reports or accountant view permission to open the finance dashboard.
        </p>
      </>
    );
  }

  const cashAccent = (dash?.cashFlow.net ?? 0) >= 0 ? 'emerald' : 'rose';

  return (
    <>
      <PageHeader kicker="Finance" title="Overview" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Receivables, payables, cash movement, and attention items for the selected period. Open the reports
        center for full packs.
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
          {isFetching ? 'Loading…' : 'Apply'}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/finance/reports">Reports center</Link>
        </Button>
      </form>

      {isError ? <p className="mb-4 text-sm">Unable to load dashboard.</p> : null}

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        {canViewSales ? (
          <Link href="/finance/sales/overview" className="underline-offset-2 hover:underline">
            Sales overview
          </Link>
        ) : null}
        {canViewPurchase ? (
          <Link href="/finance/purchases/overview" className="underline-offset-2 hover:underline">
            Purchase overview
          </Link>
        ) : null}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceKpiCard
          title="Receivables"
          accent="sky"
          value={dash ? formatInr(dash.receivables.total) : isLoading ? '—' : formatInr(0)}
          secondary={
            dash
              ? `Current ${formatInr(dash.receivables.current)} · Overdue ${formatInr(dash.receivables.overdue)}`
              : undefined
          }
          trend={dash ? kpiTrend(dash.receivables.total, dash.priorPeriod.receivablesTotal) : null}
          priorLabel={
            dash ? priorCompareLabel(dash.receivables.total, dash.priorPeriod.receivablesTotal) : undefined
          }
        />
        <FinanceKpiCard
          title="Payables"
          accent="amber"
          value={dash ? formatInr(dash.payables.total) : isLoading ? '—' : formatInr(0)}
          secondary={
            dash
              ? `Current ${formatInr(dash.payables.current)} · Overdue ${formatInr(dash.payables.overdue)}`
              : undefined
          }
          trend={dash ? kpiTrend(dash.payables.total, dash.priorPeriod.payablesTotal) : null}
          invertTrend
          priorLabel={
            dash ? priorCompareLabel(dash.payables.total, dash.priorPeriod.payablesTotal) : undefined
          }
        />
        <FinanceKpiCard
          title="Cash flow"
          accent={cashAccent}
          value={dash ? formatInr(dash.cashFlow.net) : isLoading ? '—' : formatInr(0)}
          secondary={
            dash
              ? `In ${formatInr(dash.cashFlow.inflow)} · Out ${formatInr(dash.cashFlow.outflow)}`
              : undefined
          }
          trend={dash ? kpiTrend(dash.cashFlow.net, dash.priorPeriod.cashFlowNet) : null}
          priorLabel={dash ? priorCompareLabel(dash.cashFlow.net, dash.priorPeriod.cashFlowNet) : undefined}
        />
        <FinanceKpiCard
          title="Income vs expense"
          accent="violet"
          value={dash ? formatInr(dash.incomeVsExpense.net) : isLoading ? '—' : formatInr(0)}
          secondary={
            dash
              ? `Income ${formatInr(dash.incomeVsExpense.income)} · Expense ${formatInr(dash.incomeVsExpense.expense)}`
              : undefined
          }
          trend={dash ? kpiTrend(dash.incomeVsExpense.net, dash.priorPeriod.incomeVsExpenseNet) : null}
          priorLabel={
            dash
              ? priorCompareLabel(dash.incomeVsExpense.net, dash.priorPeriod.incomeVsExpenseNet)
              : undefined
          }
        />
      </div>

      <div className="mb-8">
        <FinanceChartCard
          title="Sales trend"
          description="Posted invoice totals by month in the selected range."
        >
          {(dash?.salesTrend.length ?? 0) === 0 && !isLoading ? (
            <FinanceEmptyChart message="No posted invoices in this range." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash?.salesTrend ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 12 }} />
                <YAxis
                  stroke={axisStroke}
                  tick={{ fill: axisStroke, fontSize: 12 }}
                  tickFormatter={(v: number) => formatInr(v)}
                  width={72}
                />
                <Tooltip
                  {...tooltip}
                  formatter={(value: number | string) => formatInr(Number(value))}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Invoiced"
                  stroke={CHART.sky}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART.sky }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </FinanceChartCard>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3 text-sm">
        <Meta>Trial balance</Meta>
        {dash ? (
          <>
            <StatusBadge
              status={dash.trialBalanceBalanced ? 'approved' : 'rejected'}
              label={dash.trialBalanceBalanced ? 'Balanced' : 'Out of balance'}
            />
            <span className="text-muted">
              Debit {formatInr(dash.trialBalanceTotalDebit)} · Credit {formatInr(dash.trialBalanceTotalCredit)}
            </span>
            <Link href="/finance/trial-balance" className="text-sm underline-offset-2 hover:underline">
              Open trial balance
            </Link>
          </>
        ) : (
          <span className="text-muted">{isLoading ? 'Loading…' : '—'}</span>
        )}
      </div>

      <section className="mb-10">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium">Attention required</h2>
        </div>
        {(dash?.attention.length ?? 0) === 0 && !isLoading ? (
          <p className="text-sm text-muted">Nothing needs attention right now.</p>
        ) : (
          <ul className="max-w-xl space-y-2">
            {(dash?.attention ?? []).map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded border border-border px-4 py-3 text-sm transition-colors hover:bg-surface"
                >
                  <span className="flex-1">{item.label}</span>
                  <span className="tabular-nums text-muted">{item.count}</span>
                  <Icon name="chevron-right" className="h-4 w-4 opacity-50" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-medium">Recent transactions</h2>
        <DataTable
          columns={[
            { id: 'date', header: 'Date', cell: (row) => row.date },
            {
              id: 'label',
              header: 'Description',
              cell: (row) => (
                <Link href={row.href} className="underline-offset-2 hover:underline">
                  {row.label}
                </Link>
              ),
            },
            { id: 'source', header: 'Source', cell: (row) => row.sourceType },
            { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount) },
          ]}
          rows={dash?.recentTransactions ?? []}
          loading={isLoading}
          emptyTitle="No recent journals"
          emptyDescription="Posted journals will appear here."
        />
      </section>

      {percent < 100 || checklistOpen ? (
        <section className="max-w-xl">
          <button
            type="button"
            className="mb-3 flex w-full items-center justify-between gap-3 text-left"
            onClick={() => setChecklistOpen((open) => !open)}
          >
            <h2 className="text-sm font-medium">Getting started</h2>
            <span className="text-xs text-muted tabular-nums">{percent}%</span>
          </button>
          {checklistOpen ? (
            <>
              <div className="mb-4 h-2 overflow-hidden rounded bg-surface">
                <div className="h-full bg-foreground transition-[width] duration-300" style={{ width: `${percent}%` }} />
              </div>
              <ul className="space-y-2">
                {(checklist?.steps ?? []).map((step) => (
                  <li key={step.id}>
                    <Link
                      href={step.href}
                      className={cn(
                        'flex items-center gap-3 rounded border border-border px-4 py-3 text-sm transition-colors hover:bg-surface',
                        step.done && 'bg-surface/60',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border',
                          step.done ? 'bg-foreground text-background' : 'bg-background text-muted',
                        )}
                        aria-hidden
                      >
                        {step.done ? <Icon name="check" className="h-3.5 w-3.5" /> : null}
                      </span>
                      <span className={cn('flex-1', step.done && 'text-muted line-through')}>{step.label}</span>
                      <Icon name="chevron-right" className="h-4 w-4 opacity-50" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
