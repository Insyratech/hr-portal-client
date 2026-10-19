'use client';

import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { compOffStatusLabel, compOffTone, quantityLabel } from '@/features/comp-off-work/format';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import {
  useCancelCompOffWorkMutation,
  useGetMyCompOffWorkQuery,
} from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export function CompOffStatusList() {
  const canApply = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.COMP_OFF_APPLY),
  );
  const { data, isLoading } = useGetMyCompOffWorkQuery(undefined, { skip: !canApply });
  const [cancel, { isLoading: cancelling }] = useCancelCompOffWorkMutation();
  const toast = useToast();

  if (!canApply) return null;

  return (
    <DataTable
      columns={[
        { id: 'work', header: 'Work date', cell: (row) => row.workDate },
        { id: 'leave', header: 'Leave day', cell: (row) => row.leaveDate },
        {
          id: 'type',
          header: 'Leave',
          cell: (row) => row.leaveTypeCode ?? row.leaveTypeName ?? '—',
        },
        { id: 'qty', header: 'Offset', cell: (row) => quantityLabel(row.quantity) },
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
                : 'Compensated'
              : '—',
        },
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
      emptyDescription="Requests to offset leave by working a week-off or holiday appear here."
    />
  );
}
