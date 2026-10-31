'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  adjustmentBalanceLabel,
  compOffStatusLabel,
  compOffTone,
  creditLabel,
  quantityLabel,
  waitingOnLabel,
  workKindLabel,
} from '@/features/comp-off-work/format';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useApproveCompOffAdjustmentMutation,
  useApproveCompOffWorkMutation,
  useConfirmCompOffWorkMutation,
  useGetCompOffAdjustmentQueueQuery,
  useGetCompOffWorkQueueQuery,
  useRejectCompOffAdjustmentMutation,
  useRejectCompOffWorkMutation,
} from '@/store/api/api';
import type { CompOffAdjustment, CompOffWork } from '@/types/api';

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
  const { data: adjustments, isLoading: loadingAdjustments } = useGetCompOffAdjustmentQueueQuery({ status });
  const [approve, { isLoading: approving }] = useApproveCompOffWorkMutation();
  const [confirm, { isLoading: confirming }] = useConfirmCompOffWorkMutation();
  const [reject, { isLoading: rejecting }] = useRejectCompOffWorkMutation();
  const [approveAdjustment, { isLoading: approvingAdj }] = useApproveCompOffAdjustmentMutation();
  const [rejectAdjustment, { isLoading: rejectingAdj }] = useRejectCompOffAdjustmentMutation();
  const toast = useToast();
  const busy = approving || confirming || rejecting || approvingAdj || rejectingAdj;

  async function onDecide(row: CompOffWork, action: 'approve' | 'reject' | 'confirm') {
    try {
      if (action === 'confirm') {
        await confirm(row.id).unwrap();
        toast.success('Work confirmed. COMP leave credited.');
        return;
      }
      if (action === 'approve') {
        await approve(row.id).unwrap();
        toast.success(
          row.kind === 'LEGACY_OFFSET'
            ? 'Compensatory work approved. Leave day marked compensated.'
            : 'Compensatory work approved.',
        );
        return;
      }
      await reject(row.id).unwrap();
      toast.success('Compensatory work rejected.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to update this request.'));
    }
  }

  async function onAdjust(id: string, action: 'approve' | 'reject') {
    try {
      if (action === 'approve') {
        await approveAdjustment(id).unwrap();
        toast.success('Leave day adjusted against COMP.');
      } else {
        await rejectAdjustment(id).unwrap();
        toast.success('Adjustment rejected.');
      }
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to update this adjustment.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Leave" title="Compensatory work" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Employees earn COMP by working a holiday or week-off after project-lead then HR approval. COMP leave is
        credited only after the work date is confirmed. Adjustments cover a leave day already taken this month
        without changing the original leave application.
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
      <h2 className="mb-3 text-sm font-semibold tracking-tight">Work requests</h2>
      <DataTable
        columns={[
          { id: 'employee', header: 'Employee', cell: (row) => row.employeeName ?? '—' },
          { id: 'kind', header: 'Type', cell: (row) => workKindLabel(row) },
          { id: 'work', header: 'Work date', cell: (row) => row.workDate },
          {
            id: 'leave',
            header: 'Linked leave',
            cell: (row) => row.leaveDate ?? '—',
          },
          { id: 'qty', header: 'Days', cell: (row) => quantityLabel(row.quantity) },
          { id: 'reason', header: 'Reason', cell: (row) => row.reason || '—' },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => (
              <StatusBadge status={compOffTone(row.status)} label={compOffStatusLabel(row.status)} />
            ),
          },
          { id: 'wait', header: 'Waiting on', cell: (row) => waitingOnLabel(row) },
          { id: 'restore', header: 'Balance', cell: (row) => creditLabel(row) },
          ...(canDecide
            ? [
                {
                  id: 'decide',
                  header: 'Decide',
                  cell: (row: CompOffWork) => {
                    if (row.status !== 'PENDING') return '—';
                    if (row.waitingOn === 'PROJECT_LEAD') {
                      return <span className="text-sm text-muted">Waiting for project lead</span>;
                    }
                    if (row.waitingOn === 'WORK_CONFIRM') {
                      return (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy}
                            onClick={() => void onDecide(row, 'confirm')}
                          >
                            Confirm work
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void onDecide(row, 'reject')}
                          >
                            Decline
                          </Button>
                        </div>
                      );
                    }
                    return (
                      <div className="flex gap-2">
                        <Button type="button" size="sm" disabled={busy} onClick={() => void onDecide(row, 'approve')}>
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void onDecide(row, 'reject')}
                        >
                          Decline
                        </Button>
                      </div>
                    );
                  },
                },
              ]
            : []),
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No compensatory work requests"
        emptyDescription="Pending requests to work a holiday or week-off appear here."
      />
      <h2 className="mb-3 mt-10 text-sm font-semibold tracking-tight">Leave adjustments</h2>
      <DataTable
        columns={[
          { id: 'employee', header: 'Employee', cell: (row) => row.employeeName ?? '—' },
          { id: 'leave', header: 'Leave day', cell: (row) => row.leaveDate },
          {
            id: 'type',
            header: 'Original leave',
            cell: (row) => row.leaveTypeCode ?? row.leaveTypeName ?? '—',
          },
          { id: 'qty', header: 'COMP', cell: (row) => quantityLabel(row.quantity) },
          { id: 'reason', header: 'Reason', cell: (row) => row.reason || '—' },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => (
              <StatusBadge status={compOffTone(row.status)} label={compOffStatusLabel(row.status)} />
            ),
          },
          { id: 'balance', header: 'Balance', cell: (row) => adjustmentBalanceLabel(row) },
          ...(canDecide
            ? [
                {
                  id: 'decide',
                  header: 'Decide',
                  cell: (row: CompOffAdjustment) =>
                    row.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => void onAdjust(row.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void onAdjust(row.id, 'reject')}
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
        rows={adjustments?.data ?? []}
        loading={loadingAdjustments}
        emptyTitle="No COMP leave adjustments"
        emptyDescription="Requests to cover a leave day already taken this month appear here."
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
