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
  useCreateFinancePaymentMutation,
  useGetFinanceAccountsQuery,
  useGetFinanceBillsQuery,
  useGetFinancePaymentsQuery,
  useGetFinanceVendorsQuery,
  usePostFinancePaymentMutation,
} from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

type AllocationDraft = {
  billId: string;
  billNumber: string;
  amountDue: number;
  amount: string;
};

export function FinancePaymentsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_INDENT_APPROVE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE);
  const canViewAccounts =
    permissions.includes(PERMISSIONS.FINANCE_COA_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);

  const { data, isLoading, isError } = useGetFinancePaymentsQuery(undefined, { skip: !canView });
  const { data: vendorsData } = useGetFinanceVendorsQuery(undefined, { skip: !canManage });
  const { data: billsData } = useGetFinanceBillsQuery(undefined, { skip: !canManage });
  const { data: accountsData } = useGetFinanceAccountsQuery(undefined, {
    skip: !canManage || !canViewAccounts,
  });
  const [createPayment, { isLoading: creating }] = useCreateFinancePaymentMutation();
  const [postPayment, { isLoading: posting }] = usePostFinancePaymentMutation();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [vendorId, setVendorId] = useState('');
  const [allocations, setAllocations] = useState<AllocationDraft[]>([]);

  const bankAccounts = useMemo(
    () => (accountsData?.data ?? []).filter((account) => account.isActive && isBankAccount(account)),
    [accountsData],
  );

  const openBills = useMemo(
    () =>
      (billsData?.data ?? []).filter(
        (bill) =>
          bill.vendorId === vendorId &&
          bill.status.toLowerCase() === 'posted' &&
          bill.amountDue > 0,
      ),
    [billsData, vendorId],
  );

  function onVendorChange(id: string) {
    setVendorId(id);
    const bills = (billsData?.data ?? []).filter(
      (bill) => bill.vendorId === id && bill.status.toLowerCase() === 'posted' && bill.amountDue > 0,
    );
    setAllocations(
      bills.map((bill) => ({
        billId: bill.id,
        billNumber: bill.documentNumber,
        amountDue: bill.amountDue,
        amount: String(bill.amountDue),
      })),
    );
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const prepared = allocations
      .map((row) => ({ billId: row.billId, amount: Number(row.amount) }))
      .filter((row) => row.amount > 0);
    if (!prepared.length) {
      setError('Allocate payment amount to at least one bill.');
      return;
    }
    const amount = prepared.reduce((sum, row) => sum + row.amount, 0);
    try {
      await createPayment({
        vendorId,
        paymentDate: String(form.get('paymentDate') ?? '').trim() || undefined,
        amount,
        bankAccountId: String(form.get('bankAccountId') ?? '').trim() || null,
        method: String(form.get('method') ?? '').trim() || undefined,
        reference: String(form.get('reference') ?? '').trim() || undefined,
        notes: String(form.get('notes') ?? '').trim() || undefined,
        allocations: prepared,
      }).unwrap();
      setCreateOpen(false);
      setVendorId('');
      setAllocations([]);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create payment.'));
    }
  }

  async function onPost(id: string) {
    setError(null);
    try {
      await postPayment(id).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to post payment.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Purchases" title="Payments" />
        <p className="max-w-2xl text-sm text-muted">You need purchase view permission to open payments.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || posting} />
      <PageHeader
        kicker="Purchases"
        title="Payments"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setVendorId('');
                setAllocations([]);
                setCreateOpen(true);
              }}
            >
              New payment
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Record vendor payments with bill allocations and post them against a bank account.
      </p>
      {error && !createOpen ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load payments.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'vendor', header: 'Vendor', cell: (row) => row.vendorName || '—' },
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
        emptyTitle="No payments"
        emptyDescription="Create a payment and allocate it to posted bills."
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>New vendor payment</DialogTitle>
          <DialogDescription>Allocate the payment across one or more open bills.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="vendorId">Vendor</Label>
              <select
                id="vendorId"
                className={SELECT_CLASS}
                value={vendorId}
                onChange={(event) => onVendorChange(event.target.value)}
                required
              >
                <option value="">Select vendor</option>
                {(vendorsData?.data ?? []).map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.displayName}
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
              <Label>Bill allocations</Label>
              {!vendorId ? (
                <p className="text-sm text-muted">Select a vendor to load open bills.</p>
              ) : !openBills.length ? (
                <p className="text-sm text-muted">No posted bills with amount due for this vendor.</p>
              ) : (
                allocations.map((row, index) => (
                  <div key={row.billId} className="grid gap-2 rounded border border-border p-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <p className="text-sm">{row.billNumber}</p>
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
              <Button type="submit" loading={creating} disabled={!vendorId}>
                Create payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
