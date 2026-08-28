'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Meta } from '@/components/layout/meta';
import { EmptyState } from '@/components/dashboard/empty-state';
import { DataTable } from '@/components/dashboard/data-table';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useCreateShiftAssignmentMutation,
  useGetAttendanceDayQuery,
  useGetEmployeeWorkWeekQuery,
  useGetShiftAssignmentsQuery,
  useGetShiftsQuery,
  useSaveEmployeeWorkWeekMutation,
} from '@/store/api/api';
import { formatShiftOption } from '@/features/attendance/shift-label';
import { formatAssignmentStatus, sortAssignmentsCurrentFirst } from '@/features/attendance/assignment-status';
import type { WorkWeek } from '@/types/api';

const WEEK_OPTIONS: { value: WorkWeek['pattern']; label: string }[] = [
  { value: 'SUNDAY_OFF', label: 'Sunday off (works Saturday)' },
  { value: 'WEEKEND_OFF', label: 'Saturday and Sunday off' },
  { value: 'SECOND_FOURTH_SATURDAY', label: 'Sunday off, plus 2nd and 4th Saturday off' },
];

function weekLabel(pattern: WorkWeek['pattern']): string {
  return WEEK_OPTIONS.find((item) => item.value === pattern)?.label ?? pattern;
}

export function EmployeeAttendancePanel({
  employeeId,
  canManage,
}: {
  employeeId: string;
  canManage: boolean;
}) {
  const toast = useToast();
  const { data: dayData } = useGetAttendanceDayQuery();
  const { data: assignmentsData } = useGetShiftAssignmentsQuery();
  const { data: shiftsData } = useGetShiftsQuery();
  const { data: weeksData } = useGetEmployeeWorkWeekQuery(employeeId);
  const [assignShift, { isLoading }] = useCreateShiftAssignmentMutation();
  const [saveWeek, { isLoading: savingWeek }] = useSaveEmployeeWorkWeekMutation();
  const [weekOpen, setWeekOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);

  const records = (dayData?.data.records ?? []).filter((item) => item.employeeId === employeeId);
  const assignments = sortAssignmentsCurrentFirst(
    (assignmentsData?.data ?? []).filter((item) => item.employeeId === employeeId),
  );
  const shifts = (shiftsData?.data ?? []).filter((item) => item.active);
  const weeks = weeksData?.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const currentShift = assignments.find((row) => !row.effectiveTo) ?? assignments[0];
  const currentWeek = weeks.find((row) => !row.effectiveTo || row.effectiveTo >= today) ?? weeks[0];

  async function onAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await assignShift({
        employeeId,
        shiftId: String(form.get('shiftId') ?? ''),
        effectiveFrom: String(form.get('effectiveFrom') ?? '') || undefined,
      }).unwrap();
      toast.success('Shift saved.');
      setShiftOpen(false);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to save shift.'));
    }
  }

  async function onSaveWeek(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await saveWeek({
        id: employeeId,
        body: {
          pattern: String(form.get('pattern') ?? '') as WorkWeek['pattern'],
          effectiveFrom: String(form.get('weekFrom') ?? ''),
        },
      }).unwrap();
      toast.success('Working week saved.');
      setWeekOpen(false);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to save working week.'));
    }
  }

  return (
    <div className="space-y-10">
      {canManage ? (
        <>
          <section className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Meta className="mb-1">Working week</Meta>
                <p className="text-sm text-muted">
                  Week-offs for this person. Same date updates this row. A later date starts a new row. Company
                  holidays still apply.
                </p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setWeekOpen(true)}>
                {weeks.length ? 'Update working week' : 'Set working week'}
              </Button>
            </div>
            <DataTable
              columns={[
                { id: 'week', header: 'Week-offs', cell: (row) => weekLabel(row.pattern) },
                { id: 'from', header: 'Effective from', cell: (row) => row.effectiveFrom },
                { id: 'to', header: 'Effective to', cell: (row) => row.effectiveTo ?? 'Open' },
              ]}
              rows={weeks}
              emptyTitle="Using company working days"
              emptyDescription="Use Set working week so leave and attendance follow this person, not only the company calendar."
            />
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Meta className="mb-1">Shift</Meta>
                <p className="text-sm text-muted">
                  Only one shift is current at a time. Saving a change closes the previous shift the day before the
                  effective date. Older rows stay in history as closed.
                </p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShiftOpen(true)}>
                {assignments.length ? 'Update shift' : 'Assign shift'}
              </Button>
            </div>
            <DataTable
              columns={[
                { id: 'shift', header: 'Shift', cell: (row) => row.shiftName ?? '—' },
                { id: 'from', header: 'Effective from', cell: (row) => row.effectiveFrom },
                { id: 'to', header: 'Status', cell: (row) => formatAssignmentStatus(row.effectiveTo) },
              ]}
              rows={assignments}
              emptyTitle="No shift assigned"
              emptyDescription="Use Assign shift so Excel attendance rules apply for this employee."
            />
          </section>

          <Dialog open={weekOpen} onOpenChange={setWeekOpen}>
            <DialogContent>
              <DialogTitle>Set working week</DialogTitle>
              <DialogDescription className="sr-only">
                Choose week-offs and the date they take effect for this employee.
              </DialogDescription>
              <form key={`week-${currentWeek?.id ?? 'new'}-${weekOpen}`} onSubmit={onSaveWeek} className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="pattern">Week-offs</Label>
                  <select
                    id="pattern"
                    name="pattern"
                    className="h-10 w-full border border-border bg-background px-3 text-sm"
                    required
                    defaultValue={currentWeek?.pattern ?? 'SUNDAY_OFF'}
                  >
                    {WEEK_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="weekFrom">Effective from</Label>
                  <Input
                    id="weekFrom"
                    name="weekFrom"
                    type="date"
                    required
                    defaultValue={currentWeek?.effectiveFrom ?? today}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={savingWeek}>
                    {savingWeek ? 'Saving…' : 'Save working week'}
                  </Button>
                  <Button type="button" variant="ghost" disabled={savingWeek} onClick={() => setWeekOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={shiftOpen} onOpenChange={setShiftOpen}>
            <DialogContent>
              <DialogTitle>Save shift</DialogTitle>
              <DialogDescription>
                Pick the shift and the date it starts. The previous current shift will close automatically.
              </DialogDescription>
              <form
                key={`shift-${currentShift?.id ?? 'new'}-${shiftOpen}`}
                onSubmit={onAssign}
                className="mt-4 space-y-4"
              >
                <div>
                  <Label htmlFor="shiftId">Shift</Label>
                  <select
                    id="shiftId"
                    name="shiftId"
                    className="h-10 w-full border border-border bg-background px-3 text-sm"
                    required
                    defaultValue={currentShift?.shiftId ?? ''}
                  >
                    <option value="" disabled>
                      Select shift
                    </option>
                    {shifts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {formatShiftOption(item)}
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
                    defaultValue={currentShift?.effectiveFrom ?? today}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={isLoading || shifts.length === 0}>
                    {isLoading ? 'Saving…' : 'Save shift'}
                  </Button>
                  <Button type="button" variant="ghost" disabled={isLoading} onClick={() => setShiftOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </>
      ) : null}

      <section>
        <Meta className="mb-3">Attendance today</Meta>
        {records.length === 0 ? (
          <EmptyState title="No attendance today" description="Published days appear after HR confirms a month." />
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
