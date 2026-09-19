'use client';

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
import { FinanceCustomerForm } from '@/features/finance/finance-customer-form';
import { useGetFinanceCustomersQuery } from '@/store/api/api';
import type { FinanceCustomer } from '@/types/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceCustomersPage() {
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.FINANCE_PARTIES_MANAGE),
  );
  const { data, isLoading, isError } = useGetFinanceCustomersQuery(undefined, { skip: !canManage });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceCustomer | null>(null);

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Sales" title="Customers" />
        <p className="max-w-2xl text-sm text-muted">You need parties manage permission to view customers.</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Sales"
        title="Customers"
        actions={
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setCreateOpen(true);
            }}
          >
            Add customer
          </Button>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Customer masters with structured billing and shipping addresses for quotes and invoices.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load customers.</p> : null}
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
            cell: (row) => (
              <EditIconButton
                label={`Edit ${row.displayName}`}
                onClick={() => {
                  setCreateOpen(false);
                  setEditing(row);
                }}
              />
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No customers"
        emptyDescription="Add a customer to complete Getting started."
      />

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogTitle>Add customer</DialogTitle>
          <DialogDescription>Step through identity, tax, addresses, and payment terms.</DialogDescription>
          <FinanceCustomerForm
            onCancel={() => setCreateOpen(false)}
            onSaved={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogTitle>Edit customer</DialogTitle>
          <DialogDescription>Update contact, tax, and address details. Change history is shown when editing.</DialogDescription>
          {editing ? (
            <FinanceCustomerForm
              key={editing.id}
              customer={editing}
              onCancel={() => setEditing(null)}
              onSaved={(saved) => setEditing(saved)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
