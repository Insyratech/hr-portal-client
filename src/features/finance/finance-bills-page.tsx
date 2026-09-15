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
  useCreateFinanceBillMutation,
  useGetFinanceBillsQuery,
  useGetFinancePurchaseOrdersQuery,
  useGetFinanceReceiptsQuery,
  usePostFinanceBillMutation,
} from '@/store/api/api';
import type { VendorBill } from '@/types/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceBillsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_INDENT_APPROVE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_PURCHASE_MANAGE);

  const { data, isLoading, isError } = useGetFinanceBillsQuery(undefined, { skip: !canView });
  const { data: posData } = useGetFinancePurchaseOrdersQuery(undefined, { skip: !canManage });
  const { data: receiptsData } = useGetFinanceReceiptsQuery(undefined, { skip: !canManage });
  const [createBill, { isLoading: creating }] = useCreateFinanceBillMutation();
  const [postBill, { isLoading: posting }] = usePostFinanceBillMutation();

  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<VendorBill | null>(null);
  const [purchaseOrderId, setPurchaseOrderId] = useState('');

  const billablePos = useMemo(
    () =>
      (posData?.data ?? []).filter((po) =>
        ['issued', 'partially_received', 'received', 'approved'].includes(po.status.toLowerCase()),
      ),
    [posData],
  );

  const matchingReceipts = useMemo(
    () => (receiptsData?.data ?? []).filter((receipt) => receipt.purchaseOrderId === purchaseOrderId),
    [receiptsData, purchaseOrderId],
  );

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await createBill({
        purchaseOrderId: String(form.get('purchaseOrderId') ?? ''),
        receiptId: String(form.get('receiptId') ?? '').trim() || null,
        billDate: String(form.get('billDate') ?? '').trim() || undefined,
        dueDate: String(form.get('dueDate') ?? '').trim() || null,
        vendorInvoiceNumber: String(form.get('vendorInvoiceNumber') ?? '').trim() || null,
        notes: String(form.get('notes') ?? '').trim() || undefined,
      }).unwrap();
      setCreateOpen(false);
      setPurchaseOrderId('');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create bill.'));
    }
  }

  async function onPost(id: string) {
    setError(null);
    try {
      const result = await postBill(id).unwrap();
      setDetail(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to post bill.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Purchases" title="Bills" />
        <p className="max-w-2xl text-sm text-muted">You need purchase view permission to open bills.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || posting} />
      <PageHeader
        kicker="Purchases"
        title="Bills"
        actions={
          canManage ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setPurchaseOrderId('');
                setCreateOpen(true);
              }}
            >
              Bill from PO
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Create vendor bills from purchase orders (optional receipt for 3-way match), then post to AP.
      </p>
      {error && !createOpen && !detail ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load bills.</p> : null}
      <DataTable
        columns={[
          { id: 'documentNumber', header: 'Number', cell: (row) => row.documentNumber },
          { id: 'vendor', header: 'Vendor', cell: (row) => row.vendorName || '—' },
          { id: 'date', header: 'Bill date', cell: (row) => row.billDate },
          { id: 'total', header: 'Total', cell: (row) => formatInr(row.grandTotal) },
          { id: 'due', header: 'Amount due', cell: (row) => formatInr(row.amountDue) },
          {
            id: 'match',
            header: 'Match',
            cell: (row) => (
              <StatusBadge status={procurementStatusTone(row.matchStatus)} label={row.matchStatus} />
            ),
          },
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
        emptyTitle="No bills"
        emptyDescription="Create a bill from a purchase order."
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogTitle>Create bill from PO</DialogTitle>
          <DialogDescription>Optionally link a receipt for three-way matching.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="purchaseOrderId">Purchase order</Label>
              <select
                id="purchaseOrderId"
                name="purchaseOrderId"
                className={SELECT_CLASS}
                value={purchaseOrderId}
                onChange={(event) => setPurchaseOrderId(event.target.value)}
                required
              >
                <option value="">Select PO</option>
                {billablePos.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.documentNumber} — {po.vendorName || 'Vendor'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="receiptId">Receipt (optional)</Label>
              <select id="receiptId" name="receiptId" className={SELECT_CLASS} defaultValue="">
                <option value="">None</option>
                {matchingReceipts.map((receipt) => (
                  <option key={receipt.id} value={receipt.id}>
                    {receipt.documentNumber} ({receipt.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="billDate">Bill date</Label>
                <Input id="billDate" name="billDate" type="date" />
              </div>
              <div>
                <Label htmlFor="dueDate">Due date</Label>
                <Input id="dueDate" name="dueDate" type="date" />
              </div>
            </div>
            <div>
              <Label htmlFor="vendorInvoiceNumber">Vendor invoice #</Label>
              <Input id="vendorInvoiceNumber" name="vendorInvoiceNumber" />
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
                Create bill
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle>{detail?.documentNumber ?? 'Bill'}</DialogTitle>
          <DialogDescription>Match status and line details for this vendor bill.</DialogDescription>
          {detail ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted">Vendor:</span> {detail.vendorName || '—'}
                </p>
                <p>
                  <StatusBadge status={procurementStatusTone(detail.status)} label={detail.status} />
                </p>
                <p>
                  <span className="text-muted">Match:</span>{' '}
                  <StatusBadge status={procurementStatusTone(detail.matchStatus)} label={detail.matchStatus} />
                </p>
                <p>
                  <span className="text-muted">Due:</span> {formatInr(detail.amountDue)}
                </p>
                {detail.matchNotes ? (
                  <p className="sm:col-span-2">
                    <span className="text-muted">Match notes:</span> {detail.matchNotes}
                  </p>
                ) : null}
              </div>
              <DataTable
                columns={[
                  { id: 'description', header: 'Description', cell: (row) => row.description },
                  { id: 'qty', header: 'Qty', cell: (row) => String(row.quantity) },
                  { id: 'rate', header: 'Rate', cell: (row) => formatInr(row.rate) },
                  { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount + row.taxAmount) },
                ]}
                rows={detail.lines}
                emptyTitle="No lines"
                emptyDescription="This bill has no lines."
              />
              {canManage && detail.status === 'draft' ? (
                <Button type="button" onClick={() => void onPost(detail.id)}>
                  Post bill
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
