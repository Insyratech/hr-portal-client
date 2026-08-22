'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { useGetGrievanceCountsQuery, useGetGrievancesQuery } from '@/store/api/api';
import { openEntityDrawer } from '@/store/slices/ui-slice';
import { useAppDispatch } from '@/store/hooks';

const STATUSES = ['OPEN', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] as const;

function tone(status: string): 'pending' | 'approved' | 'rejected' {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'approved';
  return 'pending';
}

function statusLabel(status: string): string {
  return status.replaceAll('_', ' ');
}

export function GrievancesQueuePage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const focusId = searchParams.get('id');
  const requested = searchParams.get('status');
  const initial =
    requested && STATUSES.includes(requested as (typeof STATUSES)[number]) ? requested : 'OPEN';
  const [status, setStatus] = useState<string>(initial);
  const { data, isLoading } = useGetGrievancesQuery({ status });
  const { data: countsData } = useGetGrievanceCountsQuery();
  const counts = countsData?.data.byStatus;

  useEffect(() => {
    if (requested && STATUSES.includes(requested as (typeof STATUSES)[number])) {
      setStatus(requested);
    }
  }, [requested]);

  useEffect(() => {
    if (!focusId) {
      return;
    }
    dispatch(
      openEntityDrawer({
        title: 'Grievance',
        body: '',
        grievanceId: focusId,
      }),
    );
  }, [dispatch, focusId]);

  return (
    <>
      <PageHeader kicker="Grievances" title="Queue" />
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUSES.map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={status === item ? 'primary' : 'outline'}
            onClick={() => setStatus(item)}
          >
            {statusLabel(item)} ({counts?.[item] ?? 0})
          </Button>
        ))}
      </div>
      <DataTable
        columns={[
          { id: 'employee', header: 'Employee', cell: (row) => row.employeeName ?? '—' },
          { id: 'subject', header: 'Subject', cell: (row) => row.subject },
          { id: 'category', header: 'Category', cell: (row) => row.category },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={tone(row.status)} label={row.status} />,
          },
          {
            id: 'review',
            header: 'Review',
            cell: (row) => (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  dispatch(
                    openEntityDrawer({
                      title: `${row.category} · ${row.status}`,
                      body: '',
                      grievanceId: row.id,
                    }),
                  )
                }
              >
                Open
              </Button>
            ),
          },
        ]}
        rows={data?.data ?? []}
        emptyTitle={isLoading ? 'Loading' : 'No grievances'}
        emptyDescription="Grievances for this status appear here."
      />
    </>
  );
}
