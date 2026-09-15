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
import {
  INDIAN_STATES,
  SELECT_CLASS,
  optionalFormString,
  stateFromCode,
} from '@/features/finance/finance-constants';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateFinanceVendorMutation,
  useGetFinanceVendorsQuery,
  useUpdateFinanceVendorMutation,
} from '@/store/api/api';
import type { FinanceVendor } from '@/types/api';

function partyFieldsFromForm(form: FormData) {
  const { stateCode, stateName } = stateFromCode(String(form.get('stateCode') ?? ''));
  return {
    displayName: String(form.get('displayName') ?? '').trim(),
    companyName: String(form.get('companyName') ?? '').trim(),
    email: optionalFormString(form.get('email')),
    phone: optionalFormString(form.get('phone')),
    gstin: optionalFormString(form.get('gstin')),
    pan: optionalFormString(form.get('pan')),
    stateCode,
    stateName,
    billingAddress: String(form.get('billingAddress') ?? '').trim(),
    paymentTermsDays: Number(form.get('paymentTermsDays') ?? 0) || 0,
    notes: String(form.get('notes') ?? '').trim(),
  };
}

function VendorFormFields({ vendor }: { vendor?: FinanceVendor }) {
  return (
    <>
      <div>
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" defaultValue={vendor?.displayName} required />
      </div>
      <div>
        <Label htmlFor="companyName">Company name</Label>
        <Input id="companyName" name="companyName" defaultValue={vendor?.companyName} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={vendor?.email ?? ''} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={vendor?.phone ?? ''} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="gstin">GSTIN</Label>
          <Input id="gstin" name="gstin" defaultValue={vendor?.gstin ?? ''} />
        </div>
        <div>
          <Label htmlFor="pan">PAN</Label>
          <Input id="pan" name="pan" defaultValue={vendor?.pan ?? ''} />
        </div>
      </div>
      <div>
        <Label htmlFor="stateCode">State</Label>
        <select id="stateCode" name="stateCode" className={SELECT_CLASS} defaultValue={vendor?.stateCode ?? ''}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="billingAddress">Billing address</Label>
        <Input id="billingAddress" name="billingAddress" defaultValue={vendor?.billingAddress} />
      </div>
      <div>
        <Label htmlFor="paymentTermsDays">Payment terms (days)</Label>
        <Input
          id="paymentTermsDays"
          name="paymentTermsDays"
          type="number"
          min={0}
          defaultValue={vendor?.paymentTermsDays ?? 0}
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" defaultValue={vendor?.notes} />
      </div>
      {vendor ? (
        <div>
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" className={SELECT_CLASS} defaultValue={vendor.status}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      ) : null}
    </>
  );
}

export function FinanceVendorsPage() {
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.FINANCE_PARTIES_MANAGE),
  );
  const { data, isLoading, isError } = useGetFinanceVendorsQuery(undefined, { skip: !canManage });
  const [createVendor, { isLoading: creating }] = useCreateFinanceVendorMutation();
  const [updateVendor, { isLoading: updating }] = useUpdateFinanceVendorMutation();
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceVendor | null>(null);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formEl = event.currentTarget;
    try {
      await createVendor(partyFieldsFromForm(new FormData(formEl))).unwrap();
      formEl.reset();
      setCreateOpen(false);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create vendor.'));
    }
  }

  async function onSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await updateVendor({
        id: editing.id,
        body: {
          ...partyFieldsFromForm(form),
          status: String(form.get('status') ?? 'active') as 'active' | 'inactive',
        },
      }).unwrap();
      setEditing(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update vendor.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Purchases" title="Vendors" />
        <p className="max-w-2xl text-sm text-muted">You need parties manage permission to view vendors.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || updating} />
      <PageHeader
        kicker="Purchases"
        title="Vendors"
        actions={
          <Button
            type="button"
            onClick={() => {
              setError(null);
              setCreateOpen(true);
            }}
          >
            Add vendor
          </Button>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Vendor masters for purchase orders, bills, and payments in later phases.
      </p>
      {error && !editing && !createOpen ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load vendors.</p> : null}
      <DataTable
        columns={[
          { id: 'displayName', header: 'Name', cell: (row) => row.displayName },
          { id: 'companyName', header: 'Company', cell: (row) => row.companyName || '—' },
          { id: 'gstin', header: 'GSTIN', cell: (row) => row.gstin || '—' },
          { id: 'state', header: 'State', cell: (row) => row.stateName || row.stateCode || '—' },
          { id: 'status', header: 'Status', cell: (row) => row.status },
          {
            id: 'edit',
            header: 'Edit',
            cell: (row) => <EditIconButton label={`Edit ${row.displayName}`} onClick={() => setEditing(row)} />,
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No vendors"
        emptyDescription="Add a vendor to complete Getting started."
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Add vendor</DialogTitle>
          <DialogDescription>Display name is required. GSTIN and state help with tax later.</DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
            <VendorFormFields />
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={creating}>
                {creating ? 'Saving…' : 'Add vendor'}
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
          <DialogTitle>Edit vendor</DialogTitle>
          <DialogDescription>Update contact and tax details.</DialogDescription>
          {editing ? (
            <form key={editing.id} onSubmit={onSaveEdit} className="mt-6 space-y-4">
              <VendorFormFields vendor={editing} />
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
