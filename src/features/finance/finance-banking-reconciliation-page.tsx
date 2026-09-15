'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { SELECT_CLASS } from '@/features/finance/finance-constants';
import { formatInr, procurementStatusTone } from '@/features/finance/finance-procurement-utils';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useGetFinanceBankAccountsQuery,
  useGetFinanceBankReconciliationReportQuery,
  useGetFinanceBankReconciliationsQuery,
  useSaveFinanceBankReconciliationMutation,
} from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceBankingReconciliationPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_BANKING_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_BANKING_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_BANKING_MANAGE);

  const [bankAccountId, setBankAccountId] = useState('');
  const [asOfDate, setAsOfDate] = useState('');
  const [statementEndingBalance, setStatementEndingBalance] = useState('');
  const [reportParams, setReportParams] = useState<{
    bankAccountId: string;
    asOfDate: string;
    statementEndingBalance: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: bankAccountsData } = useGetFinanceBankAccountsQuery(undefined, { skip: !canView });
  const { data: historyData, isLoading: historyLoading } = useGetFinanceBankReconciliationsQuery(
    undefined,
    { skip: !canView },
  );
  const {
    data: reportData,
    isFetching: reportLoading,
    isError: reportError,
  } = useGetFinanceBankReconciliationReportQuery(reportParams!, {
    skip: !canView || !reportParams,
  });
  const [saveReconciliation, { isLoading: saving }] = useSaveFinanceBankReconciliationMutation();

  const bankAccounts = useMemo(
    () => (bankAccountsData?.data ?? []).filter((account) => account.isActive),
    [bankAccountsData],
  );

  const report = reportData?.data;

  function onLoadReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const balance = Number(statementEndingBalance);
    if (!bankAccountId || !asOfDate || Number.isNaN(balance)) {
      setError('Select a bank account, as-of date, and statement ending balance.');
      return;
    }
    setReportParams({ bankAccountId, asOfDate, statementEndingBalance: balance });
  }

  async function onSave(complete: boolean) {
    if (!reportParams) return;
    setError(null);
    setSuccess(null);
    try {
      const result = await saveReconciliation({
        bankAccountId: reportParams.bankAccountId,
        statementDate: reportParams.asOfDate,
        statementEndingBalance: reportParams.statementEndingBalance,
        complete,
      }).unwrap();
      setSuccess(
        complete
          ? `Reconciliation completed (${result.data.status}).`
          : `Reconciliation saved as ${result.data.status}.`,
      );
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to save reconciliation.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Banking" title="Reconciliation" />
        <p className="max-w-2xl text-sm text-muted">
          You need banking view permission to open reconciliation.
        </p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={saving || reportLoading} />
      <PageHeader kicker="Banking" title="Reconciliation" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Compare book balance to the statement ending balance and save or complete a reconciliation.
      </p>

      <form onSubmit={onLoadReport} className="mb-8 max-w-2xl space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <Label htmlFor="bankAccountId">Bank account</Label>
            <select
              id="bankAccountId"
              className={SELECT_CLASS}
              value={bankAccountId}
              onChange={(event) => setBankAccountId(event.target.value)}
              required
            >
              <option value="">Select account</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.displayName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="asOfDate">As of date</Label>
            <Input
              id="asOfDate"
              type="date"
              value={asOfDate}
              onChange={(event) => setAsOfDate(event.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="statementEndingBalance">Statement ending balance</Label>
            <Input
              id="statementEndingBalance"
              type="number"
              step="any"
              value={statementEndingBalance}
              onChange={(event) => setStatementEndingBalance(event.target.value)}
              required
            />
          </div>
        </div>
        <Button type="submit">Show report</Button>
      </form>

      {error ? (
        <div className="mb-4 max-w-2xl">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 max-w-2xl">
          <StatusMessage tone="success">{success}</StatusMessage>
        </div>
      ) : null}
      {reportError ? <p className="mb-4 text-sm">Unable to load reconciliation report.</p> : null}

      {report ? (
        <div className="mb-10 space-y-6">
          <div className="grid max-w-3xl gap-3 rounded border border-border p-4 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted">Account:</span> {report.bankAccountName}
            </p>
            <p>
              <span className="text-muted">As of:</span> {report.asOfDate}
            </p>
            <p>
              <span className="text-muted">Statement balance:</span>{' '}
              {formatInr(report.statementEndingBalance)}
            </p>
            <p>
              <span className="text-muted">Book balance:</span> {formatInr(report.bookEndingBalance)}
            </p>
            <p>
              <span className="text-muted">Difference:</span> {formatInr(report.difference)}
            </p>
            <p>
              <span className="text-muted">Matched / unmatched:</span> {report.matchedCount} /{' '}
              {report.unmatchedCount}
            </p>
            <p>
              <span className="text-muted">Categorized / excluded:</span> {report.categorizedCount} /{' '}
              {report.excludedCount}
            </p>
            <p>
              <span className="text-muted">Unmatched amount:</span> {formatInr(report.unmatchedAmount)}
            </p>
          </div>

          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void onSave(false)}>
                Save draft
              </Button>
              <Button type="button" onClick={() => void onSave(true)}>
                Save / Complete
              </Button>
            </div>
          ) : null}

          <div>
            <h2 className="mb-3 text-sm font-medium">Unmatched transactions</h2>
            <DataTable
              columns={[
                { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
                { id: 'date', header: 'Date', cell: (row) => row.transactionDate },
                { id: 'description', header: 'Description', cell: (row) => row.description || '—' },
                { id: 'type', header: 'Type', cell: (row) => row.transactionType },
                { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount) },
                {
                  id: 'status',
                  header: 'Status',
                  cell: (row) => (
                    <StatusBadge status={procurementStatusTone(row.status)} label={row.status} />
                  ),
                },
              ]}
              rows={report.unmatchedTransactions}
              loading={false}
              emptyTitle="No unmatched transactions"
              emptyDescription="All transactions are matched, categorized, or excluded."
            />
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 text-sm font-medium">Saved reconciliations</h2>
        <DataTable
          columns={[
            { id: 'account', header: 'Account', cell: (row) => row.bankAccountName || '—' },
            { id: 'date', header: 'Statement date', cell: (row) => row.statementDate },
            {
              id: 'statement',
              header: 'Statement bal.',
              cell: (row) => formatInr(row.statementEndingBalance),
            },
            { id: 'book', header: 'Book bal.', cell: (row) => formatInr(row.bookEndingBalance) },
            { id: 'diff', header: 'Difference', cell: (row) => formatInr(row.difference) },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => (
                <StatusBadge
                  status={row.status === 'completed' ? 'approved' : 'pending'}
                  label={row.status}
                />
              ),
            },
          ]}
          rows={historyData?.data ?? []}
          loading={historyLoading}
          emptyTitle="No reconciliations"
          emptyDescription="Save a reconciliation report to keep history."
        />
      </div>
    </>
  );
}
