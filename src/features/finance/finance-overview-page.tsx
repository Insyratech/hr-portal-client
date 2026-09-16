'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { defaultMonthRange } from '@/features/finance/finance-gst-utils';
import { formatInr } from '@/features/finance/finance-procurement-utils';
import { useAppSelector } from '@/store/hooks';
import { useGetFinanceDashboardQuery, useGetFinanceSetupQuery } from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';
import { cn } from '@/lib/utils';

function StatBlock({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary: string;
  secondary?: string;
}) {
  return (
    <div className="min-w-0">
      <Meta>{label}</Meta>
      <p className="mt-1 text-xl font-medium tabular-nums tracking-tight">{primary}</p>
      {secondary ? <p className="mt-0.5 text-xs text-muted">{secondary}</p> : null}
    </div>
  );
}

export function FinanceOverviewPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canViewReports =
    permissions.includes(PERMISSIONS.FINANCE_REPORTS_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_MANAGE);

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

      <div className="mb-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        <StatBlock
          label="Receivables"
          primary={dash ? formatInr(dash.receivables.total) : isLoading ? '—' : formatInr(0)}
          secondary={
            dash
              ? `Current ${formatInr(dash.receivables.current)} · Overdue ${formatInr(dash.receivables.overdue)}`
              : undefined
          }
        />
        <StatBlock
          label="Payables"
          primary={dash ? formatInr(dash.payables.total) : isLoading ? '—' : formatInr(0)}
          secondary={
            dash
              ? `Current ${formatInr(dash.payables.current)} · Overdue ${formatInr(dash.payables.overdue)}`
              : undefined
          }
        />
        <StatBlock
          label="Cash flow"
          primary={dash ? formatInr(dash.cashFlow.net) : isLoading ? '—' : formatInr(0)}
          secondary={
            dash
              ? `In ${formatInr(dash.cashFlow.inflow)} · Out ${formatInr(dash.cashFlow.outflow)}`
              : undefined
          }
        />
        <StatBlock
          label="Income vs expense"
          primary={dash ? formatInr(dash.incomeVsExpense.net) : isLoading ? '—' : formatInr(0)}
          secondary={
            dash
              ? `Income ${formatInr(dash.incomeVsExpense.income)} · Expense ${formatInr(dash.incomeVsExpense.expense)}`
              : undefined
          }
        />
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
