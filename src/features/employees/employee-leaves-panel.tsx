'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Meta } from '@/components/layout/meta';
import { EmptyState } from '@/components/dashboard/empty-state';
import { DataTable } from '@/components/dashboard/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditIconButton } from '@/components/ui/edit-icon-button';
import { IconButton } from '@/components/ui/icon-button';
import { latestPolicyRules } from '@/features/leave/leave-rule-form';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useCreateLeaveAllocationMutation,
  useDeleteLeaveAllocationMutation,
  useGetLeaveAllocationsQuery,
  useGetLeaveApplicationsQuery,
  useGetLeavePoliciesQuery,
  useGetLeaveTypesQuery,
  useSetLeaveAllocationMutation,
} from '@/store/api/api';
import type { LeaveAllocation } from '@/types/api';

export function EmployeeLeavesPanel({
  employeeId,
  canManage,
  forStaffManager = false,
}: {
  employeeId: string;
  canManage: boolean;
  /** When true, copy explains allocating leave for another manager (not self-serve). */
  forStaffManager?: boolean;
}) {
  const toast = useToast();
  const { data: allocationsData, isFetching } = useGetLeaveAllocationsQuery({ employeeId });
  const { data: typesData } = useGetLeaveTypesQuery();
  const { data: policiesData } = useGetLeavePoliciesQuery();
  const { data: applicationsData } = useGetLeaveApplicationsQuery();
  const [createAllocation, { isLoading: creating }] = useCreateLeaveAllocationMutation();
  const [setAllocation, { isLoading: updating }] = useSetLeaveAllocationMutation();
  const [deleteAllocation, { isLoading: removing }] = useDeleteLeaveAllocationMutation();
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [allocated, setAllocated] = useState('');
  const [editing, setEditing] = useState<LeaveAllocation | null>(null);

  const period = String(new Date().getUTCFullYear());
  const allocations = allocationsData?.data ?? [];
  const policies = policiesData?.data ?? [];
  const availableTypes = (typesData?.data ?? []).filter((item) => item.active);
  const applications = (applicationsData?.data ?? []).filter((item) => item.employeeId === employeeId);
  const assignedKeys = new Set(allocations.map((item) => `${item.leaveTypeId}:${item.period}`));
  const addableTypes = availableTypes.filter((item) => !assignedKeys.has(`${item.id}:${period}`));
  const selectedType = addableTypes.find((item) => item.id === leaveTypeId) ?? addableTypes[0];
  const selectedDays = useMemo(() => {
    const rules = latestPolicyRules(policies.find((item) => item.leaveTypeId === selectedType?.id) ?? null);
    return String(rules?.annualAllocation ?? 0);
  }, [policies, selectedType?.id]);

  const daysValue = allocated === '' ? selectedDays : allocated;

  async function onAllocate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    try {
      await createAllocation({
        employeeId,
        leaveTypeId: selectedType?.id ?? '',
        allocated: Number(daysValue),
        period,
      }).unwrap();
      toast.success('Leave type allocated.');
      formEl.reset();
      setAllocated('');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to allocate leave.'));
    }
  }

  async function onSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    try {
      await setAllocation({
        id: editing.id,
        allocated: Number(form.get('allocated') ?? 0),
      }).unwrap();
      setEditing(null);
      toast.success('Leave allocation updated.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to update allocation.'));
    }
  }

  async function onDelete(row: LeaveAllocation) {
    try {
      await deleteAllocation(row.id).unwrap();
      toast.success('Leave type removed.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to remove this leave type.'));
    }
  }

  return (
    <div className="space-y-10">
      {canManage ? (
        <section className="space-y-4">
          <div>
            <Meta className="mb-1">Leave entitlements</Meta>
            <p className="text-sm text-muted">
              {forStaffManager
                ? 'Staff managers cannot allocate their own leave here. Add types and days so they can apply.'
                : 'Days default from the published leave type. Change them for this employee if needed.'}
            </p>
          </div>
          <DataTable
            columns={[
              {
                id: 'type',
                header: 'Leave type',
                cell: (row) => row.leaveTypeName ?? row.leaveTypeCode ?? '—',
              },
              { id: 'period', header: 'Period', cell: (row) => row.period },
              { id: 'allocated', header: 'Allocated', cell: (row) => String(row.allocated) },
              { id: 'used', header: 'Used', cell: (row) => String(row.used) },
              { id: 'available', header: 'Available', cell: (row) => String(row.available) },
              {
                id: 'actions',
                header: 'Actions',
                cell: (row) => (
                  <div className="flex gap-2">
                    <EditIconButton label={`Edit ${row.leaveTypeName ?? 'leave'}`} onClick={() => setEditing(row)} />
                    <IconButton label={`Remove ${row.leaveTypeName ?? 'leave'}`} icon="trash" onClick={() => void onDelete(row)} />
                  </div>
                ),
              },
            ]}
            rows={allocations}
            emptyTitle={isFetching ? 'Loading' : 'No leave types assigned'}
            emptyDescription={
              isFetching
                ? 'Loading allocations.'
                : 'Allocate at least one leave type so this employee can apply for leave.'
            }
          />
          <form onSubmit={onAllocate} className="max-w-xl space-y-4 rounded border border-border bg-surface p-4">
            <Meta>Add leave type</Meta>
            <div>
              <Label htmlFor="leaveTypeId">Leave type</Label>
              <select
                id="leaveTypeId"
                name="leaveTypeId"
                className="h-10 w-full border border-border bg-background px-3 text-sm"
                required
                value={selectedType?.id ?? ''}
                onChange={(event) => {
                  setLeaveTypeId(event.target.value);
                  setAllocated('');
                }}
              >
                {addableTypes.length === 0 ? <option value="">All types allocated for {period}</option> : null}
                {addableTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="allocated">Days allocated</Label>
              <Input
                id="allocated"
                name="allocated"
                type="number"
                min={0}
                step={0.5}
                value={daysValue}
                onChange={(event) => setAllocated(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="period">Period (year)</Label>
              <Input id="period" name="period" value={period} readOnly />
            </div>
            <Button type="submit" disabled={creating || addableTypes.length === 0}>
              {creating ? 'Allocating…' : 'Allocate leave type'}
            </Button>
          </form>
        </section>
      ) : null}

      <section>
        <Meta className="mb-3">Applications</Meta>
        {applications.length === 0 ? (
          <EmptyState title="No applications" description="Leave requests for this employee appear here." />
        ) : (
          <ul className="space-y-3 text-sm">
            {applications.map((row) => (
              <li key={row.id} className="border border-border px-4 py-3">
                {row.leaveTypeCode} · {row.startDate} – {row.endDate} · {row.status}
                {row.handoverEmployeeName ? ` · Handover: ${row.handoverEmployeeName}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogTitle>Edit allocation</DialogTitle>
          <DialogDescription>Change days for this employee. Used days cannot be reduced below.</DialogDescription>
          {editing ? (
            <form key={editing.id} onSubmit={onSaveEdit} className="mt-6 space-y-4">
              <p className="text-sm">{editing.leaveTypeName} · {editing.period}</p>
              <div>
                <Label htmlFor="edit-allocated">Days allocated</Label>
                <Input id="edit-allocated" name="allocated" type="number" min={0} step={0.5} defaultValue={editing.allocated} required />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating || removing}>
                  {updating ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
