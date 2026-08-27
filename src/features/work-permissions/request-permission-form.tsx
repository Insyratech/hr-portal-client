'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { remainingInMonth, remainingText } from '@/features/work-permissions/format';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { useApplyWorkPermissionMutation, useGetMyWorkPermissionsQuery } from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import type { WorkPermission } from '@/types/api';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RequestPermissionForm({ onApplied }: { onApplied?: () => void }) {
  const canApply = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.WORK_PERMISSION_APPLY),
  );
  const { data } = useGetMyWorkPermissionsQuery(undefined, { skip: !canApply });
  const [apply, { isLoading }] = useApplyWorkPermissionMutation();
  const [date, setDate] = useState(todayIso);
  const [slot, setSlot] = useState<WorkPermission['slot']>('START');
  const toast = useToast();
  const items = data?.data.items ?? [];
  const remaining = remainingInMonth(items, date, data?.data.quotaMinutes);
  const remainingLine = remainingText(remaining, date);
  const canRequest = remaining >= 60;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await apply({
        permissionDate: date,
        minutes: 60,
        slot,
        reason: String(form.get('reason') ?? '').trim() || undefined,
      }).unwrap();
      toast.success('Permission requested.');
      onApplied?.();
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to request permission.'));
    }
  }

  if (!canApply) {
    return null;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm">
        1 hour a day, twice a month. Use it at the start of your shift or at the end. This is not leave.
      </p>
      {canRequest ? (
        <>
          <div>
            <Label htmlFor="permissionDate">Date</Label>
            <Input
              id="permissionDate"
              name="permissionDate"
              type="date"
              required
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <p className="mt-2 text-sm text-muted">{remainingLine}</p>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm">When</legend>
            <div className="flex flex-col gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="slot"
                  checked={slot === 'START'}
                  onChange={() => setSlot('START')}
                />
                Start of shift
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="slot" checked={slot === 'END'} onChange={() => setSlot('END')} />
                End of shift
              </label>
            </div>
          </fieldset>
          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input id="reason" name="reason" />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending…' : 'Request 1 hour'}
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">No permission time left in this month. {remainingLine}</p>
      )}
    </form>
  );
}
