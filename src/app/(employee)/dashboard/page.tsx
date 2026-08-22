'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AttendanceCard } from '@/components/attendance/attendance-card';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { QuickAction } from '@/components/dashboard/quick-action';
import { PageHeader } from '@/components/layout/page-header';
import { LeaveBalanceCard } from '@/components/leave/leave-balance-card';
import { LeaveJourney } from '@/components/leave/leave-journey';
import { leaveJourneySteps } from '@/features/leave/leave-journey';
import { HandoverReviewCard } from '@/features/leave/handover-review-card';
import { Meta } from '@/components/layout/meta';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { StatusMessage } from '@/components/ui/status-message';
import { apiErrorMessage } from '@/lib/api-error';
import { formatClock, formatDuration } from '@/lib/attendance-format';
import {
  useGetAttendanceMeQuery,
  useGetLeaveApplicationsQuery,
  useGetLeaveBalancesQuery,
  useGetMeQuery,
  usePunchInMutation,
  usePunchOutMutation,
} from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';

const DASHBOARD_CODES = ['CL', 'SL', 'EL', 'ML'];

export default function EmployeeDashboardPage() {
  const name = useAppSelector((state) => state.auth.user?.name);
  const title = name ? `Good morning, ${name.split(' ')[0]}` : 'Good morning';
  const { data: balanceData } = useGetLeaveBalancesQuery();
  const { data: attendanceData } = useGetAttendanceMeQuery();
  const { data: me } = useGetMeQuery();
  const { data: applicationsData } = useGetLeaveApplicationsQuery();
  const [punchIn, { isLoading: punchingIn }] = usePunchInMutation();
  const [punchOut, { isLoading: punchingOut }] = usePunchOutMutation();
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const today = attendanceData?.data.today;
  const punchedIn = Boolean(today?.actualIn && !today?.actualOut);
  const punchedOut = Boolean(today?.actualIn && today?.actualOut);

  useEffect(() => {
    if (!punchedIn) return;
    const id = window.setInterval(() => setTick((value) => value + 1), 30_000);
    return () => window.clearInterval(id);
  }, [punchedIn]);

  const balances = (balanceData?.data ?? [])
    .filter((item) => DASHBOARD_CODES.includes(item.code))
    .map((item) => ({ code: item.code, days: item.available }));

  const liveDuration = punchedIn ? formatDuration(null, today?.actualIn) : null;
  void tick;

  const myLeaves = (applicationsData?.data ?? []).filter(
    (row) => row.employeeId === me?.data.employeeId && (row.status === 'PENDING' || row.status === 'APPROVED'),
  );
  const handoverInbox = (applicationsData?.data ?? []).filter(
    (row) =>
      row.handoverEmployeeId === me?.data.employeeId &&
      !row.handoverAccepted &&
      row.status === 'PENDING',
  );

  const durationLabel = punchedOut
    ? `Worked ${formatDuration(today?.workedMinutes) ?? '—'} · ${today?.status ?? ''}`
    : punchedIn
      ? `Work duration ${liveDuration ?? '—'}`
      : today?.status === 'LEAVE'
        ? 'On approved leave today'
        : today?.status === 'HOLIDAY' || today?.status === 'WEEK_OFF'
          ? today.status.replace('_', ' ')
          : null;

  async function onPunch(): Promise<void> {
    setError(null);
    try {
      if (punchedIn) await punchOut({}).unwrap();
      else await punchIn({}).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to punch.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Dashboard" title={title} />
      <div className="space-y-8">
        <AttendanceCard
          punchedIn={punchedIn || punchedOut}
          punchedAt={formatClock(today?.actualIn) ?? (punchedOut ? 'Completed' : null)}
          duration={durationLabel}
          onPunch={onPunch}
          disabled={punchingIn || punchingOut || punchedOut || today?.status === 'LEAVE'}
          actionLabel={punchedOut ? 'Done for today' : punchedIn ? 'Punch out' : 'Punch in'}
        />
        {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
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
            <QuickAction href="/leave" label="Apply leave" />
            <QuickAction href="/attendance" label="Attendance" />
            <QuickAction href="/grievance" label="Grievance" />
            <QuickAction href="/policies" label="Policies" />
          </div>
        </section>
        <ActivityTimeline items={[]} />
      </div>
    </>
  );
}
