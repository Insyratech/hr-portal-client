'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { quantityLabel } from '@/features/comp-off-work/format';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { useApplyCompOffAdjustmentMutation, useGetCompOffEligibleLeavesQuery } from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RequestCompOffAdjustForm({ onApplied }: { onApplied?: () => void }) {
  const canApply = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.COMP_OFF_APPLY),
  );
  const month = monthOf(todayIso());
  const { data, isFetching } = useGetCompOffEligibleLeavesQuery({ month }, { skip: !canApply });
  const [apply, { isLoading }] = useApplyCompOffAdjustmentMutation();
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
      toast.error('Choose a leave application and the leave day to adjust.');
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      await apply({
        leaveApplicationId,
        leaveDate,
        reason: String(form.get('reason') ?? '').trim() || undefined,
      }).unwrap();
      toast.success('Adjustment requested. Waiting for HR approval.');
      setLeaveApplicationId('');
      setLeaveDate('');
      onApplied?.();
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to request this adjustment.'));
    }
  }

  if (!canApply) return null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-muted">
        Use available COMP balance to cover an approved leave day already taken this month. The original leave
        application stays in history. HR approves the adjustment.
      </p>
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
          <p className="mt-2 text-sm text-muted">No approved leave in {month} that can be adjusted.</p>
        ) : null}
      </div>
      {selected ? (
        <div>
          <Label htmlFor="compOffLeaveDate">Leave day to adjust</Label>
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
            <p className="mt-2 text-sm text-muted">Every day on this application is already adjusted or claimed.</p>
          ) : null}
          {selectedDay ? (
            <p className="mt-2 text-sm text-muted">Uses {quantityLabel(selectedDay.quantity)} of COMP.</p>
          ) : null}
        </div>
      ) : null}
      <div>
        <Label htmlFor="compOffAdjustReason">Reason (optional)</Label>
        <Input id="compOffAdjustReason" name="reason" />
      </div>
      <Button type="submit" disabled={isLoading || !leaveApplicationId || !leaveDate}>
        {isLoading ? 'Sending…' : 'Request adjustment'}
      </Button>
    </form>
  );
}
