'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Meta } from '@/components/layout/meta';
import { EmptyState } from '@/components/dashboard/empty-state';
import { DataTable } from '@/components/dashboard/data-table';
import {
  useCreateShiftAssignmentMutation,
  useGetAttendanceDayQuery,
  useGetShiftAssignmentsQuery,
  useGetShiftsQuery,
} from '@/store/api/api';

export function EmployeeAttendancePanel({
  employeeId,
  canManage,
}: {
  employeeId: string;
  canManage: boolean;
}) {
  const { data: dayData } = useGetAttendanceDayQuery();
  const { data: assignmentsData } = useGetShiftAssignmentsQuery(undefined, { skip: !canManage });
  const { data: shiftsData } = useGetShiftsQuery(undefined, { skip: !canManage });
  const [assignShift, { isLoading }] = useCreateShiftAssignmentMutation();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const records = (dayData?.data.records ?? []).filter((item) => item.employeeId === employeeId);
  const assignments = (assignmentsData?.data ?? []).filter((item) => item.employeeId === employeeId);
  const shifts = (shiftsData?.data ?? []).filter((item) => item.active);

  async function onAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      await assignShift({
        employeeId,
        shiftId: String(form.get('shiftId') ?? ''),
        effectiveFrom: String(form.get('effectiveFrom') ?? '') || undefined,
      }).unwrap();
      setMessage('Shift assigned to this employee.');
      event.currentTarget.reset();
    } catch (cause) {
      const text =
        cause && typeof cause === 'object' && 'data' in cause
          ? (cause as { data?: { error?: { message?: string } } }).data?.error?.message
          : null;
      setError(text ?? 'Unable to assign shift.');
    }
  }

  return (
    <div className="space-y-10">
      {canManage ? (
        <section className="space-y-4">
          <div>
            <Meta className="mb-1">Shift assignment</Meta>
            <p className="text-sm text-muted">
              Shift times live on the shift definition. Assign which shift this employee follows.
            </p>
          </div>
          <DataTable
            columns={[
              { id: 'shift', header: 'Shift', cell: (row) => row.shiftName ?? '—' },
              { id: 'from', header: 'Effective from', cell: (row) => row.effectiveFrom },
              { id: 'to', header: 'Effective to', cell: (row) => row.effectiveTo ?? 'Open' },
            ]}
            rows={assignments}
            emptyTitle="No shift assigned"
            emptyDescription="Assign a shift so punch rules apply for this employee."
          />
          <form onSubmit={onAssign} className="max-w-xl space-y-4 border border-border bg-surface p-4">
            <Meta>Assign shift</Meta>
            <div>
              <Label htmlFor="shiftId">Shift</Label>
              <select
                id="shiftId"
                name="shiftId"
                className="h-10 w-full border border-border bg-background px-3 text-sm"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Select shift
                </option>
                {shifts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.startTime}–{item.endTime}
                    {item.flexible ? ', flexible' : ''})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="effectiveFrom">Effective from</Label>
              <Input
                id="effectiveFrom"
                name="effectiveFrom"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
            {error ? <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p> : null}
            {message ? <p className="text-sm text-muted">{message}</p> : null}
            <Button type="submit" disabled={isLoading || shifts.length === 0}>
              {isLoading ? 'Assigning…' : 'Assign shift'}
            </Button>
          </form>
        </section>
      ) : null}

      <section>
        <Meta className="mb-3">Attendance today</Meta>
        {records.length === 0 ? (
          <EmptyState title="No attendance today" description="Records appear after punch or finalization." />
        ) : (
          <ul className="space-y-3 text-sm">
            {records.map((row) => (
              <li key={row.id} className="border border-border px-4 py-3">
                {row.attendanceDate} · {row.status}
                {row.shiftName ? ` · ${row.shiftName}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
