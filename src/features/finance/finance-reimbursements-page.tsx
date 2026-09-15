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
import {
  formatInr,
  isBankAccount,
  procurementStatusTone,
} from '@/features/finance/finance-procurement-utils';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useCreateFinanceExpenseReimbursementMutation,
  useGetFinanceAccountsQuery,
  useGetFinanceExpenseClaimsQuery,
  useGetFinanceExpenseReimbursementsQuery,
  usePostFinanceExpenseReimbursementMutation,
} from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

type AllocationDraft = {
  claimId: string;
  claimNumber: string;
  amountDue: number;
  amount: string;
};

export function FinanceReimbursementsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_EXPENSE_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_EXPENSE_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_EXPENSE_MANAGE);
  const canViewAccounts =
    permissions.includes(PERMISSIONS.FINANCE_COA_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);
  const canViewClaims =
    canView ||
    permissions.includes(PERMISSIONS.FINANCE_EXPENSE_CLAIM_APPLY) ||
    permissions.includes(PERMISSIONS.FINANCE_EXPENSE_CLAIM_APPROVE);

  const { data, isLoading, isError } = useGetFinanceExpenseReimbursementsQuery(undefined, {
    skip: !canView,
  });
  const { data: claimsData } = useGetFinanceExpenseClaimsQuery(undefined, {
    skip: !canManage || !canViewClaims,
  });
  const { data: accountsData } = useGetFinanceAccountsQuery(undefined, {
    skip: !canManage || !canViewAccounts,
  });
  const [createReimbursement, { isLoading: creating }] = useCreateFinanceExpenseReimbursementMutation();
  const [postReimbursement, { isLoading: posting }] = usePostFinanceExpenseReimbursementMutation();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [allocations, setAllocations] = useState<AllocationDraft[]>([]);

  const bankAccounts = useMemo(
    () => (accountsData?.data ?? []).filter((account) => account.isActive && isBankAccount(account)),
    [accountsData],
  );

  const reimbursableClaims = useMemo(
    () =>
      (claimsData?.data ?? []).filter(
        (claim) => claim.status === 'approved' && claim.amountDue > 0,
      ),
    [claimsData],
  );

  const employeeOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const claim of reimbursableClaims) {
      if (!map.has(claim.employeeId)) {
        map.set(claim.employeeId, claim.employeeName || claim.employeeId);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [reimbursableClaims]);

  const openClaims = useMemo(
    () => reimbursableClaims.filter((claim) => claim.employeeId === employeeId),
    [reimbursableClaims, employeeId],
  );

  function onEmployeeChange(id: string) {
    setEmployeeId(id);
    const claims = reimbursableClaims.filter((claim) => claim.employeeId === id);
    setAllocations(
      claims.map((claim) => ({
        claimId: claim.id,
        claimNumber: claim.documentNumber,
        amountDue: claim.amountDue,
        amount: String(claim.amountDue),
      })),
    );
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const prepared = allocations
      .map((row) => ({ claimId: row.claimId, amount: Number(row.amount) }))
      .filter((row) => row.amount > 0);
    if (!prepared.length) {
      setError('Allocate reimbursement amount to at least one approved claim.');
      return;
    }
    const amount = prepared.reduce((sum, row) => sum + row.amount, 0);
    try {
      await createReimbursement({
        employeeId,
        paymentDate: String(form.get('paymentDate') ?? '').trim() || undefined,
        amount,
        bankAccountId: String(form.get('bankAccountId') ?? '').trim(),
        method: String(form.get('method') ?? '').trim() || undefined,
        reference: String(form.get('reference') ?? '').trim() || undefined,
        notes: String(form.get('notes') ?? '').trim() || undefined,
        allocations: prepared,
      }).unwrap();
      setCreateOpen(false);
      setEmployeeId('');
      setAllocations([]);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create reimbursement.'));
    }
  }

  async function onPost(id: string) {
    setError(null);
    try {
      await postReimbursement(id).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to post reimbursement.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Expenses" title="Reimbursements" />
        <p className="max-w-2xl text-sm text-muted">You need expense view permission to open reimbursements.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || posting} />
      <PageHeader
        kicker="Expenses"
        title="Reimbursements"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setEmployeeId('');
                setAllocations([]);
                setCreateOpen(true);
              }}
            >
              New reimbursement
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Pay approved expense claims and post reimbursements against a bank account.
      </p>
      {error && !createOpen ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load reimbursements.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'employee', header: 'Employee', cell: (row) => row.employeeName || '—' },
          { id: 'date', header: 'Date', cell: (row) => row.paymentDate },
          { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount) },
          { id: 'method', header: 'Method', cell: (row) => row.method || '—' },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={procurementStatusTone(row.status)} label={row.status} />,
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (row) =>
              canManage && row.status === 'draft' ? (
                <Button type="button" size="sm" onClick={() => void onPost(row.id)}>
                  Post
                </Button>
              ) : (
                '—'
              ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No reimbursements"
        emptyDescription="Create a reimbursement and allocate it to approved claims."
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>New reimbursement</DialogTitle>
          <DialogDescription>Allocate payment across one or more approved claims for an employee.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="employeeId">Employee</Label>
              <select
                id="employeeId"
                className={SELECT_CLASS}
                value={employeeId}
                onChange={(event) => onEmployeeChange(event.target.value)}
                required
              >
                <option value="">Select employee</option>
                {employeeOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="paymentDate">Payment date</Label>
                <Input id="paymentDate" name="paymentDate" type="date" />
              </div>
              <div>
                <Label htmlFor="bankAccountId">Bank account</Label>
                <select id="bankAccountId" name="bankAccountId" className={SELECT_CLASS} required>
                  <option value="">Select account</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} — {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="method">Method</Label>
                <Input id="method" name="method" defaultValue="bank_transfer" />
              </div>
              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" name="reference" />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <div className="space-y-3">
              <Label>Claim allocations</Label>
              {!employeeId ? (
                <p className="text-sm text-muted">Select an employee to load approved claims.</p>
              ) : !openClaims.length ? (
                <p className="text-sm text-muted">No approved claims with amount due for this employee.</p>
              ) : (
                allocations.map((row, index) => (
                  <div key={row.claimId} className="grid gap-2 rounded border border-border p-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <p className="text-sm">{row.claimNumber}</p>
                      <p className="text-xs text-muted">Due {formatInr(row.amountDue)}</p>
                    </div>
                    <div>
                      <Label>Allocate</Label>
                      <Input
                        type="number"
                        min={0}
                        max={row.amountDue}
                        step="any"
                        value={row.amount}
                        onChange={(event) =>
                          setAllocations((prev) =>
                            prev.map((item, i) =>
                              i === index ? { ...item, amount: event.target.value } : item,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creating} disabled={!employeeId}>
                Create reimbursement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
