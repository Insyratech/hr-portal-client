'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { remainingText, hoursLabel, permissionTone, slotLabel } from '@/features/work-permissions/format';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useApproveWorkPermissionMutation,
  useGetWorkPermissionsQuery,
  useRejectWorkPermissionMutation,
} from '@/store/api/api';
import type { WorkPermission } from '@/types/api';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

function PermissionsQueueBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const status = STATUSES.includes(statusParam as (typeof STATUSES)[number])
    ? (statusParam as (typeof STATUSES)[number])
    : 'PENDING';
  const canDecide = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.WORK_PERMISSION_APPROVE),
  );
  const { data, isLoading } = useGetWorkPermissionsQuery({ status });
  const [approve, { isLoading: approving }] = useApproveWorkPermissionMutation();
  const [reject, { isLoading: rejecting }] = useRejectWorkPermissionMutation();
  const toast = useToast();
  const busy = approving || rejecting;

  async function onDecide(id: string, action: 'approve' | 'reject') {
    try {
      if (action === 'approve') {
        await approve(id).unwrap();
        toast.success('Permission approved.');
      } else {
        await reject(id).unwrap();
        toast.success('Permission rejected.');
      }
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to update this request.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Attendance" title="Permissions" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Employees get 1 hour on 2 days each calendar month (2 hours total). Choose start or end of the shift. Pending
        and approved days both count until a request is declined.
      </p>
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUSES.map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={status === item ? 'primary' : 'outline'}
            onClick={() => router.replace(`?status=${item}`)}
          >
            {item}
          </Button>
        ))}
      </div>
      <DataTable
        columns={[
          { id: 'employee', header: 'Employee', cell: (row) => row.employeeName ?? '—' },
          { id: 'date', header: 'Date', cell: (row) => row.permissionDate },
          { id: 'when', header: 'When', cell: (row) => slotLabel(row.slot) },
          { id: 'time', header: 'Time', cell: (row) => hoursLabel(row.minutes) },
          { id: 'reason', header: 'Reason', cell: (row) => row.reason || '—' },
          {
            id: 'left',
            header: 'Quota',
            cell: (row) => remainingText(row.remainingMinutes, row.permissionDate),
          },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={permissionTone(row.status)} label={row.status} />,
          },
          ...(canDecide
            ? [
                {
                  id: 'decide',
                  header: 'Decide',
                  cell: (row: WorkPermission) =>
                    row.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <Button type="button" size="sm" disabled={busy} onClick={() => void onDecide(row.id, 'approve')}>
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void onDecide(row.id, 'reject')}
                        >
                          Decline
                        </Button>
                      </div>
                    ) : (
                      '—'
                    ),
                },
              ]
            : []),
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No permission requests"
        emptyDescription="1-hour start or end of shift requests appear here."
      />
    </>
  );
}

export function PermissionsQueue() {
  return (
    <Suspense>
      <PermissionsQueueBody />
    </Suspense>
  );
}
