'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import {
  useApproveDirectoryEditRequestMutation,
  useFulfillDirectoryEditRequestMutation,
  useGetDirectoryEditRequestsQuery,
  useRejectDirectoryEditRequestMutation,
} from '@/store/api/api';
import type { DirectoryEditRequest, DirectoryEditRequestStatus } from '@/types/api';

const STATUSES: DirectoryEditRequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED'];

function tone(status: DirectoryEditRequestStatus): 'approved' | 'pending' | 'rejected' {
  if (status === 'APPROVED' || status === 'FULFILLED') return 'approved';
  if (status === 'PENDING') return 'pending';
  return 'rejected';
}

function EditRequestsBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const status = STATUSES.includes(statusParam as DirectoryEditRequestStatus)
    ? (statusParam as DirectoryEditRequestStatus)
    : 'PENDING';
  const { data, isLoading } = useGetDirectoryEditRequestsQuery({ status });
  const [approve, { isLoading: approving }] = useApproveDirectoryEditRequestMutation();
  const [reject, { isLoading: rejecting }] = useRejectDirectoryEditRequestMutation();
  const [fulfill, { isLoading: fulfilling }] = useFulfillDirectoryEditRequestMutation();
  const toast = useToast();
  const busy = approving || rejecting || fulfilling;

  async function onApprove(row: DirectoryEditRequest) {
    try {
      await approve({ id: row.id, body: { unlockHours: 72 } }).unwrap();
      toast.success(`${row.targetName} unlocked for 72 hours.`);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to approve request.'));
    }
  }

  async function onReject(row: DirectoryEditRequest) {
    try {
      await reject({ id: row.id, body: {} }).unwrap();
      toast.success('Request rejected.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to reject request.'));
    }
  }

  async function onFulfill(row: DirectoryEditRequest) {
    try {
      await fulfill(row.id).unwrap();
      toast.success('Unlock closed.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to close unlock.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Organization" title="Edit requests" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        HR asks to unlock one employee. Approve to edit only that person, save the changes, then mark done or wait for
        the unlock to expire.
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
          {
            id: 'employee',
            header: 'Employee',
            cell: (row) => (
              <Link className="underline-offset-2 hover:underline" href={`/super-admin/employees/${row.targetEmployeeId}`}>
                {row.targetName} ({row.targetCode})
              </Link>
            ),
          },
          { id: 'requester', header: 'Requested by', cell: (row) => row.requesterName },
          { id: 'reason', header: 'Reason', cell: (row) => row.reason },
          { id: 'hints', header: 'Hints', cell: (row) => row.fieldHints || '—' },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={tone(row.status)} label={row.status} />,
          },
          {
            id: 'until',
            header: 'Unlocked until',
            cell: (row) => (row.unlockedUntil ? new Date(row.unlockedUntil).toLocaleString() : '—'),
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (row) => {
              if (row.status === 'PENDING') {
                return (
                  <div className="flex gap-2">
                    <Button type="button" size="sm" disabled={busy} onClick={() => void onApprove(row)}>
                      Approve
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void onReject(row)}>
                      Reject
                    </Button>
                  </div>
                );
              }
              if (row.status === 'APPROVED') {
                return (
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" asChild>
                      <Link href={`/super-admin/employees/${row.targetEmployeeId}`}>Edit</Link>
                    </Button>
                    <Button type="button" size="sm" disabled={busy} onClick={() => void onFulfill(row)}>
                      Done
                    </Button>
                  </div>
                );
              }
              return '—';
            },
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No edit requests"
        emptyDescription="When HR requests a directory change, it appears here."
      />
    </>
  );
}

export function DirectoryEditRequestsQueue() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading</p>}>
      <EditRequestsBody />
    </Suspense>
  );
}
