'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LeaveJourney } from '@/components/leave/leave-journey';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { leaveJourneySteps } from '@/features/leave/leave-journey';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useApproveLeaveMutation,
  useGetLeaveApplicationQuery,
  useRejectLeaveMutation,
  useRequestLeaveChangesMutation,
} from '@/store/api/api';

function tone(status: string): 'pending' | 'approved' | 'rejected' {
  if (status === 'APPROVED') return 'approved';
  if (status === 'REJECTED' || status === 'CANCELLED') return 'rejected';
  return 'pending';
}

export function LeaveReviewPage({ listHref }: { listHref: string }) {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, isError, error } = useGetLeaveApplicationQuery(id);
  const [approveLeave, { isLoading: approving }] = useApproveLeaveMutation();
  const [rejectLeave, { isLoading: rejecting }] = useRejectLeaveMutation();
  const [requestChanges, { isLoading: requesting }] = useRequestLeaveChangesMutation();
  const [comment, setComment] = useState('');
  const toast = useToast();
  const row = data?.data;
  const busy = approving || rejecting || requesting;
  const pending = row?.status === 'PENDING';
  const canDecide = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.LEAVE_APPROVE),
  );
  const waitingHandover = Boolean(row?.handoverEmployeeId && !row.handoverAccepted);
  const waitingLead = Boolean(row?.hasProjectLeadStep && !row.projectLeadAccepted);
  const waitingPrior = waitingHandover || waitingLead;

  async function onApprove(): Promise<void> {
    try {
      await approveLeave({ id, comment: comment.trim() || undefined }).unwrap();
      setComment('');
      toast.success('Leave approved.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to approve this leave request.'));
    }
  }

  async function onDecline(): Promise<void> {
    try {
      await rejectLeave({ id, comment: comment.trim() || undefined }).unwrap();
      setComment('');
      toast.success('Leave declined.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to decline this leave request.'));
    }
  }

  async function onRequestChanges(): Promise<void> {
    if (!comment.trim()) {
      toast.warning('Describe the changes you need.');
      return;
    }
    try {
      await requestChanges({ id, comment: comment.trim() }).unwrap();
      setComment('');
      toast.success('The employee was asked to update this request.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to request changes.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Leave" title="Review leave" />
      <p className="mb-8">
        <Link href={listHref} className="text-sm text-muted hover:text-foreground">
          Back to applications
        </Link>
      </p>
      {isLoading ? <p className="text-sm text-muted">Loading leave request…</p> : null}
      {isError ? <StatusMessage tone="danger">{apiErrorMessage(error, 'Unable to load this leave request.')}</StatusMessage> : null}
      {row ? (
        <div className="max-w-2xl space-y-6 border border-border bg-background p-6 shadow-card">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Meta>Application</Meta>
            <StatusBadge status={tone(row.status)} label={row.status} />
          </div>
          <p className="text-sm font-medium">
            {row.employeeName ?? 'Employee'} · {row.leaveTypeName ?? row.leaveTypeCode} · {row.startDate} – {row.endDate}
          </p>
          <p className="text-sm text-muted">
            {row.quantity} day{row.quantity === 1 ? '' : 's'} · {row.duration === 'half' ? 'Half day' : 'Full day'}
          </p>
          {row.reason ? <p className="text-sm">{row.reason}</p> : null}
          {row.reviewerComment ? (
            <p className="text-sm">
              <span className="text-muted">Requested changes: </span>
              {row.reviewerComment}
            </p>
          ) : null}
          <p className="text-sm text-muted">
            Handover:{' '}
            {row.handoverEmployeeName
              ? `${row.handoverEmployeeName}${row.handoverAccepted ? ' · accepted' : ' · waiting'}`
              : 'Not required'}
          </p>
          <p className="text-sm text-muted">
            Project:{' '}
            {row.projectName
              ? `${row.projectName}${
                  row.hasProjectLeadStep
                    ? row.projectLeadAccepted
                      ? ' · lead approved'
                      : ' · waiting for lead'
                    : ''
                }`
              : 'Not linked'}
          </p>
          <LeaveJourney steps={leaveJourneySteps(row)} />
          {pending && waitingHandover && canDecide ? (
            <p className="text-sm text-muted">Waiting for handover acceptance before you can approve.</p>
          ) : null}
          {pending && !waitingHandover && waitingLead && canDecide ? (
            <p className="text-sm text-muted">Waiting for project-lead approval before you can approve.</p>
          ) : null}
          {pending && !canDecide ? (
            <p className="text-sm text-muted">
              HR Manager reviews leave. You can read this request, but you cannot approve or decline it.
            </p>
          ) : null}
          {pending && canDecide ? (
            <div>
              <Label htmlFor="review-comment">Comment</Label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground shadow-card outline-none placeholder:text-muted focus:border-foreground"
                placeholder="Optional for approve or decline. Required to ask for changes."
              />
            </div>
          ) : null}
          {pending && canDecide ? (
            <div className="flex flex-wrap gap-3">
              <Button type="button" disabled={busy || waitingPrior} onClick={() => void onApprove()}>
                {approving ? 'Approving' : 'Approve'}
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => void onDecline()}>
                {rejecting ? 'Declining' : 'Decline'}
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => void onRequestChanges()}>
                {requesting ? 'Sending' : 'Request changes'}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
