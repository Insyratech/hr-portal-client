'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
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
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { SELECT_CLASS } from '@/features/inventory/inventory-constants';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useDeleteInventoryAuthorizationMutation,
  useGetInventoryAuthorizationsQuery,
  useGetInventoryEmployeeOptionsQuery,
  useUpsertInventoryAuthorizationMutation,
} from '@/store/api/api';
import type { InventoryAuthorization } from '@/types/api';

function rightsLabel(row: InventoryAuthorization): string {
  const parts: string[] = [];
  if (row.canUsage) parts.push('Usage');
  if (row.canReceipt) parts.push('Receipt');
  if (row.canPrep) parts.push('Prep');
  return parts.join(' · ') || '—';
}

export function InventoryAuthorizationsPage() {
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage = permissions.includes(PERMISSIONS.INVENTORY_AUTHORIZATIONS_MANAGE);
  const { data, isLoading, isError } = useGetInventoryAuthorizationsQuery(undefined, {
    skip: !canManage,
  });
  const { data: employeesData } = useGetInventoryEmployeeOptionsQuery(undefined, { skip: !canManage });
  const [upsert, { isLoading: saving }] = useUpsertInventoryAuthorizationMutation();
  const [remove, { isLoading: removing }] = useDeleteInventoryAuthorizationMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryAuthorization | null>(null);

  const grantedIds = useMemo(
    () => new Set((data?.data ?? []).map((row) => row.employeeId)),
    [data?.data],
  );
  const availableEmployees = useMemo(
    () => (employeesData?.data ?? []).filter((employee) => !grantedIds.has(employee.id) || editing?.employeeId === employee.id),
    [employeesData?.data, grantedIds, editing?.employeeId],
  );

  async function onSave(event: FormEvent<HTMLFormElement>, employeeIdFixed?: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const employeeId = employeeIdFixed ?? String(form.get('employeeId') ?? '');
    const canUsage = form.get('canUsage') === 'on';
    const canReceipt = form.get('canReceipt') === 'on';
    const canPrep = form.get('canPrep') === 'on';
    if (!canUsage && !canReceipt && !canPrep) {
      toast.error('Grant at least one of usage, receipt, or prep.');
      return;
    }
    try {
      await upsert({
        employeeId,
        canUsage,
        canReceipt,
        canPrep,
        notes: String(form.get('notes') ?? '').trim(),
      }).unwrap();
      setCreateOpen(false);
      setEditing(null);
      toast.success('Authorization saved.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to save authorization.'));
    }
  }

  async function onDelete(id: string) {
    try {
      await remove(id).unwrap();
      toast.success('Authorization removed.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to remove authorization.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Authorizations" />
        <p className="text-sm text-muted">You need authorizations manage permission.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={saving || removing} />
      <PageHeader
        kicker="Inventory"
        title="Authorizations"
        actions={
          <Button
            type="button"
            onClick={() => {
              setCreateOpen(true);
            }}
          >
            Grant access
          </Button>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Choose who may log usage via QR, enter receipts, or run reagent prep. Grant 2–3 people for a
        typical lab start.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load authorizations.</p> : null}

      <DataTable
        columns={[
          {
            id: 'employee',
            header: 'Employee',
            cell: (row) => (
              <span>
                {row.employeeName}{' '}
                <span className="text-muted">({row.employeeCode})</span>
              </span>
            ),
          },
          { id: 'rights', header: 'Rights', cell: (row) => rightsLabel(row) },
          { id: 'notes', header: 'Notes', cell: (row) => row.notes || '—' },
          {
            id: 'actions',
            header: '',
            cell: (row) => (
              <div className="flex items-center gap-2">
                <EditIconButton
                  label={`Edit ${row.employeeName}`}
                  onClick={() => {
                                        setEditing(row);
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => onDelete(row.id)}>
                  Remove
                </Button>
              </div>
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No authorizations yet"
        emptyDescription="Grant usage and receipt to a few lab members to start."
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogTitle>Grant access</DialogTitle>
          <DialogDescription>Pick an active employee and the rights they need.</DialogDescription>
          <form className="mt-4 space-y-4" onSubmit={(event) => onSave(event)}>
            <div>
              <Label htmlFor="employeeId">Employee</Label>
              <select id="employeeId" name="employeeId" className={SELECT_CLASS} required defaultValue="">
                <option value="" disabled>
                  Select employee
                </option>
                {availableEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} ({employee.employeeCode})
                  </option>
                ))}
              </select>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Rights</legend>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="canUsage" defaultChecked />
                Usage (QR issue / aliquot)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="canReceipt" />
                Receipt / stock entry
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="canPrep" />
                Reagent prep
              </label>
            </fieldset>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogTitle>Edit access</DialogTitle>
          <DialogDescription>
            {editing?.employeeName} ({editing?.employeeCode})
          </DialogDescription>
          {editing ? (
            <form className="mt-4 space-y-4" onSubmit={(event) => onSave(event, editing.employeeId)}>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Rights</legend>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="canUsage" defaultChecked={editing.canUsage} />
                  Usage (QR issue / aliquot)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="canReceipt" defaultChecked={editing.canReceipt} />
                  Receipt / stock entry
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="canPrep" defaultChecked={editing.canPrep} />
                  Reagent prep
                </label>
              </fieldset>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Input id="edit-notes" name="notes" defaultValue={editing.notes} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
