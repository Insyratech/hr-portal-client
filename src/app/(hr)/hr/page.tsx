'use client';

import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/layout/page-header';
import { LeavePresenceBoard } from '@/features/leave/leave-presence-board';
import { useGetGrievanceCountsQuery, useGetLeaveApplicationsQuery } from '@/store/api/api';

export default function HrOverviewPage() {
  const router = useRouter();
  const { data: applications } = useGetLeaveApplicationsQuery();
  const { data: grievanceCounts } = useGetGrievanceCountsQuery();
  const pendingLeaveCount = (applications?.data ?? []).filter((row) => row.status === 'PENDING').length;
  const openGrievances = grievanceCounts?.data.byStatus?.OPEN ?? 0;

  return (
    <>
      <PageHeader kicker="HR Manager" title="Overview" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Approve leave and permissions, manage organization and leave setup, and oversee employees.
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <StatCard
          value={String(pendingLeaveCount)}
          label="Leave to review"
          icon="leave"
          onClick={() => router.push('/hr/leaves')}
        />
        <StatCard
          value={String(openGrievances)}
          label="Open grievances"
          icon="shield"
          onClick={() => router.push('/hr/grievances')}
        />
        <StatCard value="Queue" label="Permissions" icon="clock" onClick={() => router.push('/hr/permissions')} />
        <StatCard value="Org" label="Employees" icon="users" onClick={() => router.push('/hr/employees')} />
      </div>
      <LeavePresenceBoard items={applications?.data ?? []} reviewBase="/hr/leaves" />
    </>
  );
}
