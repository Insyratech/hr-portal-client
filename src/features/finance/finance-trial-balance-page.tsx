'use client';

import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatInr } from '@/features/finance/finance-procurement-utils';
import { useAppSelector } from '@/store/hooks';
import { useGetFinanceTrialBalanceQuery } from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceTrialBalancePage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_COA_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);

  const [asOfDate, setAsOfDate] = useState('');
  const [appliedDate, setAppliedDate] = useState<string | null>(null);

  const { data, isLoading, isError, isFetching } = useGetFinanceTrialBalanceQuery(
    { asOfDate: appliedDate ?? '' },
    { skip: !canView || !appliedDate },
  );

  const trial = data?.data;

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Accountant" title="Trial balance" />
        <p className="max-w-2xl text-sm text-muted">You need accountant view permission to open trial balance.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="Accountant" title="Trial balance" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Debit and credit totals by account as of a date. Books should remain balanced after posting.
      </p>

      <form
        className="mb-6 flex max-w-md flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!asOfDate) return;
          setAppliedDate(asOfDate);
        }}
      >
        <div className="min-w-[12rem] flex-1">
          <Label htmlFor="asOfDate">As of date</Label>
          <Input
            id="asOfDate"
            type="date"
            value={asOfDate}
            onChange={(event) => setAsOfDate(event.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={!asOfDate || isFetching}>
          {isFetching ? 'Loading…' : 'Run'}
        </Button>
      </form>

      {isError ? <p className="mb-4 text-sm">Unable to load trial balance.</p> : null}

      {trial ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span>As of {trial.asOfDate}</span>
            <StatusBadge
              status={trial.isBalanced ? 'approved' : 'rejected'}
              label={trial.isBalanced ? 'Balanced' : 'Out of balance'}
            />
            <span className="text-muted">Total debit {formatInr(trial.totalDebit)}</span>
            <span className="text-muted">Total credit {formatInr(trial.totalCredit)}</span>
          </div>
          <DataTable
            columns={[
              { id: 'code', header: 'Code', cell: (row) => row.accountCode },
              { id: 'name', header: 'Account', cell: (row) => row.accountName },
              { id: 'type', header: 'Type', cell: (row) => row.accountType },
              { id: 'debit', header: 'Debit', cell: (row) => (row.debit ? formatInr(row.debit) : '—') },
              { id: 'credit', header: 'Credit', cell: (row) => (row.credit ? formatInr(row.credit) : '—') },
            ]}
            rows={trial.rows.map((row) => ({ ...row, id: row.accountId }))}
            loading={isLoading}
            emptyTitle="No balances"
            emptyDescription="No account balances as of this date."
          />
        </div>
      ) : null}
    </>
  );
}
