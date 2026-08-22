'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { useGetLeaveApplicationsQuery, useGetGrievanceCountsQuery, useGetReportsOverviewQuery } from '@/store/api/api';
import { useAppDispatch } from '@/store/hooks';
import { openEntityDrawer } from '@/store/slices/ui-slice';

export default function AdminDashboardPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data: reportData } = useGetReportsOverviewQuery();
  const { data: leaveData } = useGetLeaveApplicationsQuery({ status: 'PENDING' });
  const { data: grievanceCounts } = useGetGrievanceCountsQuery();
  const report = reportData?.data;
  const pendingLeaves = (leaveData?.data ?? [])
    .filter((row) => row.status === 'PENDING')
    .slice(0, 10)
    .map((row) => ({
      id: row.id,
      employee: row.employeeName ?? 'Employee',
      type: row.leaveTypeName ?? 'Leave',
      date: `${row.startDate} → ${row.endDate}`,
      status: row.status,
    }));

  return (
    <>
      <PageHeader kicker="HR operations" title="Overview" />
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <StatCard
          value={String(report?.leave.pendingApprovals ?? 0)}
          label="Pending leaves"
          icon="leave"
        />
        <StatCard
          value={String((report?.attendance.missingPunches ?? 0) + (report?.attendance.absent ?? 0))}
          label="Attendance issues"
          icon="clock"
        />
        <StatCard
          value={String(grievanceCounts?.data.total ?? report?.grievances.open ?? 0)}
          label="Grievances"
          icon="shield"
          onClick={() => router.push('/admin/grievances')}
        />
        <StatCard
          value={String(report?.attendance.missingPunches ?? 0)}
          label="Missing punches"
          icon="calendar"
        />
      </div>
      <Meta className="mb-4">Grievances</Meta>
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-5 lg:gap-6">
        {(['OPEN', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] as const).map((status) => (
          <StatCard
            key={status}
            value={String(grievanceCounts?.data.byStatus[status] ?? 0)}
            label={status.replaceAll('_', ' ')}
            icon="shield"
            onClick={() => router.push(`/admin/grievances?status=${status}`)}
          />
        ))}
      </div>
      <Meta className="mb-4">Attendance this month</Meta>
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <StatCard value={String(report?.attendance.present ?? 0)} label="Present" icon="users" />
        <StatCard value={String(report?.attendance.late ?? 0)} label="Late" icon="clock" />
        <StatCard value={String(report?.attendance.absent ?? 0)} label="Absent" icon="audit" />
        <StatCard value={String(report?.attendance.onLeave ?? 0)} label="On leave" icon="leave" />
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-6">
          <StatusBadge status="pending" label="Pending" />
          <StatusBadge status="approved" label="Approved" />
          <StatusBadge status="rejected" label="Rejected" />
        </div>
        <Link href="/admin/reports" className="text-sm text-muted hover:text-foreground">
          Full reports →
        </Link>
      </div>
      <DataTable
        columns={[
          {
            id: 'employee',
            header: 'Employee',
            cell: (row) => (
              <button
                type="button"
                className="text-left hover:underline"
                onClick={() =>
                  dispatch(
                    openEntityDrawer({
                      title: `Leave · ${row.employee}`,
                      body: `${row.type} · ${row.date}`,
                      leaveId: row.id,
                      leaveStatus: row.status,
                    }),
                  )
                }
              >
                {row.employee}
              </button>
            ),
          },
          { id: 'type', header: 'Type', cell: (row) => row.type },
          { id: 'date', header: 'Date', cell: (row) => row.date },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status="pending" label={row.status} />,
          },
        ]}
        rows={pendingLeaves}
        emptyTitle="No pending approvals"
        emptyDescription="Leave requests awaiting review will appear in this table."
      />
    </>
  );
}
