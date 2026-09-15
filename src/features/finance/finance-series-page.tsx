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
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import { useGetFinanceNumberSeriesQuery, useUpdateFinanceNumberSeriesMutation } from '@/store/api/api';
import type { FinanceNumberSeries } from '@/types/api';

export function FinanceSeriesPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView = permissions.includes(PERMISSIONS.FINANCE_SERIES_MANAGE)
    || permissions.includes(PERMISSIONS.FINANCE_ORG_MANAGE);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_SERIES_MANAGE);

  const { data, isLoading, isError } = useGetFinanceNumberSeriesQuery(undefined, { skip: !canView });
  const [updateSeries, { isLoading: updating }] = useUpdateFinanceNumberSeriesMutation();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FinanceNumberSeries | null>(null);

  async function onSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !canManage) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await updateSeries({
        id: editing.id,
        body: {
          prefix: String(form.get('prefix') ?? '').trim(),
          nextNumber: Number(form.get('nextNumber') ?? 1),
          padLength: Number(form.get('padLength') ?? 4),
        },
      }).unwrap();
      setEditing(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update number series.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Accountant" title="Number series" />
        <p className="max-w-2xl text-sm text-muted">You need series permission to view document numbering.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={updating} />
      <PageHeader kicker="Accountant" title="Number series" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Prefixes and next numbers for invoices, bills, and other documents once those modules ship.
      </p>
      {!canManage ? (
        <p className="mb-6 text-sm text-muted">This list is read-only without series manage permission.</p>
      ) : null}
      {error && !editing ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load number series.</p> : null}
      <DataTable
        columns={[
          { id: 'documentType', header: 'Document', cell: (row) => row.documentType },
          { id: 'prefix', header: 'Prefix', cell: (row) => row.prefix },
          { id: 'nextNumber', header: 'Next number', cell: (row) => row.nextNumber },
          { id: 'padLength', header: 'Pad', cell: (row) => row.padLength },
          { id: 'fy', header: 'Fiscal year', cell: (row) => row.fiscalYearLabel },
          ...(canManage
            ? [
                {
                  id: 'edit',
                  header: 'Edit',
                  cell: (row: FinanceNumberSeries) => (
                    <EditIconButton label={`Edit ${row.documentType}`} onClick={() => setEditing(row)} />
                  ),
                },
              ]
            : []),
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No number series"
        emptyDescription="Apply the finance foundation migration to seed document series."
      />

      <Dialog
        open={Boolean(editing) && canManage}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Edit number series</DialogTitle>
          <DialogDescription>
            {editing ? `Update numbering for ${editing.documentType}.` : 'Update numbering.'}
          </DialogDescription>
          {editing ? (
            <form key={editing.id} onSubmit={onSaveEdit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="prefix">Prefix</Label>
                <Input id="prefix" name="prefix" defaultValue={editing.prefix} required />
              </div>
              <div>
                <Label htmlFor="nextNumber">Next number</Label>
                <Input
                  id="nextNumber"
                  name="nextNumber"
                  type="number"
                  min={1}
                  defaultValue={editing.nextNumber}
                  required
                />
              </div>
              <div>
                <Label htmlFor="padLength">Pad length</Label>
                <Input
                  id="padLength"
                  name="padLength"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={editing.padLength}
                  required
                />
              </div>
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
