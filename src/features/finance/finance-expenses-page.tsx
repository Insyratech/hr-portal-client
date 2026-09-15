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
  isCashAccount,
  procurementStatusTone,
} from '@/features/finance/finance-procurement-utils';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useCreateFinanceExpenseMutation,
  useGetFinanceAccountsQuery,
  useGetFinanceExpenseCategoriesQuery,
  useGetFinanceExpensesQuery,
  useGetFinanceVendorsQuery,
  usePostFinanceExpenseMutation,
} from '@/store/api/api';
import type { DirectExpense } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

type PaidThrough = DirectExpense['paidThrough'];

export function FinanceExpensesPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_EXPENSE_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_EXPENSE_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_EXPENSE_MANAGE);
  const canViewAccounts =
    permissions.includes(PERMISSIONS.FINANCE_COA_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);

  const { data, isLoading, isError } = useGetFinanceExpensesQuery(undefined, { skip: !canView });
  const { data: categoriesData } = useGetFinanceExpenseCategoriesQuery(undefined, { skip: !canManage });
  const { data: vendorsData } = useGetFinanceVendorsQuery(undefined, { skip: !canManage });
  const { data: accountsData } = useGetFinanceAccountsQuery(undefined, {
    skip: !canManage || !canViewAccounts,
  });
  const [createExpense, { isLoading: creating }] = useCreateFinanceExpenseMutation();
  const [postExpense, { isLoading: posting }] = usePostFinanceExpenseMutation();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<DirectExpense | null>(null);
  const [paidThrough, setPaidThrough] = useState<PaidThrough>('bank');

  const payAccounts = useMemo(() => {
    const accounts = (accountsData?.data ?? []).filter((account) => account.isActive);
    if (paidThrough === 'cash') return accounts.filter(isCashAccount);
    if (paidThrough === 'bank') return accounts.filter(isBankAccount);
    return [];
  }, [accountsData, paidThrough]);

  const categories = useMemo(
    () => (categoriesData?.data ?? []).filter((category) => category.isActive),
    [categoriesData],
  );

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const needsAccount = paidThrough === 'cash' || paidThrough === 'bank';
    const bankAccountId = String(form.get('bankAccountId') ?? '').trim() || null;
    if (needsAccount && !bankAccountId) {
      setError('Select a cash or bank account for this payment method.');
      return;
    }
    try {
      await createExpense({
        expenseDate: String(form.get('expenseDate') ?? '').trim() || undefined,
        categoryId: String(form.get('categoryId') ?? '').trim() || null,
        vendorId: String(form.get('vendorId') ?? '').trim() || null,
        description: String(form.get('description') ?? '').trim(),
        amount: Number(form.get('amount')),
        taxPercent: Number(form.get('taxPercent') ?? 0),
        paidThrough,
        bankAccountId: needsAccount ? bankAccountId : null,
        vendorInvoiceNumber: String(form.get('vendorInvoiceNumber') ?? '').trim() || undefined,
        receiptUrl: String(form.get('receiptUrl') ?? '').trim() || undefined,
        notes: String(form.get('notes') ?? '').trim() || undefined,
      }).unwrap();
      setCreateOpen(false);
      setPaidThrough('bank');
      event.currentTarget.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create expense.'));
    }
  }

  async function onPost(id: string) {
    setError(null);
    try {
      const result = await postExpense(id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to post expense.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Expenses" title="Expenses" />
        <p className="max-w-2xl text-sm text-muted">You need expense view permission to open direct expenses.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || posting} />
      <PageHeader
        kicker="Expenses"
        title="Expenses"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setPaidThrough('bank');
                setCreateOpen(true);
              }}
            >
              New expense
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Record day-to-day spend, optionally link a vendor, and post when ready.
      </p>
      {error && !createOpen && !detail ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load expenses.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'date', header: 'Date', cell: (row) => row.expenseDate },
          { id: 'category', header: 'Category', cell: (row) => row.categoryName || '—' },
          { id: 'vendor', header: 'Vendor', cell: (row) => row.vendorName || '—' },
          { id: 'description', header: 'Description', cell: (row) => row.description },
          { id: 'total', header: 'Total', cell: (row) => formatInr(row.grandTotal) },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={procurementStatusTone(row.status)} label={row.status} />,
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDetail(row)}>
                  Open
                </Button>
                {canManage && row.status === 'draft' ? (
                  <Button type="button" size="sm" onClick={() => void onPost(row.id)}>
                    Post
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No expenses"
        emptyDescription="Create a direct expense to record spend."
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>New direct expense</DialogTitle>
          <DialogDescription>Capture amount, tax, and how it was paid.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="expenseDate">Expense date</Label>
                <Input id="expenseDate" name="expenseDate" type="date" />
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
                <Label htmlFor="vendorId">Vendor (optional)</Label>
                <select id="vendorId" name="vendorId" className={SELECT_CLASS} defaultValue="">
                  <option value="">None</option>
                  {(vendorsData?.data ?? []).map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="paidThrough">Paid through</Label>
                <select
                  id="paidThrough"
                  className={SELECT_CLASS}
                  value={paidThrough}
                  onChange={(event) => setPaidThrough(event.target.value as PaidThrough)}
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="accounts_payable">Accounts payable</option>
                </select>
              </div>
              {paidThrough === 'cash' || paidThrough === 'bank' ? (
                <div className="sm:col-span-2">
                  <Label htmlFor="bankAccountId">{paidThrough === 'cash' ? 'Cash account' : 'Bank account'}</Label>
                  <select id="bankAccountId" name="bankAccountId" className={SELECT_CLASS} required>
                    <option value="">Select account</option>
                    {payAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} — {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" name="amount" type="number" min={0} step="any" required />
              </div>
              <div>
                <Label htmlFor="taxPercent">Tax %</Label>
                <Input id="taxPercent" name="taxPercent" type="number" min={0} step="any" defaultValue={0} />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="vendorInvoiceNumber">Vendor invoice #</Label>
                <Input id="vendorInvoiceNumber" name="vendorInvoiceNumber" />
              </div>
              <div>
                <Label htmlFor="receiptUrl">Receipt URL</Label>
                <Input id="receiptUrl" name="receiptUrl" type="url" placeholder="https://" />
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
            setError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>{detail?.documentNumber ?? 'Expense'}</DialogTitle>
          <DialogDescription>Review expense details and post when ready.</DialogDescription>
          {detail ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted">Status:</span>{' '}
                  <StatusBadge status={procurementStatusTone(detail.status)} label={detail.status} />
                </p>
                <p>
                  <span className="text-muted">Date:</span> {detail.expenseDate}
                </p>
                <p>
                  <span className="text-muted">Category:</span> {detail.categoryName || '—'}
                </p>
                <p>
                  <span className="text-muted">Vendor:</span> {detail.vendorName || '—'}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted">Description:</span> {detail.description}
                </p>
                <p>
                  <span className="text-muted">Amount:</span> {formatInr(detail.amount)}
                </p>
                <p>
                  <span className="text-muted">Tax:</span> {formatInr(detail.taxAmount)} ({detail.taxPercent}%)
                </p>
                <p>
                  <span className="text-muted">Total:</span> {formatInr(detail.grandTotal)}
                </p>
                <p>
                  <span className="text-muted">Paid through:</span> {detail.paidThrough.replace('_', ' ')}
                </p>
                {detail.receiptUrl ? (
                  <p className="sm:col-span-2">
                    <span className="text-muted">Receipt:</span>{' '}
                    <a href={detail.receiptUrl} target="_blank" rel="noreferrer" className="underline">
                      Open receipt
                    </a>
                  </p>
                ) : null}
                {detail.notes ? (
                  <p className="sm:col-span-2">
                    <span className="text-muted">Notes:</span> {detail.notes}
                  </p>
                ) : null}
              </div>
              {canManage && detail.status === 'draft' ? (
                <Button type="button" onClick={() => void onPost(detail.id)}>
                  Post expense
                </Button>
              ) : null}
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
