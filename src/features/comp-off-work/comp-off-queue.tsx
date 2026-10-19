'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { compOffStatusLabel, compOffTone, quantityLabel } from '@/features/comp-off-work/format';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useApproveCompOffWorkMutation,
  useGetCompOffWorkQueueQuery,
  useRejectCompOffWorkMutation,
} from '@/store/api/api';
import type { CompOffWork } from '@/types/api';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;

function CompOffQueueBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const status = STATUSES.includes(statusParam as (typeof STATUSES)[number])
    ? (statusParam as (typeof STATUSES)[number])
    : 'PENDING';
  const canDecide = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.COMP_OFF_APPROVE),
  );
  const { data, isLoading } = useGetCompOffWorkQueueQuery({ status });
  const [approve, { isLoading: approving }] = useApproveCompOffWorkMutation();
  const [reject, { isLoading: rejecting }] = useRejectCompOffWorkMutation();
  const toast = useToast();
  const busy = approving || rejecting;

  async function onDecide(id: string, action: 'approve' | 'reject') {
    try {
      if (action === 'approve') {
        await approve(id).unwrap();
        toast.success('Compensatory work approved. Leave day marked compensated.');
      } else {
        await reject(id).unwrap();
        toast.success('Compensatory work rejected.');
      }
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to update this request.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Leave" title="Compensatory work" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Employees work a week-off or holiday to offset one leave day in the same month. On approve, leave history is
        kept, that day is compensated for attendance/payroll, and balance is restored when the ledger allows.
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
          { id: 'work', header: 'Work date', cell: (row) => row.workDate },
          { id: 'leave', header: 'Leave day', cell: (row) => row.leaveDate },
          {
            id: 'type',
            header: 'Leave',
            cell: (row) => row.leaveTypeCode ?? row.leaveTypeName ?? '—',
          },
          { id: 'qty', header: 'Offset', cell: (row) => quantityLabel(row.quantity) },
          { id: 'reason', header: 'Reason', cell: (row) => row.reason || '—' },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => (
              <StatusBadge status={compOffTone(row.status)} label={compOffStatusLabel(row.status)} />
            ),
          },
          {
            id: 'restore',
            header: 'Balance',
            cell: (row) =>
              row.status === 'APPROVED'
                ? row.balanceRestored > 0
                  ? `Restored ${row.balanceRestored}`
                  : 'Compensated only'
                : '—',
          },
          ...(canDecide
            ? [
                {
                  id: 'decide',
                  header: 'Decide',
                  cell: (row: CompOffWork) =>
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
        emptyTitle="No compensatory work requests"
        emptyDescription="Pending requests to offset leave by working a week-off or holiday appear here."
      />
    </>
  );
}

export function CompOffQueue() {
  return (
    <Suspense>
      <CompOffQueueBody />
    </Suspense>
  );
}
