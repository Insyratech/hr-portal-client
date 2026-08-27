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
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateShiftAssignmentMutation,
  useCreateShiftMutation,
  useGetEmployeesQuery,
  useGetShiftAssignmentsQuery,
  useGetShiftsQuery,
  useUpdateShiftMutation,
} from '@/store/api/api';
import type { Shift } from '@/types/api';

function timeInputValue(value: string) {
  return value.slice(0, 5);
}

export default function ShiftsPage() {
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.SHIFTS_MANAGE),
  );
  const { data: shifts, isLoading } = useGetShiftsQuery();
  const { data: assignments } = useGetShiftAssignmentsQuery();
  const { data: employees } = useGetEmployeesQuery();
  const [createShift, { isLoading: savingShift }] = useCreateShiftMutation();
  const [updateShift, { isLoading: updating }] = useUpdateShiftMutation();
  const [assignShift, { isLoading: savingAssignment }] = useCreateShiftAssignmentMutation();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Shift | null>(null);

  async function onCreateShift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      await createShift({
        name: String(form.get('name') ?? ''),
        startTime: String(form.get('startTime') ?? ''),
        endTime: String(form.get('endTime') ?? ''),
        minimumDurationMinutes: Number(form.get('minimumDurationMinutes') ?? 540),
        gracePeriodMinutes: Number(form.get('gracePeriodMinutes') ?? 0),
        flexible: form.get('flexible') === 'on',
      }).unwrap();
      formEl.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create shift.'));
    }
  }

  async function onAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      await assignShift({
        employeeId: String(form.get('employeeId') ?? ''),
        shiftId: String(form.get('shiftId') ?? ''),
        effectiveFrom: String(form.get('effectiveFrom') ?? '') || undefined,
      }).unwrap();
      formEl.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to assign shift.'));
    }
  }

  async function onSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await updateShift({
        id: editing.id,
        body: {
          name: String(form.get('name') ?? ''),
          startTime: String(form.get('startTime') ?? ''),
          endTime: String(form.get('endTime') ?? ''),
          minimumDurationMinutes: Number(form.get('minimumDurationMinutes') ?? 540),
          gracePeriodMinutes: Number(form.get('gracePeriodMinutes') ?? 0),
          flexible: form.get('flexible') === 'on',
        },
      }).unwrap();
      setEditing(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update shift.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Attendance" title="Shifts" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Shift times live on the shift definition, not on the employee row. Assign employees below.
      </p>

      {canManage ? (
        <>
      <form onSubmit={onCreateShift} className="mb-10 grid max-w-3xl gap-4 rounded border border-border bg-background p-6 shadow-card sm:grid-cols-3">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="startTime">Start</Label>
          <Input id="startTime" name="startTime" type="time" required />
        </div>
        <div>
          <Label htmlFor="endTime">End</Label>
          <Input id="endTime" name="endTime" type="time" required />
        </div>
        <div>
          <Label htmlFor="minimumDurationMinutes">Min minutes</Label>
          <Input id="minimumDurationMinutes" name="minimumDurationMinutes" type="number" defaultValue={540} required />
        </div>
        <div>
          <Label htmlFor="gracePeriodMinutes">Grace minutes</Label>
          <Input id="gracePeriodMinutes" name="gracePeriodMinutes" type="number" defaultValue={0} />
        </div>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="flexible" /> Flexible
          </label>
          <Button type="submit" disabled={savingShift}>
            Add shift
          </Button>
        </div>
      </form>

      <form onSubmit={onAssign} className="mb-10 grid max-w-3xl gap-4 rounded border border-border bg-background p-6 shadow-card sm:grid-cols-4">
        <div>
          <Label htmlFor="employeeId">Employee</Label>
          <select id="employeeId" name="employeeId" className="h-10 w-full rounded border border-border bg-background px-3 text-sm" required>
            {(employees?.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.fullName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="shiftId">Shift</Label>
          <select id="shiftId" name="shiftId" className="h-10 w-full rounded border border-border bg-background px-3 text-sm" required>
            {(shifts?.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="effectiveFrom">Effective from</Label>
          <Input id="effectiveFrom" name="effectiveFrom" type="date" />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={savingAssignment}>
            Assign
          </Button>
        </div>
      </form>
        </>
      ) : (
        <p className="mb-6 text-sm text-muted">HR Manager maintains shifts and assignments. This list is read-only.</p>
      )}

      {error && !editing ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}

      <DataTable
        columns={[
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'window', header: 'Window', cell: (row) => `${timeInputValue(row.startTime)}–${timeInputValue(row.endTime)}` },
          { id: 'min', header: 'Required', cell: (row) => `${row.minimumDurationMinutes}m` },
          { id: 'flexible', header: 'Flexible', cell: (row) => (row.flexible ? 'Yes' : 'No') },
          ...(canManage
            ? [
                {
                  id: 'edit',
                  header: 'Edit',
                  cell: (row: Shift) => (
                    <EditIconButton label={`Edit ${row.name}`} onClick={() => setEditing(row)} />
                  ),
                },
              ]
            : []),
        ]}
        rows={shifts?.data ?? []}
        emptyTitle={isLoading ? 'Loading' : 'No shifts'}
        emptyDescription="Seeded shifts appear after the Phase 3 SQL migration."
      />

      <div className="mt-10">
        <DataTable
          columns={[
            { id: 'employee', header: 'Employee', cell: (row) => row.employeeName ?? '—' },
            { id: 'shift', header: 'Shift', cell: (row) => row.shiftName ?? '—' },
            { id: 'from', header: 'From', cell: (row) => row.effectiveFrom },
          ]}
          rows={assignments?.data ?? []}
          emptyTitle="No assignments"
          emptyDescription="Assign a shift so attendance rules apply for this employee."
        />
      </div>

      <Dialog open={Boolean(editing) && canManage} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogTitle>Edit shift</DialogTitle>
          <DialogDescription>Times belong to the shift definition. Existing assignments keep this shift.</DialogDescription>
          {editing ? (
            <form key={editing.id} onSubmit={onSaveEdit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="edit-shift-name">Name</Label>
                <Input id="edit-shift-name" name="name" defaultValue={editing.name} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startTime">Start</Label>
                  <Input id="edit-startTime" name="startTime" type="time" defaultValue={timeInputValue(editing.startTime)} required />
                </div>
                <div>
                  <Label htmlFor="edit-endTime">End</Label>
                  <Input id="edit-endTime" name="endTime" type="time" defaultValue={timeInputValue(editing.endTime)} required />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-min">Min minutes</Label>
                <Input
                  id="edit-min"
                  name="minimumDurationMinutes"
                  type="number"
                  defaultValue={editing.minimumDurationMinutes}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-grace">Grace minutes</Label>
                <Input id="edit-grace" name="gracePeriodMinutes" type="number" defaultValue={editing.gracePeriodMinutes} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="flexible" defaultChecked={editing.flexible} /> Flexible
              </label>
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
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
