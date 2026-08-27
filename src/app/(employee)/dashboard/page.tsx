'use client';

import Link from 'next/link';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { QuickAction } from '@/components/dashboard/quick-action';
import { PageHeader } from '@/components/layout/page-header';
import { LeaveBalanceCard } from '@/components/leave/leave-balance-card';
import { LeaveJourney } from '@/components/leave/leave-journey';
import { leaveJourneySteps } from '@/features/leave/leave-journey';
import { HandoverReviewCard } from '@/features/leave/handover-review-card';
import { HandoversTakenList } from '@/features/leave/handovers-taken';
import { takenHandovers } from '@/features/leave/leave-presence';
import { Meta } from '@/components/layout/meta';
import { StatusBadge } from '@/components/dashboard/status-badge';
import {
  useGetAttendanceMeQuery,
  useGetGrievancesQuery,
  useGetLeaveApplicationsQuery,
  useGetLeaveBalancesQuery,
  useGetMeQuery,
  useGetMyPayslipsQuery,
  useGetMyWorkPermissionsQuery,
} from '@/store/api/api';
import { remainingInMonth, remainingText } from '@/features/work-permissions/format';
import { DashboardWorkCard } from '@/features/work/dashboard-work-card';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

const DASHBOARD_CODES = ['CL', 'SL', 'EL', 'ML'];

export default function EmployeeDashboardPage() {
  const name = useAppSelector((state) => state.auth.user?.name);
  const canApplyPermission = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.WORK_PERMISSION_APPLY),
  );
  const title = name ? `Good morning, ${name.split(' ')[0]}` : 'Good morning';
  const { data: balanceData } = useGetLeaveBalancesQuery();
  const { data: attendanceData } = useGetAttendanceMeQuery();
  const { data: me } = useGetMeQuery();
  const { data: applicationsData } = useGetLeaveApplicationsQuery();
  const { data: assignedGrievances } = useGetGrievancesQuery({ scope: 'assigned' });
  const { data: permissionData } = useGetMyWorkPermissionsQuery(undefined, { skip: !canApplyPermission });
  const { data: payslipData } = useGetMyPayslipsQuery();
  const latestSlip = payslipData?.data[0];

  const balances = (balanceData?.data ?? [])
    .filter((item) => DASHBOARD_CODES.includes(item.code))
    .map((item) => ({ code: item.code, days: item.available }));

  const myLeaves = (applicationsData?.data ?? []).filter(
    (row) => row.employeeId === me?.data.employeeId && (row.status === 'PENDING' || row.status === 'APPROVED'),
  );
  const handoverInbox = (applicationsData?.data ?? []).filter(
    (row) =>
      row.handoverEmployeeId === me?.data.employeeId &&
      !row.handoverAccepted &&
      row.status === 'PENDING',
  );
  const covering = takenHandovers(applicationsData?.data ?? [], me?.data.employeeId);
  const assignedCases = assignedGrievances?.data ?? [];
  const attendance = attendanceData?.data;

  const permissionRemaining = remainingText(
    remainingInMonth(permissionData?.data.items ?? [], new Date().toISOString().slice(0, 10), permissionData?.data.quotaMinutes),
    new Date().toISOString().slice(0, 10),
  );

  return (
    <>
      <PageHeader kicker="Dashboard" title={title} />
      <div className="space-y-8">
        <DashboardWorkCard />
        <section className="border border-border bg-background p-5 shadow-card">
          <Meta>This month</Meta>
          <p className="mt-2 text-sm">
            {attendance?.published
              ? `${attendance.monthLabel} attendance is available.`
              : (attendance?.message ?? 'This month is not published yet.')}
          </p>
          {canApplyPermission ? (
            <p className="mt-2 text-sm">
              <Link href="/permission" className="text-muted hover:text-foreground">
                {permissionRemaining}
              </Link>
            </p>
          ) : null}
          <p className="mt-2 text-sm">
            {latestSlip ? `${latestSlip.monthLabel} salary slip is ready.` : 'No salary slip yet.'}
          </p>
          <p className="mt-3 flex flex-wrap gap-4">
            <Link href="/work" className="text-sm text-muted hover:text-foreground">
              Today / my week
            </Link>
            <Link href="/attendance" className="text-sm text-muted hover:text-foreground">
              Attendance
            </Link>
            {latestSlip ? (
              <Link href={`/payslips/${latestSlip.id}`} className="text-sm text-muted hover:text-foreground">
                Open slip
              </Link>
            ) : (
              <Link href="/payslips" className="text-sm text-muted hover:text-foreground">
                Salary slips
              </Link>
            )}
          </p>
        </section>
        {assignedCases.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <Meta>Assigned grievances</Meta>
              <Link href={`/grievance?id=${assignedCases[0].id}`} className="text-sm text-muted hover:text-foreground">
                Open workspace
              </Link>
            </div>
            {assignedCases.map((row) => (
              <Link
                key={row.id}
                href={`/grievance?id=${row.id}`}
                className="block border border-border bg-background p-5 shadow-card hover:bg-surface"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{row.subject}</p>
                  <StatusBadge status={row.status === 'RESOLVED' || row.status === 'CLOSED' ? 'approved' : 'pending'} label={row.status} />
                </div>
                <p className="mt-2 text-sm text-muted">
                  {row.employeeName ?? 'Employee'} · {row.category}
                </p>
              </Link>
            ))}
          </section>
        ) : null}
        {handoverInbox.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <Meta>Handover requests</Meta>
              <Link href={`/leave/handover/${handoverInbox[0].id}`} className="text-sm text-muted hover:text-foreground">
                Review and accept
              </Link>
            </div>
            {handoverInbox.map((row) => (
              <HandoverReviewCard key={row.id} application={row} />
            ))}
          </section>
        ) : null}
        <HandoversTakenList items={covering} />
        {myLeaves.length > 0 ? (
          <section className="space-y-4">
            <Meta>Leave status</Meta>
            {myLeaves.map((row) => (
              <div key={row.id} className="border border-border bg-background p-5 shadow-card">
                <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">
                    {row.leaveTypeName ?? row.leaveTypeCode} · {row.startDate} – {row.endDate}
                  </p>
                  <StatusBadge
                    status={row.status === 'APPROVED' ? 'approved' : 'pending'}
                    label={row.status}
                  />
                </div>
                <LeaveJourney steps={leaveJourneySteps(row)} />
                {row.reviewerComment ? (
                  <p className="mt-4 text-sm">
                    <span className="text-muted">Requested changes: </span>
                    {row.reviewerComment}
                  </p>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}
        <LeaveBalanceCard items={balances} />
        <section>
          <Meta className="mb-4">Quick actions</Meta>
          <div className="flex flex-wrap gap-3">
            <QuickAction href="/work" label="My week" />
            <QuickAction href="/leave?apply=1" label="Apply leave" />
            {canApplyPermission ? <QuickAction href="/permission?apply=1" label="Request permission" /> : null}
            <QuickAction href="/attendance" label="Attendance" />
            <QuickAction href="/payslips" label="Payslips" />
            <QuickAction href="/grievance" label="Grievance" />
            <QuickAction href="/policies" label="Policies" />
          </div>
        </section>
        <ActivityTimeline items={[]} />
      </div>
    </>
  );
}
