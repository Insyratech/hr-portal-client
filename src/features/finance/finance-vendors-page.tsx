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
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { FinanceVendorRegistrationForm } from '@/features/finance/finance-vendor-registration-form';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import { useGetFinanceVendorsQuery } from '@/store/api/api';
import type { FinanceVendor } from '@/types/api';

export function FinanceVendorsPage() {
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.FINANCE_PARTIES_MANAGE),
  );
  const { data, isLoading, isError } = useGetFinanceVendorsQuery(undefined, { skip: !canManage });
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceVendor | null>(null);

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
      <DelayedLoadingOverlay active={isLoading && !data} />
      <PageHeader
        kicker="Purchases"
        title="Vendors"
        actions={
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setCreateOpen(true);
            }}
          >
            Register vendor
          </Button>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Full vendor registration for purchase orders, bills, and payments. Download a printable PDF after
        saving.
      </p>
      {isError ? (
        <div className="mb-4">
          <StatusMessage tone="danger">Unable to load vendors.</StatusMessage>
        </div>
      ) : null}
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
        emptyTitle="No vendors"
        emptyDescription="Register a vendor using the digital registration form."
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogTitle>Vendor registration</DialogTitle>
          <DialogDescription>
            Complete each stage, then save and download a printable PDF.
          </DialogDescription>
          <FinanceVendorRegistrationForm
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogTitle>Edit vendor registration</DialogTitle>
          <DialogDescription>Update registration details stage by stage, then save.</DialogDescription>
          {editing ? (
            <FinanceVendorRegistrationForm
              key={editing.id}
              vendorId={editing.id}
              onCancel={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
