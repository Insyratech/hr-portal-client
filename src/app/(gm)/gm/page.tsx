'use client';

import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/layout/page-header';
import { LeavePresenceBoard } from '@/features/leave/leave-presence-board';
import {
  useGetAttendanceImportsQuery,
  useGetLeaveApplicationsQuery,
  useGetPayrollRunsQuery,
  useGetReportsOverviewQuery,
} from '@/store/api/api';

export default function GmOverviewPage() {
  const router = useRouter();
  const { data: imports } = useGetAttendanceImportsQuery();
  const { data: payrollRuns } = useGetPayrollRunsQuery();
  const { data: reports } = useGetReportsOverviewQuery();
  const { data: applications } = useGetLeaveApplicationsQuery();

  return (
    <>
      <PageHeader kicker="General Manager" title="Overview" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Upload attendance, run payroll, see who is out, and open weekly PPT packages shared by CSO. Leave
        approval is handled by HR Manager.
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6 lg:gap-6">
        <StatCard
          value={String(imports?.data.length ?? 0)}
          label="Attendance imports"
          icon="clock"
          onClick={() => router.push('/gm/attendance')}
        />
        <StatCard
          value={String(payrollRuns?.data.length ?? 0)}
          label="Payroll runs"
          icon="grid"
          onClick={() => router.push('/gm/payroll')}
        />
        <StatCard
          value={String(reports?.data.attendance.lop ?? 0)}
          label="This month LOP"
          icon="grid"
          onClick={() => router.push('/gm/reports')}
        />
        <StatCard
          value="View"
          label="Who’s out"
          icon="leave"
          onClick={() => router.push('/gm/leave-status')}
        />
        <StatCard
          value="View"
          label="Shift changes"
          icon="clock"
          onClick={() => router.push('/gm/shift-changes')}
        />
        <StatCard
          value="PPT"
          label="Shared weekly updates"
          icon="file"
          onClick={() => router.push('/gm/weekly-updates')}
        />
      </div>
      <LeavePresenceBoard items={applications?.data ?? []} reviewBase="/gm/leave-status" linkReviews={false} />
    </>
  );
}
