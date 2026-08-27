'use client';

import Link from 'next/link';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { useAcceptLeaveProjectLeadMutation, useGetMeQuery } from '@/store/api/api';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import type { LeaveApplication } from '@/types/api';

export function ProjectLeadReviewCard({
  application,
  highlight = false,
}: {
  application: LeaveApplication;
  highlight?: boolean;
}) {
  const { data: me } = useGetMeQuery();
  const [acceptLead, { isLoading }] = useAcceptLeaveProjectLeadMutation();
  const toast = useToast();
  const myId = me?.data.employeeId;
  const canApprove =
    application.projectLeadEmployeeId === myId &&
    application.hasProjectLeadStep &&
    !application.projectLeadAccepted &&
    application.handoverAccepted &&
    application.status === 'PENDING';

  return (
    <div className={`border bg-background p-5 shadow-card ${highlight ? 'border-foreground' : 'border-border'}`}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <Meta>Project lead approval</Meta>
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
        {application.quantity} day{application.quantity === 1 ? '' : 's'} ·{' '}
        {application.duration === 'half' ? 'Half day' : 'Full day'}
        {application.projectName ? ` · ${application.projectName}` : ''}
      </p>
      {application.reason ? <p className="mt-3 text-sm">{application.reason}</p> : null}
      <p className="mt-3 text-sm text-muted">
        {application.status === 'CANCELLED'
          ? 'This leave was cancelled.'
          : application.status === 'REJECTED'
            ? 'This leave was rejected.'
            : !application.handoverAccepted
              ? 'Waiting for handover acceptance first.'
              : application.projectLeadAccepted
                ? 'Project lead step completed'
                : canApprove
                  ? 'Waiting for you to approve as project lead'
                  : 'Waiting for project lead'}
      </p>
      {canApprove ? (
        <Button
          className="mt-4"
          type="button"
          disabled={isLoading}
          onClick={() => {
            void acceptLead(application.id)
              .unwrap()
              .then(() => toast.success('Project lead approval recorded.'))
              .catch((cause) => toast.error(apiErrorMessage(cause, 'Unable to approve as project lead.')));
          }}
        >
          {isLoading ? 'Approving…' : 'Approve as project lead'}
        </Button>
      ) : (
        <Link href="/leave" className="mt-4 inline-block text-sm text-muted hover:text-foreground">
          Back to leave
        </Link>
      )}
    </div>
  );
}
