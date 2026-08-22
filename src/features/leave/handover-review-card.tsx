'use client';

import Link from 'next/link';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { useAcceptLeaveHandoverMutation, useGetMeQuery } from '@/store/api/api';
import type { LeaveApplication } from '@/types/api';

export function HandoverReviewCard({
  application,
  highlight = false,
}: {
  application: LeaveApplication;
  highlight?: boolean;
}) {
  const { data: me } = useGetMeQuery();
  const [acceptHandover, { isLoading }] = useAcceptLeaveHandoverMutation();
  const myId = me?.data.employeeId;
  const canAccept =
    application.handoverEmployeeId === myId &&
    !application.handoverAccepted &&
    application.status === 'PENDING';

  return (
    <div className={`border bg-background p-5 shadow-card ${highlight ? 'border-foreground' : 'border-border'}`}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <Meta>Review and accept</Meta>
        <StatusBadge
          status={
            application.status === 'APPROVED'
              ? 'approved'
              : application.status === 'REJECTED' || application.status === 'CANCELLED'
                ? 'rejected'
                : 'pending'
          }
          label={application.status}
        />
      </div>
      <p className="text-sm font-medium">
        {application.employeeName ?? 'Colleague'} · {application.leaveTypeName ?? application.leaveTypeCode} ·{' '}
        {application.startDate} – {application.endDate}
      </p>
      <p className="mt-2 text-sm text-muted">
        {application.quantity} day{application.quantity === 1 ? '' : 's'} · {application.duration === 'half' ? 'Half day' : 'Full day'}
      </p>
      {application.reason ? <p className="mt-3 text-sm">{application.reason}</p> : null}
      <p className="mt-3 text-sm text-muted">
        {application.status === 'CANCELLED'
          ? 'This leave was cancelled.'
          : application.status === 'REJECTED'
            ? 'This leave was rejected.'
            : application.handoverAccepted
              ? `${application.handoverEmployeeName ?? 'Colleague'} accepted handover`
              : canAccept
                ? 'Waiting for you to accept'
                : `${application.handoverEmployeeName ?? 'Colleague'} · waiting`}
      </p>
      {canAccept ? (
        <Button className="mt-4" type="button" disabled={isLoading} onClick={() => void acceptHandover(application.id)}>
          {isLoading ? 'Accepting' : 'Accept handover'}
        </Button>
      ) : (
        <Link href="/leave" className="mt-4 inline-block text-sm text-muted hover:text-foreground">
          Back to leave
        </Link>
      )}
    </div>
  );
}
