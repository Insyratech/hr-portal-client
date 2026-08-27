'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Meta } from '@/components/layout/meta';
import { splitLeavePresence } from '@/features/leave/leave-presence';
import type { LeaveApplication } from '@/types/api';

function LeavePeopleTable({
  rows,
  reviewBase,
  linkReviews,
  emptyTitle,
  emptyDescription,
}: {
  rows: LeaveApplication[];
  reviewBase: string;
  linkReviews: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <DataTable
      columns={[
        {
          id: 'employee',
          header: 'Employee',
          cell: (row) =>
            linkReviews ? (
              <Link href={`${reviewBase}/${row.id}`} className="hover:underline">
                {row.employeeName ?? 'Employee'}
              </Link>
            ) : (
              <span>{row.employeeName ?? 'Employee'}</span>
            ),
        },
        { id: 'type', header: 'Type', cell: (row) => row.leaveTypeName ?? row.leaveTypeCode ?? '—' },
        { id: 'dates', header: 'Dates', cell: (row) => `${row.startDate} – ${row.endDate}` },
        {
          id: 'status',
          header: 'Status',
          cell: (row) => (
            <StatusBadge
              status={row.status === 'APPROVED' ? 'approved' : 'pending'}
              label={row.status}
            />
          ),
        },
      ]}
      rows={rows}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
    />
  );
}

export function LeavePresenceBoard({
  items,
  reviewBase,
  linkReviews = true,
}: {
  items: LeaveApplication[];
  reviewBase: string;
  /** When false, names are plain text (e.g. GM who’s-out view). */
  linkReviews?: boolean;
}) {
  const { onLeave, upcoming } = splitLeavePresence(items);

  return (
    <div className="mt-10 space-y-10">
      <div>
        <Meta className="mb-4">On leave today · {onLeave.length}</Meta>
        <LeavePeopleTable
          rows={onLeave}
          reviewBase={reviewBase}
          linkReviews={linkReviews}
          emptyTitle="Nobody on leave today"
          emptyDescription="Approved leave that covers today appears here."
        />
      </div>
      <div>
        <Meta className="mb-4">Upcoming leave · {upcoming.length}</Meta>
        <LeavePeopleTable
          rows={upcoming}
          reviewBase={reviewBase}
          linkReviews={linkReviews}
          emptyTitle="No upcoming leave"
          emptyDescription="Pending and approved leave that starts after today appears here."
        />
      </div>
    </div>
  );
}
