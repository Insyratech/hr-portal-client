'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { quantityLabel } from '@/features/comp-off-work/format';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useApplyCompOffWorkMutation,
  useGetCompOffEligibleLeavesQuery,
} from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function RequestCompOffForm({ onApplied }: { onApplied?: () => void }) {
  const canApply = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.COMP_OFF_APPLY),
  );
  const [workDate, setWorkDate] = useState(todayIso);
  const month = monthOf(workDate);
  const { data, isFetching } = useGetCompOffEligibleLeavesQuery({ month }, { skip: !canApply });
  const [apply, { isLoading }] = useApplyCompOffWorkMutation();
  const [leaveApplicationId, setLeaveApplicationId] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const toast = useToast();

  const leaves = data?.data ?? [];
  const selected = useMemo(
    () => leaves.find((row) => row.leaveApplicationId === leaveApplicationId) ?? null,
    [leaves, leaveApplicationId],
  );
  const availableDays = (selected?.days ?? []).filter((day) => day.available);
  const selectedDay = availableDays.find((day) => day.leaveDate === leaveDate) ?? null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!leaveApplicationId || !leaveDate) {
      toast.error('Choose a leave application and the leave day to offset.');
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      await apply({
        workDate,
        leaveApplicationId,
        leaveDate,
        reason: String(form.get('reason') ?? '').trim() || undefined,
      }).unwrap();
      toast.success('Compensatory work requested. Waiting for HR approval.');
      setLeaveApplicationId('');
      setLeaveDate('');
      onApplied?.();
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to request compensatory work.'));
    }
  }

  if (!canApply) {
    return null;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-muted">
        Work on a week-off or holiday in the same month as an approved leave day. After HR approves, that leave day
        stays in history but is marked compensated (no leave/LOP in attendance), and balance is restored when possible.
      </p>
      <div>
        <Label htmlFor="compOffWorkDate">Work date (week-off / holiday)</Label>
        <Input
          id="compOffWorkDate"
          type="date"
          required
          value={workDate}
          onChange={(event) => {
            const next = event.target.value;
            setWorkDate(next);
            if (monthOf(next) !== month) {
              setLeaveApplicationId('');
              setLeaveDate('');
            }
          }}
        />
      </div>
      <div>
        <Label htmlFor="compOffLeaveApp">Leave application this month</Label>
        <select
          id="compOffLeaveApp"
          className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
          required
          value={leaveApplicationId}
          onChange={(event) => {
            setLeaveApplicationId(event.target.value);
            setLeaveDate('');
          }}
          disabled={isFetching}
        >
          <option value="">{isFetching ? 'Loading…' : 'Select leave application'}</option>
          {leaves.map((row) => (
            <option key={row.leaveApplicationId} value={row.leaveApplicationId}>
              {(row.leaveTypeCode ?? 'Leave') +
                ` · ${row.startDate} – ${row.endDate}` +
                (row.days.some((day) => day.available) ? '' : ' (all days claimed)')}
            </option>
          ))}
        </select>
        {leaves.length === 0 && !isFetching ? (
          <p className="mt-2 text-sm text-muted">No approved leave applications in {month} to link.</p>
        ) : null}
      </div>
      {selected ? (
        <div>
          <Label htmlFor="compOffLeaveDate">Leave day to offset</Label>
          <select
            id="compOffLeaveDate"
            className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
            required
            value={leaveDate}
            onChange={(event) => setLeaveDate(event.target.value)}
          >
            <option value="">Select leave day</option>
            {availableDays.map((day) => (
              <option key={day.leaveDate} value={day.leaveDate}>
                {day.leaveDate} · {quantityLabel(day.quantity)}
              </option>
            ))}
          </select>
          {availableDays.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Every day on this application is already linked or claimed.</p>
          ) : null}
          {selectedDay ? (
            <p className="mt-2 text-sm text-muted">Offsets {quantityLabel(selectedDay.quantity)}.</p>
          ) : null}
        </div>
      ) : null}
      <div>
        <Label htmlFor="compOffReason">Reason (optional)</Label>
        <Input id="compOffReason" name="reason" />
      </div>
      <Button type="submit" disabled={isLoading || !leaveApplicationId || !leaveDate}>
        {isLoading ? 'Sending…' : 'Request compensatory work'}
      </Button>
    </form>
  );
}
