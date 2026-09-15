'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Icon } from '@/components/ui/icon';
import { useGetFinanceSetupQuery } from '@/store/api/api';
import { cn } from '@/lib/utils';

export function FinanceOverviewPage() {
  const { data, isLoading, isError } = useGetFinanceSetupQuery();
  const checklist = data?.data;
  const percent = checklist?.percentComplete ?? 0;

  return (
    <>
      <PageHeader kicker="Finance" title="Getting started" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Complete organisation profile and masters before invoices, bills, and payments go live. Sales, Purchases,
        Expenses, Banking (accounts, transactions, import, reconciliation), and Accountant (journals, ledger, trial
        balance, opening balances, period lock) are in the sidebar.
      </p>

      {isError ? <p className="mb-4 text-sm">Unable to load setup checklist.</p> : null}

      <div className="mb-8 max-w-xl rounded border border-border bg-background p-5 shadow-card">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <Meta>Setup progress</Meta>
          <span className="text-sm font-medium tabular-nums">{isLoading ? '—' : `${percent}%`}</span>
        </div>
        <div className="h-2 overflow-hidden rounded bg-surface">
          <div
            className="h-full bg-foreground transition-[width] duration-300"
            style={{ width: `${isLoading ? 0 : percent}%` }}
          />
        </div>
      </div>

      <ul className="max-w-xl space-y-2">
        {(checklist?.steps ?? (isLoading ? [] : [])).map((step) => (
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
        {isLoading ? (
          <li className="rounded border border-border px-4 py-8 text-center text-sm text-muted">Loading checklist…</li>
        ) : null}
        {!isLoading && !isError && (checklist?.steps.length ?? 0) === 0 ? (
          <li className="rounded border border-border px-4 py-8 text-center text-sm text-muted">
            No setup steps available.
          </li>
        ) : null}
      </ul>
    </>
  );
}
