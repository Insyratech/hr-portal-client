'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { SELECT_CLASS } from '@/features/finance/finance-constants';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateFinanceAccountMutation,
  useGetFinanceAccountsQuery,
  useUpdateFinanceAccountMutation,
} from '@/store/api/api';
import type { FinanceAccount } from '@/types/api';

export function FinanceAccountsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView = permissions.includes(PERMISSIONS.FINANCE_COA_VIEW)
    || permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);

  const { data, isLoading, isError } = useGetFinanceAccountsQuery(undefined, { skip: !canView });
  const [createAccount, { isLoading: creating }] = useCreateFinanceAccountMutation();
  const [updateAccount, { isLoading: updating }] = useUpdateFinanceAccountMutation();
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      await createAccount({
        code: String(form.get('code') ?? '').trim(),
        name: String(form.get('name') ?? '').trim(),
        accountType: String(form.get('accountType') ?? 'expense') as FinanceAccount['accountType'],
        sortOrder: Number(form.get('sortOrder') ?? 0) || 0,
      }).unwrap();
      formEl.reset();
      setCreateOpen(false);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create account.'));
    }
  }

  async function toggleActive(account: FinanceAccount) {
    if (!canManage || account.isSystem) return;
    setError(null);
    setTogglingId(account.id);
    try {
      await updateAccount({
        id: account.id,
        body: { isActive: !account.isActive },
      }).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update account.'));
    } finally {
      setTogglingId(null);
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Accountant" title="Accounts" />
        <p className="max-w-2xl text-sm text-muted">You need chart of accounts permission to view this list.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || updating} />
      <PageHeader
        kicker="Accountant"
        title="Chart of accounts"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setCreateOpen(true);
              }}
            >
              Add account
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        System accounts are seeded for Indian SME books. You can add non-system accounts and deactivate custom ones.
      </p>
      {!canManage ? (
        <p className="mb-6 text-sm text-muted">This list is read-only without COA manage permission.</p>
      ) : null}
      {error && !createOpen ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load accounts.</p> : null}
      <DataTable
        columns={[
          { id: 'code', header: 'Code', cell: (row) => row.code },
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'accountType', header: 'Type', cell: (row) => row.accountType },
          { id: 'system', header: 'System', cell: (row) => (row.isSystem ? 'Yes' : 'No') },
          { id: 'active', header: 'Active', cell: (row) => (row.isActive ? 'Yes' : 'No') },
          ...(canManage
            ? [
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: (row: FinanceAccount) =>
                    row.isSystem ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        loading={togglingId === row.id}
                        onClick={() => void toggleActive(row)}
                      >
                        {row.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    ),
                },
              ]
            : []),
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No accounts"
        emptyDescription="Apply the finance foundation migration to seed the chart of accounts."
      />

      <Dialog
        open={createOpen && canManage}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Add account</DialogTitle>
          <DialogDescription>Create a non-system account. Code must be unique.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" required />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="accountType">Type</Label>
              <select id="accountType" name="accountType" className={SELECT_CLASS} defaultValue="expense">
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
            </div>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creating}>
                {creating ? 'Saving…' : 'Add account'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
