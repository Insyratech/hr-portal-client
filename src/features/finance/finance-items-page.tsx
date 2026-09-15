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
import { EditIconButton } from '@/components/ui/edit-icon-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { SELECT_CLASS, optionalFormString } from '@/features/finance/finance-constants';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateFinanceItemMutation,
  useGetFinanceAccountsQuery,
  useGetFinanceItemsQuery,
  useGetFinanceTaxGroupsQuery,
  useUpdateFinanceItemMutation,
} from '@/store/api/api';
import type { FinanceAccount, FinanceItem, FinanceTaxGroup } from '@/types/api';

function itemFieldsFromForm(form: FormData) {
  return {
    code: String(form.get('code') ?? '').trim(),
    name: String(form.get('name') ?? '').trim(),
    itemType: String(form.get('itemType') ?? 'goods') as 'goods' | 'service',
    hsnSac: optionalFormString(form.get('hsnSac')),
    unit: String(form.get('unit') ?? 'nos').trim() || 'nos',
    saleRate: Number(form.get('saleRate') ?? 0) || 0,
    purchaseRate: Number(form.get('purchaseRate') ?? 0) || 0,
    incomeAccountId: optionalFormString(form.get('incomeAccountId')),
    expenseAccountId: optionalFormString(form.get('expenseAccountId')),
    taxGroupId: optionalFormString(form.get('taxGroupId')),
    description: String(form.get('description') ?? '').trim(),
  };
}

function ItemFormFields({
  item,
  incomeAccounts,
  expenseAccounts,
  taxGroups,
}: {
  item?: FinanceItem;
  incomeAccounts: FinanceAccount[];
  expenseAccounts: FinanceAccount[];
  taxGroups: FinanceTaxGroup[];
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" defaultValue={item?.code} required />
        </div>
        <div>
          <Label htmlFor="itemType">Type</Label>
          <select id="itemType" name="itemType" className={SELECT_CLASS} defaultValue={item?.itemType ?? 'goods'}>
            <option value="goods">Goods</option>
            <option value="service">Service</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={item?.name} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="hsnSac">HSN / SAC</Label>
          <Input id="hsnSac" name="hsnSac" defaultValue={item?.hsnSac ?? ''} />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" name="unit" defaultValue={item?.unit ?? 'nos'} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="saleRate">Sale rate</Label>
          <Input id="saleRate" name="saleRate" type="number" min={0} step="0.01" defaultValue={item?.saleRate ?? 0} />
        </div>
        <div>
          <Label htmlFor="purchaseRate">Purchase rate</Label>
          <Input
            id="purchaseRate"
            name="purchaseRate"
            type="number"
            min={0}
            step="0.01"
            defaultValue={item?.purchaseRate ?? 0}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="incomeAccountId">Income account</Label>
        <select
          id="incomeAccountId"
          name="incomeAccountId"
          className={SELECT_CLASS}
          defaultValue={item?.incomeAccountId ?? ''}
        >
          <option value="">None</option>
          {incomeAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.code} — {account.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="expenseAccountId">Expense account</Label>
        <select
          id="expenseAccountId"
          name="expenseAccountId"
          className={SELECT_CLASS}
          defaultValue={item?.expenseAccountId ?? ''}
        >
          <option value="">None</option>
          {expenseAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.code} — {account.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="taxGroupId">Tax group</Label>
        <select id="taxGroupId" name="taxGroupId" className={SELECT_CLASS} defaultValue={item?.taxGroupId ?? ''}>
          <option value="">None</option>
          {taxGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" defaultValue={item?.description} />
      </div>
      {item ? (
        <div>
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" className={SELECT_CLASS} defaultValue={item.status}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      ) : null}
    </>
  );
}

export function FinanceItemsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_ITEMS_MANAGE);
  const canViewAccounts = permissions.includes(PERMISSIONS.FINANCE_COA_VIEW)
    || permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);

  const { data, isLoading, isError } = useGetFinanceItemsQuery(undefined, { skip: !canManage });
  const { data: taxGroupsData } = useGetFinanceTaxGroupsQuery(undefined, { skip: !canManage });
  const { data: accountsData } = useGetFinanceAccountsQuery(undefined, {
    skip: !canManage || !canViewAccounts,
  });
  const [createItem, { isLoading: creating }] = useCreateFinanceItemMutation();
  const [updateItem, { isLoading: updating }] = useUpdateFinanceItemMutation();
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceItem | null>(null);

  const accounts = accountsData?.data ?? [];
  const incomeAccounts = accounts.filter((account) => account.accountType === 'income' && account.isActive);
  const expenseAccounts = accounts.filter((account) => account.accountType === 'expense' && account.isActive);
  const taxGroups = taxGroupsData?.data ?? [];
  const taxGroupName = (id: string | null) => taxGroups.find((group) => group.id === id)?.name ?? '—';

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formEl = event.currentTarget;
    try {
      await createItem(itemFieldsFromForm(new FormData(formEl))).unwrap();
      formEl.reset();
      setCreateOpen(false);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create item.'));
    }
  }

  async function onSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await updateItem({
        id: editing.id,
        body: {
          ...itemFieldsFromForm(form),
          status: String(form.get('status') ?? 'active') as 'active' | 'inactive',
        },
      }).unwrap();
      setEditing(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update item.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Items" title="Items" />
        <p className="max-w-2xl text-sm text-muted">You need items manage permission to view the catalogue.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || updating} />
      <PageHeader
        kicker="Items"
        title="Items"
        actions={
          <Button
            type="button"
            onClick={() => {
              setError(null);
              setCreateOpen(true);
            }}
          >
            Add item
          </Button>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Goods and services with rates, accounts, and tax preference for later documents.
      </p>
      {error && !editing && !createOpen ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load items.</p> : null}
      <DataTable
        columns={[
          { id: 'code', header: 'Code', cell: (row) => row.code },
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'itemType', header: 'Type', cell: (row) => row.itemType },
          { id: 'saleRate', header: 'Sale rate', cell: (row) => row.saleRate },
          { id: 'tax', header: 'Tax group', cell: (row) => taxGroupName(row.taxGroupId) },
          { id: 'status', header: 'Status', cell: (row) => row.status },
          {
            id: 'edit',
            header: 'Edit',
            cell: (row) => <EditIconButton label={`Edit ${row.name}`} onClick={() => setEditing(row)} />,
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No items"
        emptyDescription="Add an item to complete Getting started."
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Add item</DialogTitle>
          <DialogDescription>Code and name are required. Link income or expense accounts when ready.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <ItemFormFields
              incomeAccounts={incomeAccounts}
              expenseAccounts={expenseAccounts}
              taxGroups={taxGroups}
            />
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creating}>
                {creating ? 'Saving…' : 'Add item'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Edit item</DialogTitle>
          <DialogDescription>Update rates, accounts, and tax preference.</DialogDescription>
          {editing ? (
            <form key={editing.id} onSubmit={onSaveEdit} className="mt-6 space-y-4">
              <ItemFormFields
                item={editing}
                incomeAccounts={incomeAccounts}
                expenseAccounts={expenseAccounts}
                taxGroups={taxGroups}
              />
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={updating}>
                  {updating ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
