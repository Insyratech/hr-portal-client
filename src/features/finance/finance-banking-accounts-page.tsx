'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
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
import {
  useCreateFinanceBankAccountMutation,
  useGetFinanceAccountsQuery,
  useGetFinanceBankAccountsQuery,
  useUpdateFinanceBankAccountMutation,
} from '@/store/api/api';
import type { BankAccount } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceBankingAccountsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_BANKING_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_BANKING_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_BANKING_MANAGE);
  const canViewAccounts =
    permissions.includes(PERMISSIONS.FINANCE_COA_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);

  const { data, isLoading, isError } = useGetFinanceBankAccountsQuery(undefined, { skip: !canView });
  const { data: accountsData } = useGetFinanceAccountsQuery(undefined, {
    skip: !canManage || !canViewAccounts,
  });
  const [createAccount, { isLoading: creating }] = useCreateFinanceBankAccountMutation();
  const [updateAccount, { isLoading: updating }] = useUpdateFinanceBankAccountMutation();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<BankAccount | null>(null);

  const assetAccounts = useMemo(
    () =>
      (accountsData?.data ?? []).filter(
        (account) => account.isActive && account.accountType === 'asset',
      ),
    [accountsData],
  );

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await createAccount({
        glAccountId: String(form.get('glAccountId') ?? '').trim(),
        displayName: String(form.get('displayName') ?? '').trim(),
        accountKind: String(form.get('accountKind') ?? 'bank') as 'bank' | 'cash',
        bankName: String(form.get('bankName') ?? '').trim() || undefined,
        accountNumberMasked: String(form.get('accountNumberMasked') ?? '').trim() || undefined,
        notes: String(form.get('notes') ?? '').trim() || undefined,
      }).unwrap();
      setCreateOpen(false);
      event.currentTarget.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create bank account.'));
    }
  }

  async function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edit) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await updateAccount({
        id: edit.id,
        body: {
          displayName: String(form.get('displayName') ?? '').trim(),
          accountKind: String(form.get('accountKind') ?? 'bank') as 'bank' | 'cash',
          bankName: String(form.get('bankName') ?? '').trim(),
          accountNumberMasked: String(form.get('accountNumberMasked') ?? '').trim(),
          notes: String(form.get('notes') ?? '').trim(),
          isActive: form.get('isActive') === 'true',
        },
      }).unwrap();
      setEdit(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update bank account.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Banking" title="Accounts" />
        <p className="max-w-2xl text-sm text-muted">You need banking view permission to open bank accounts.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || updating} />
      <PageHeader
        kicker="Banking"
        title="Accounts"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setCreateOpen(true);
              }}
            >
              New account
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Link cash and bank accounts to chart-of-accounts assets for imports and reconciliation.
      </p>
      {error && !createOpen && !edit ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load bank accounts.</p> : null}
      <DataTable
        columns={[
          { id: 'name', header: 'Name', cell: (row) => row.displayName },
          { id: 'kind', header: 'Kind', cell: (row) => row.accountKind },
          {
            id: 'gl',
            header: 'GL account',
            cell: (row) =>
              row.glAccountCode ? `${row.glAccountCode} — ${row.glAccountName ?? ''}` : '—',
          },
          { id: 'bank', header: 'Bank', cell: (row) => row.bankName || '—' },
          { id: 'masked', header: 'Account #', cell: (row) => row.accountNumberMasked || '—' },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => (
              <StatusBadge
                status={row.isActive ? 'approved' : 'rejected'}
                label={row.isActive ? 'active' : 'inactive'}
              />
            ),
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (row) =>
              canManage ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    setEdit(row);
                  }}
                >
                  Edit
                </Button>
              ) : (
                '—'
              ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No bank accounts"
        emptyDescription="Create a bank or cash account linked to a GL asset."
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogTitle>New bank account</DialogTitle>
          <DialogDescription>Select a COA asset and give it a display name.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="glAccountId">GL asset account</Label>
              <select id="glAccountId" name="glAccountId" className={SELECT_CLASS} required>
                <option value="">Select account</option>
                {assetAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} — {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" name="displayName" required />
            </div>
            <div>
              <Label htmlFor="accountKind">Kind</Label>
              <select id="accountKind" name="accountKind" className={SELECT_CLASS} defaultValue="bank">
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bankName">Bank name</Label>
                <Input id="bankName" name="bankName" />
              </div>
              <div>
                <Label htmlFor="accountNumberMasked">Account # (masked)</Label>
                <Input id="accountNumberMasked" name="accountNumberMasked" placeholder="****1234" />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creating}>
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(edit)}
        onOpenChange={(open) => {
          if (!open) {
            setEdit(null);
            setError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogTitle>Edit bank account</DialogTitle>
          <DialogDescription>Update display details for this cash or bank account.</DialogDescription>
          {edit ? (
            <form onSubmit={onEdit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="editDisplayName">Display name</Label>
                <Input
                  id="editDisplayName"
                  name="displayName"
                  defaultValue={edit.displayName}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editAccountKind">Kind</Label>
                <select
                  id="editAccountKind"
                  name="accountKind"
                  className={SELECT_CLASS}
                  defaultValue={edit.accountKind}
                >
                  <option value="bank">Bank</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="editBankName">Bank name</Label>
                  <Input id="editBankName" name="bankName" defaultValue={edit.bankName} />
                </div>
                <div>
                  <Label htmlFor="editMasked">Account # (masked)</Label>
                  <Input
                    id="editMasked"
                    name="accountNumberMasked"
                    defaultValue={edit.accountNumberMasked}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editNotes">Notes</Label>
                <Input id="editNotes" name="notes" defaultValue={edit.notes} />
              </div>
              <div>
                <Label htmlFor="editIsActive">Status</Label>
                <select
                  id="editIsActive"
                  name="isActive"
                  className={SELECT_CLASS}
                  defaultValue={edit.isActive ? 'true' : 'false'}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEdit(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={updating}>
                  Save
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
