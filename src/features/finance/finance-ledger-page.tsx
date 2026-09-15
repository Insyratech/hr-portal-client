'use client';

import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SELECT_CLASS } from '@/features/finance/finance-constants';
import { formatInr } from '@/features/finance/finance-procurement-utils';
import { useAppSelector } from '@/store/hooks';
import { useGetFinanceAccountsQuery, useGetFinanceLedgerQuery } from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceLedgerPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_COA_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);

  const [accountId, setAccountId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [applied, setApplied] = useState<{ accountId: string; fromDate?: string; toDate?: string } | null>(null);

  const { data: accountsData } = useGetFinanceAccountsQuery(undefined, { skip: !canView });
  const { data, isLoading, isError, isFetching } = useGetFinanceLedgerQuery(
    {
      accountId: applied?.accountId ?? '',
      fromDate: applied?.fromDate,
      toDate: applied?.toDate,
    },
    { skip: !canView || !applied?.accountId },
  );

  const accounts = useMemo(
    () => (accountsData?.data ?? []).filter((account) => account.isActive),
    [accountsData],
  );

  const ledger = data?.data;

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Accountant" title="General ledger" />
        <p className="max-w-2xl text-sm text-muted">You need accountant view permission to open the ledger.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="Accountant" title="General ledger" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Inquire on an account with opening balance, posted lines, and closing balance.
      </p>

      <form
        className="mb-6 grid max-w-3xl gap-4 sm:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!accountId) return;
          setApplied({
            accountId,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
          });
        }}
      >
        <div className="sm:col-span-2">
          <Label htmlFor="ledgerAccount">Account</Label>
          <select
            id="ledgerAccount"
            className={SELECT_CLASS}
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            required
          >
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.code} — {account.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="fromDate">From</Label>
          <Input id="fromDate" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="toDate">To</Label>
          <Input id="toDate" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </div>
        <div className="sm:col-span-4">
          <Button type="submit" disabled={!accountId || isFetching}>
            {isFetching ? 'Loading…' : 'Show ledger'}
          </Button>
        </div>
      </form>

      {isError ? <p className="mb-4 text-sm">Unable to load ledger.</p> : null}

      {ledger ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span>
              {ledger.accountCode} — {ledger.accountName} ({ledger.accountType})
            </span>
            <span className="text-muted">Opening: {formatInr(ledger.openingBalance)}</span>
            <span className="text-muted">Closing: {formatInr(ledger.closingBalance)}</span>
          </div>
          <DataTable
            columns={[
              { id: 'date', header: 'Date', cell: (row) => row.entryDate },
              { id: 'number', header: 'Journal', cell: (row) => row.entryNumber },
              { id: 'memo', header: 'Memo', cell: (row) => row.memo || row.description || '—' },
              { id: 'source', header: 'Source', cell: (row) => row.sourceType },
              { id: 'debit', header: 'Debit', cell: (row) => (row.debit ? formatInr(row.debit) : '—') },
              { id: 'credit', header: 'Credit', cell: (row) => (row.credit ? formatInr(row.credit) : '—') },
              { id: 'balance', header: 'Balance', cell: (row) => formatInr(row.runningBalance) },
            ]}
            rows={ledger.lines.map((line, index) => ({
              ...line,
              id: `${line.journalId}-${index}`,
            }))}
            loading={isLoading}
            emptyTitle="No movements"
            emptyDescription="No posted journal lines in this range."
          />
        </div>
      ) : null}
    </>
  );
}
