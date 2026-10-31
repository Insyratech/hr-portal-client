'use client';

import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
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
import {
  useCancelCompOffAdjustmentMutation,
  useCancelCompOffWorkMutation,
  useGetMyCompOffAdjustmentsQuery,
  useGetMyCompOffWorkQuery,
} from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export function CompOffStatusList() {
  const canApply = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.COMP_OFF_APPLY),
  );
  const { data, isLoading } = useGetMyCompOffWorkQuery(undefined, { skip: !canApply });
  const { data: adjustments, isLoading: loadingAdjustments } = useGetMyCompOffAdjustmentsQuery(undefined, {
    skip: !canApply,
  });
  const [cancel, { isLoading: cancelling }] = useCancelCompOffWorkMutation();
  const [cancelAdjustment, { isLoading: cancellingAdjustment }] = useCancelCompOffAdjustmentMutation();
  const toast = useToast();

  if (!canApply) return null;

  return (
    <div className="space-y-8">
      <DataTable
        columns={[
          { id: 'kind', header: 'Type', cell: (row) => workKindLabel(row) },
          { id: 'work', header: 'Work date', cell: (row) => row.workDate },
          {
            id: 'qty',
            header: 'Credit',
            cell: (row) => (row.kind === 'EARN' ? quantityLabel(row.quantity) : quantityLabel(row.quantity)),
          },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => (
              <StatusBadge status={compOffTone(row.status)} label={compOffStatusLabel(row.status)} />
            ),
          },
          { id: 'wait', header: 'Waiting on', cell: (row) => waitingOnLabel(row) },
          { id: 'restore', header: 'Balance', cell: (row) => creditLabel(row) },
          {
            id: 'revoke',
            header: 'Revoke',
            cell: (row) =>
              row.status === 'PENDING' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  loading={cancelling}
                  onClick={() => {
                    void cancel(row.id)
                      .unwrap()
                      .then(() => toast.success('Request revoked.'))
                      .catch((cause) => toast.error(apiErrorMessage(cause, 'Unable to revoke request.')));
                  }}
                >
                  Revoke
                </Button>
              ) : (
                '—'
              ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No compensatory work requests"
        emptyDescription="Requests to work a holiday or week-off and earn COMP leave appear here."
      />
      <DataTable
        columns={[
          { id: 'leave', header: 'Leave day', cell: (row) => row.leaveDate },
          {
            id: 'type',
            header: 'Original leave',
            cell: (row) => row.leaveTypeCode ?? row.leaveTypeName ?? '—',
          },
          { id: 'qty', header: 'COMP used', cell: (row) => quantityLabel(row.quantity) },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => (
              <StatusBadge status={compOffTone(row.status)} label={compOffStatusLabel(row.status)} />
            ),
          },
          { id: 'balance', header: 'Balance', cell: (row) => adjustmentBalanceLabel(row) },
          {
            id: 'revoke',
            header: 'Revoke',
            cell: (row) =>
              row.status === 'PENDING' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  loading={cancellingAdjustment}
                  onClick={() => {
                    void cancelAdjustment(row.id)
                      .unwrap()
                      .then(() => toast.success('Adjustment revoked.'))
                      .catch((cause) => toast.error(apiErrorMessage(cause, 'Unable to revoke adjustment.')));
                  }}
                >
                  Revoke
                </Button>
              ) : (
                '—'
              ),
          },
        ]}
        rows={adjustments?.data ?? []}
        loading={loadingAdjustments}
        emptyTitle="No COMP leave adjustments"
        emptyDescription="Requests to cover a leave day already taken this month appear here."
      />
    </div>
  );
}
