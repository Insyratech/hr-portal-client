'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { shiftChangeDateLabel } from '@/features/shift-changes/shift-change-journey';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useApproveShiftChangeMutation,
  useGetShiftChangesQuery,
  useRejectShiftChangeMutation,
} from '@/store/api/api';
import type { ShiftChangeRequest } from '@/types/api';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;

function tone(status: ShiftChangeRequest['status']): 'approved' | 'pending' | 'rejected' {
  if (status === 'APPROVED') return 'approved';
  if (status === 'PENDING') return 'pending';
  return 'rejected';
}

function readyForHr(row: ShiftChangeRequest): boolean {
  return row.status === 'PENDING' && (!row.projectLeadRequired || row.projectLeadAccepted);
}

function ShiftChangeQueueBody({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const status = STATUSES.includes(statusParam as (typeof STATUSES)[number])
    ? (statusParam as (typeof STATUSES)[number])
    : 'PENDING';
  const canDecide = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.SHIFT_CHANGE_APPROVE),
  );
  const { data, isLoading } = useGetShiftChangesQuery({ status });
  const [approve, { isLoading: approving }] = useApproveShiftChangeMutation();
  const [reject, { isLoading: rejecting }] = useRejectShiftChangeMutation();
  const toast = useToast();
  const busy = approving || rejecting;

  async function onDecide(id: string, action: 'approve' | 'reject') {
    try {
      if (action === 'approve') {
        await approve({ id }).unwrap();
        toast.success('Shift change approved.');
      } else {
        await reject({ id }).unwrap();
        toast.success('Shift change declined.');
      }
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to update this request.'));
    }
  }

  return (
    <>
      <PageHeader kicker={kicker} title={title} />
      <p className="mb-6 max-w-2xl text-sm text-muted">{description}</p>
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
          { id: 'dates', header: 'Dates', cell: (row) => shiftChangeDateLabel(row) },
          {
            id: 'shift',
            header: 'Requested',
            cell: (row) => row.requestedShiftName ?? '—',
          },
          {
            id: 'current',
            header: 'Current',
            cell: (row) => row.currentShiftName ?? '—',
          },
          {
            id: 'lead',
            header: 'Lead',
            cell: (row) =>
              !row.projectLeadRequired
                ? 'Not required'
                : row.projectLeadAccepted
                  ? 'Accepted'
                  : 'Waiting',
          },
          { id: 'reason', header: 'Reason', cell: (row) => row.reason || '—' },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={tone(row.status)} label={row.status} />,
          },
          ...(canDecide
            ? [
                {
                  id: 'decide',
                  header: 'Decide',
                  cell: (row: ShiftChangeRequest) =>
                    readyForHr(row) ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => void onDecide(row.id, 'approve')}
                        >
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
                    ) : row.status === 'PENDING' ? (
                      'Waiting on lead'
                    ) : (
                      '—'
                    ),
                },
              ]
            : []),
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No shift change requests"
        emptyDescription="Nothing in this filter yet."
      />
    </>
  );
}

export function ShiftChangeQueue(props: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <Suspense fallback={<PageHeader kicker={props.kicker} title={props.title} />}>
      <ShiftChangeQueueBody {...props} />
    </Suspense>
  );
}
