'use client';

import { useEffect, useRef, useState } from 'react';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import {
  hoursLabel,
  monthKey,
  permissionStatusLabel,
  permissionTone,
  remainingInMonth,
  remainingText,
  slotLabel,
  usedInMonth,
} from '@/features/work-permissions/format';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import {
  useCancelWorkPermissionMutation,
  useGetMyWorkPermissionsQuery,
} from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export function PermissionStatusList({ focusId }: { focusId: string | null }) {
  const canApply = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.WORK_PERMISSION_APPLY),
  );
  const { data, refetch } = useGetMyWorkPermissionsQuery(undefined, { skip: !canApply });
  const [cancelPermission, { isLoading: revoking }] = useCancelWorkPermissionMutation();
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const today = new Date().toISOString().slice(0, 10);
  const items = data?.data.items ?? [];
  const remaining = remainingInMonth(items, today, data?.data.quotaMinutes);
  const usedHours = usedInMonth(items, today) / 60;
  const thisMonth = monthKey(today);

  useEffect(() => {
    if (!focusId) return;
    rowRefs.current[focusId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId, items]);

  async function onRevoke(id: string) {
    setBusyId(id);
    try {
      await cancelPermission(id).unwrap();
      toast.success('Permission revoked. Hours for that day are available again.');
      await refetch();
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to revoke this permission.'));
    } finally {
      setBusyId(null);
    }
  }

  if (!canApply) {
    return null;
  }

  if (items.length === 0) {
    return (
      <section id="permission-status" className="mb-10 space-y-2">
        <Meta>Permission status</Meta>
        <p className="text-sm text-muted">
          No permission requests yet. Use Apply for permission for 1 hour at the start or end of a shift.
        </p>
      </section>
    );
  }

  return (
    <section id="permission-status" className="mb-10 space-y-4">
      <div>
        <Meta>Permission status</Meta>
        <p className="mt-2 text-sm text-muted">
          {usedHours} of 2 hours used this month · {remainingText(remaining, today)}. Pending and approved both count.
          You can revoke a pending request before HR decides — hours are restored.
        </p>
      </div>
      {items.map((row) => (
        <div
          key={row.id}
          id={`permission-${row.id}`}
          ref={(node) => {
            rowRefs.current[row.id] = node;
          }}
          className={`border bg-background p-5 shadow-card ${focusId === row.id ? 'border-foreground' : 'border-border'}`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium">
              {row.permissionDate} · {hoursLabel(row.minutes)} · {slotLabel(row.slot)}
            </p>
            <StatusBadge
              status={permissionTone(row.status)}
              label={permissionStatusLabel(row.status)}
            />
          </div>
          {row.reason ? <p className="mt-2 text-sm text-muted">{row.reason}</p> : null}
          {monthKey(row.permissionDate) !== thisMonth ? (
            <p className="mt-2 text-sm text-muted">{row.monthLabel}</p>
          ) : null}
          {row.status === 'PENDING' ? (
            <div className="mt-4">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={revoking && busyId === row.id}
                onClick={() => void onRevoke(row.id)}
              >
                {revoking && busyId === row.id ? 'Revoking…' : 'Revoke'}
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </section>
  );
}
