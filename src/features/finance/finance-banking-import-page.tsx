'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { SELECT_CLASS } from '@/features/finance/finance-constants';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useGetFinanceBankAccountsQuery,
  useImportFinanceBankStatementMutation,
} from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceBankingImportPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_BANKING_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_BANKING_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_BANKING_MANAGE);

  const { data: bankAccountsData } = useGetFinanceBankAccountsQuery(undefined, { skip: !canView });
  const [importStatement, { isLoading: importing }] = useImportFinanceBankStatementMutation();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [csvText, setCsvText] = useState('');
  const [filename, setFilename] = useState('statement.csv');

  const bankAccounts = useMemo(
    () => (bankAccountsData?.data ?? []).filter((account) => account.isActive),
    [bankAccountsData],
  );

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setCsvText(await file.text());
  }

  async function onImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const form = new FormData(event.currentTarget);
    const bankAccountId = String(form.get('bankAccountId') ?? '').trim();
    if (!csvText.trim()) {
      setError('Paste CSV text or upload a statement file.');
      return;
    }
    try {
      const result = await importStatement({
        bankAccountId,
        filename: filename || undefined,
        csvText,
      }).unwrap();
      setSuccess(
        `Imported ${result.data.createdCount} transaction${result.data.createdCount === 1 ? '' : 's'} from ${result.data.batch.filename}.`,
      );
      setCsvText('');
      event.currentTarget.reset();
      setFilename('statement.csv');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to import statement.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Banking" title="Import" />
        <p className="max-w-2xl text-sm text-muted">You need banking view permission to open imports.</p>
      </>
    );
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Banking" title="Import" />
        <p className="max-w-2xl text-sm text-muted">
          You need banking manage permission to import bank statements.
        </p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={importing} />
      <PageHeader kicker="Banking" title="Import" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Import a CSV bank statement. Expected columns:{' '}
        <code className="text-xs">date,description,reference,debit,credit</code>
      </p>

      <form onSubmit={onImport} className="max-w-2xl space-y-4">
        <div>
          <Label htmlFor="bankAccountId">Bank account</Label>
          <select id="bankAccountId" name="bankAccountId" className={SELECT_CLASS} required>
            <option value="">Select account</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.displayName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="csvFile">Upload CSV file</Label>
          <Input id="csvFile" type="file" accept=".csv,text/csv,text/plain" onChange={onFileChange} />
        </div>
        <div>
          <Label htmlFor="csvText">Or paste CSV</Label>
          <textarea
            id="csvText"
            className="min-h-48 w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm"
            value={csvText}
            onChange={(event) => setCsvText(event.target.value)}
            placeholder={'date,description,reference,debit,credit\n2026-01-15,Vendor payment,INV-1,1500,\n'}
          />
        </div>
        {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
        {success ? <StatusMessage tone="success">{success}</StatusMessage> : null}
        <Button type="submit" loading={importing}>
          Import statement
        </Button>
      </form>
    </>
  );
}
