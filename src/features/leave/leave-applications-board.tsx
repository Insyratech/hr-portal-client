'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { useGetLeaveApplicationsQuery } from '@/store/api/api';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;

function tone(status: string): 'pending' | 'approved' | 'rejected' {
  if (status === 'APPROVED') return 'approved';
  if (status === 'REJECTED' || status === 'CANCELLED') return 'rejected';
  return 'pending';
}

function LeaveApplicationsBoardBody({ kicker, reviewBase }: { kicker: string; reviewBase: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusId = searchParams.get('applicationId');
  const statusParam = searchParams.get('status');
  const status = STATUSES.includes(statusParam as (typeof STATUSES)[number])
    ? (statusParam as (typeof STATUSES)[number])
    : 'PENDING';
  const { data, isLoading } = useGetLeaveApplicationsQuery({ status });
  const rows = data?.data ?? [];

  useEffect(() => {
    if (!focusId) return;
    router.replace(`${reviewBase}/${focusId}`);
  }, [focusId, reviewBase, router]);

  return (
    <>
      <PageHeader kicker={kicker} title="Applications" />
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
          { id: 'type', header: 'Type', cell: (row) => row.leaveTypeCode ?? '—' },
          { id: 'dates', header: 'Dates', cell: (row) => `${row.startDate} – ${row.endDate}` },
          { id: 'qty', header: 'Days', cell: (row) => row.quantity },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={tone(row.status)} label={row.status} />,
          },
          {
            id: 'review',
            header: 'Review',
            cell: (row) => (
              <Button asChild size="sm" variant="outline">
                <Link href={`${reviewBase}/${row.id}`}>Review</Link>
              </Button>
            ),
          },
        ]}
        rows={rows}
        emptyTitle={isLoading ? 'Loading' : 'No applications'}
        emptyDescription="Leave applications for this status will appear here."
      />
    </>
  );
}

export function LeaveApplicationsBoard({ kicker, reviewBase }: { kicker: string; reviewBase: string }) {
  return (
    <Suspense>
      <LeaveApplicationsBoardBody kicker={kicker} reviewBase={reviewBase} />
    </Suspense>
  );
}
