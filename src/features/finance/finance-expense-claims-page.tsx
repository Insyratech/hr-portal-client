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
import { formatInr, procurementStatusTone } from '@/features/finance/finance-procurement-utils';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useCancelFinanceExpenseClaimMutation,
  useCreateFinanceExpenseClaimMutation,
  useDecideFinanceExpenseClaimMutation,
  useGetFinanceExpenseCategoriesQuery,
  useGetFinanceExpenseClaimsQuery,
  useSubmitFinanceExpenseClaimMutation,
} from '@/store/api/api';
import type { ExpenseClaim } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

type Props = {
  mode?: 'finance' | 'employee';
};

export function FinanceExpenseClaimsPage({ mode = 'finance' }: Props) {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canApply = permissions.includes(PERMISSIONS.FINANCE_EXPENSE_CLAIM_APPLY);
  const canApprove = permissions.includes(PERMISSIONS.FINANCE_EXPENSE_CLAIM_APPROVE);
  const canManageExpense = permissions.includes(PERMISSIONS.FINANCE_EXPENSE_MANAGE);
  const canSubmitOrCancel = canApply || canManageExpense;
  const canView =
    canApply ||
    canApprove ||
    permissions.includes(PERMISSIONS.FINANCE_EXPENSE_VIEW) ||
    canManageExpense;

  const { data, isLoading, isError } = useGetFinanceExpenseClaimsQuery(undefined, { skip: !canView });
  const { data: categoriesData } = useGetFinanceExpenseCategoriesQuery(undefined, { skip: !canApply });
  const [createClaim, { isLoading: creating }] = useCreateFinanceExpenseClaimMutation();
  const [submitClaim, { isLoading: submitting }] = useSubmitFinanceExpenseClaimMutation();
  const [decideClaim, { isLoading: deciding }] = useDecideFinanceExpenseClaimMutation();
  const [cancelClaim, { isLoading: cancelling }] = useCancelFinanceExpenseClaimMutation();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<ExpenseClaim | null>(null);
  const [decideComment, setDecideComment] = useState('');

  const rows = useMemo(() => data?.data ?? [], [data]);
  const categories = useMemo(
    () => (categoriesData?.data ?? []).filter((category) => category.isActive),
    [categoriesData],
  );

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await createClaim({
        categoryId: String(form.get('categoryId') ?? '').trim() || null,
        claimDate: String(form.get('claimDate') ?? '').trim() || undefined,
        description: String(form.get('description') ?? '').trim(),
        amount: Number(form.get('amount')),
        taxPercent: Number(form.get('taxPercent') ?? 0),
        vendorName: String(form.get('vendorName') ?? '').trim() || undefined,
        billNumber: String(form.get('billNumber') ?? '').trim() || undefined,
        receiptUrl: String(form.get('receiptUrl') ?? '').trim() || undefined,
        notes: String(form.get('notes') ?? '').trim() || undefined,
      }).unwrap();
      setCreateOpen(false);
      event.currentTarget.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create expense claim.'));
    }
  }

  async function onSubmit(id: string) {
    setError(null);
    try {
      const result = await submitClaim(id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to submit expense claim.'));
    }
  }

  async function onCancel(id: string) {
    setError(null);
    try {
      const result = await cancelClaim(id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to cancel expense claim.'));
    }
  }

  async function onDecide(decision: 'approve' | 'reject') {
    if (!detail) return;
    setError(null);
    try {
      const result = await decideClaim({
        id: detail.id,
        body: { decision, comment: decideComment.trim() || undefined },
      }).unwrap();
      setDetail(result.data);
      setDecideComment('');
    } catch (cause) {
      setError(apiErrorMessage(cause, `Unable to ${decision} expense claim.`));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker={mode === 'employee' ? 'Requests' : 'Expenses'} title="Expense claims" />
        <p className="max-w-2xl text-sm text-muted">You need expense claim permission to view claims.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || submitting || deciding || cancelling} />
      <PageHeader
        kicker={mode === 'employee' ? 'Requests' : 'Expenses'}
        title={mode === 'employee' ? 'My expense claims' : 'Expense claims'}
        actions={
          canApply ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setCreateOpen(true);
              }}
            >
              New claim
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        {mode === 'employee'
          ? 'Raise an expense claim, submit it for review, and track reimbursement status.'
          : 'Employee expense claims — submit drafts and approve or reject submitted claims.'}
      </p>
      {error && !createOpen && !detail ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load expense claims.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'employee', header: 'Employee', cell: (row) => row.employeeName || '—' },
          { id: 'date', header: 'Date', cell: (row) => row.claimDate },
          { id: 'description', header: 'Description', cell: (row) => row.description },
          { id: 'total', header: 'Total', cell: (row) => formatInr(row.grandTotal) },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => (
              <StatusBadge status={procurementStatusTone(row.status)} label={row.status} />
            ),
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDetail(row)}>
                  Open
                </Button>
                {canSubmitOrCancel && row.status === 'draft' ? (
                  <Button type="button" size="sm" onClick={() => void onSubmit(row.id)}>
                    Submit
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
        rows={rows}
        loading={isLoading}
        emptyTitle="No expense claims"
        emptyDescription="Create a claim to request reimbursement."
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>New expense claim</DialogTitle>
          <DialogDescription>Describe the expense and attach a receipt link if you have one.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="claimDate">Claim date</Label>
                <Input id="claimDate" name="claimDate" type="date" />
              </div>
              <div>
                <Label htmlFor="categoryId">Category</Label>
                <select id="categoryId" name="categoryId" className={SELECT_CLASS} defaultValue="">
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" name="amount" type="number" min={0} step="any" required />
              </div>
              <div>
                <Label htmlFor="taxPercent">Tax %</Label>
                <Input id="taxPercent" name="taxPercent" type="number" min={0} step="any" defaultValue={0} />
              </div>
              <div>
                <Label htmlFor="vendorName">Vendor name</Label>
                <Input id="vendorName" name="vendorName" />
              </div>
              <div>
                <Label htmlFor="billNumber">Bill number</Label>
                <Input id="billNumber" name="billNumber" />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" required />
            </div>
            <div>
              <Label htmlFor="receiptUrl">Receipt URL</Label>
              <Input id="receiptUrl" name="receiptUrl" type="url" placeholder="https://" />
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
                Create draft
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) {
            setDetail(null);
            setDecideComment('');
            setError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>{detail?.documentNumber ?? 'Expense claim'}</DialogTitle>
          <DialogDescription>Review claim details and take action.</DialogDescription>
          {detail ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted">Status:</span>{' '}
                  <StatusBadge status={procurementStatusTone(detail.status)} label={detail.status} />
                </p>
                <p>
                  <span className="text-muted">Employee:</span> {detail.employeeName || '—'}
                </p>
                <p>
                  <span className="text-muted">Date:</span> {detail.claimDate}
                </p>
                <p>
                  <span className="text-muted">Category:</span> {detail.categoryName || '—'}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted">Description:</span> {detail.description}
                </p>
                <p>
                  <span className="text-muted">Total:</span> {formatInr(detail.grandTotal)}
                </p>
                <p>
                  <span className="text-muted">Amount due:</span> {formatInr(detail.amountDue)}
                </p>
                {detail.vendorName ? (
                  <p>
                    <span className="text-muted">Vendor:</span> {detail.vendorName}
                  </p>
                ) : null}
                {detail.billNumber ? (
                  <p>
                    <span className="text-muted">Bill #:</span> {detail.billNumber}
                  </p>
                ) : null}
                {detail.receiptUrl ? (
                  <p className="sm:col-span-2">
                    <span className="text-muted">Receipt:</span>{' '}
                    <a href={detail.receiptUrl} target="_blank" rel="noreferrer" className="underline">
                      Open receipt
                    </a>
                  </p>
                ) : null}
                {detail.reviewerComment ? (
                  <p className="sm:col-span-2">
                    <span className="text-muted">Reviewer comment:</span> {detail.reviewerComment}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {canSubmitOrCancel && detail.status === 'draft' ? (
                  <Button type="button" onClick={() => void onSubmit(detail.id)}>
                    Submit for approval
                  </Button>
                ) : null}
                {canSubmitOrCancel && (detail.status === 'draft' || detail.status === 'submitted') ? (
                  <Button type="button" variant="outline" onClick={() => void onCancel(detail.id)}>
                    Cancel claim
                  </Button>
                ) : null}
              </div>
              {canApprove && detail.status === 'submitted' ? (
                <div className="space-y-3 rounded border border-border p-3">
                  <div>
                    <Label htmlFor="decideComment">Comment</Label>
                    <Input
                      id="decideComment"
                      value={decideComment}
                      onChange={(event) => setDecideComment(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={() => void onDecide('approve')}>
                      Approve
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void onDecide('reject')}>
                      Reject
                    </Button>
                  </div>
                </div>
              ) : null}
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MyExpenseClaimsPage() {
  return <FinanceExpenseClaimsPage mode="employee" />;
}
