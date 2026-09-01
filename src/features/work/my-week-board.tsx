'use client';

import { useMemo, useState } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { MyPrioritiesWizard } from '@/features/work/my-priorities-wizard';
import { priorityTypeLine } from '@/features/work/priority-helpers';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useApproveWorkPriorityMutation,
  useCarryForwardWorkPriorityMutation,
  useGetEmployeesQuery,
  useGetWorkWeekQuery,
  useRequestWorkPriorityResubmitMutation,
  useUpdateWorkPriorityMutation,
} from '@/store/api/api';
import type { WorkPriority, WorkPriorityApprovalStatus } from '@/types/api';

const selectClass =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none focus:border-foreground';

const STATUS_LABEL: Record<WorkPriority['status'], string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Done',
  PARTIALLY_COMPLETED: 'Partly done',
  BLOCKED: 'Blocked',
  CANCELLED: 'Cancelled',
  CARRIED_FORWARD: 'Carried forward',
};

const APPROVAL_LABEL: Record<WorkPriorityApprovalStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Awaiting project lead',
  APPROVED: 'Approved',
  RESUBMIT_REQUESTED: 'Needs resubmit',
};

const REASONS = [
  { value: 'DEPENDENCY', label: 'Waiting on someone else' },
  { value: 'APPROVAL', label: 'Waiting on approval' },
  { value: 'TECHNICAL', label: 'Technical blocker' },
  { value: 'PRIORITY_CHANGE', label: 'Priorities changed' },
  { value: 'TIME', label: 'Not enough time' },
  { value: 'URGENT_ASSIGNMENT', label: 'Urgent work came in' },
  { value: 'OTHER', label: 'Other' },
] as const;

function statusTone(status: WorkPriority['status']): 'approved' | 'pending' | 'rejected' {
  if (status === 'COMPLETED') return 'approved';
  if (status === 'CANCELLED' || status === 'BLOCKED') return 'rejected';
  return 'pending';
}

function approvalTone(status: WorkPriorityApprovalStatus): 'approved' | 'pending' | 'rejected' {
  if (status === 'APPROVED') return 'approved';
  if (status === 'RESUBMIT_REQUESTED') return 'rejected';
  return 'pending';
}

export function MyWeekBoard({
  mode = 'self',
  fixedEmployeeId,
  showHeader = true,
  canApprove = false,
  showWeekSummary = true,
  compact = false,
  weekDate,
}: {
  mode?: 'self' | 'view';
  fixedEmployeeId?: string;
  showHeader?: boolean;
  canApprove?: boolean;
  /** When false, skip the “This week” intro block (e.g. parent already shows week meta). */
  showWeekSummary?: boolean;
  /** Denser cards for HR/CSO read-only panels. */
  compact?: boolean;
  /** ISO date inside the planning week to load (HR/CSO week picker). */
  weekDate?: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const readOnly = mode === 'view';
  const employeeId = fixedEmployeeId ?? (readOnly ? (searchParams.get('employeeId') ?? '') : undefined);
  const skip = Boolean(readOnly && !employeeId);
  const { data: employeeData } = useGetEmployeesQuery(undefined, {
    skip: !readOnly || Boolean(fixedEmployeeId),
  });
  const weekQuery =
    employeeId || weekDate
      ? {
          ...(employeeId ? { employeeId } : {}),
          ...(weekDate ? { date: weekDate } : {}),
        }
      : undefined;
  const { data, isLoading } = useGetWorkWeekQuery(weekQuery, { skip });
  const [updatePriority] = useUpdateWorkPriorityMutation();
  const [carryForward] = useCarryForwardWorkPriorityMutation();
  const [approveOne, approveState] = useApproveWorkPriorityMutation();
  const [requestResubmit, resubmitState] = useRequestWorkPriorityResubmitMutation();

  const board = data?.data;
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [resubmitCommentById, setResubmitCommentById] = useState<Record<string, string>>({});

  const goals = useMemo(
    () => (board?.priorities ?? []).filter((item) => item.type !== 'SKILL'),
    [board],
  );
  const skills = useMemo(
    () => (board?.priorities ?? []).filter((item) => item.type === 'SKILL'),
    [board],
  );

  async function onStatus(id: string, status: WorkPriority['status']) {
    const incompleteReason = reasonById[id] || null;
    try {
      if (status === 'CARRIED_FORWARD') {
        await carryForward({ id, incompleteReason }).unwrap();
        toast.success('Moved to next week as a new draft.');
        return;
      }
      await updatePriority({ id, body: { status, incompleteReason } }).unwrap();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not update status.'));
    }
  }

  async function onApprove(id: string) {
    try {
      await approveOne(id).unwrap();
      toast.success('Priority approved.');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not approve.'));
    }
  }

  async function onRequestResubmit(id: string) {
    const comment = (resubmitCommentById[id] ?? '').trim();
    if (!comment) {
      toast.error('Add a short comment so the employee knows what to change.');
      return;
    }
    try {
      await requestResubmit({ id, comment }).unwrap();
      toast.success('Employee was asked to resubmit.');
      setResubmitCommentById((prev) => ({ ...prev, [id]: '' }));
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not request resubmit.'));
    }
  }

  function renderList(items: WorkPriority[], empty: string) {
    if (items.length === 0) return <p className="text-sm text-muted">{empty}</p>;
    return (
      <div className={compact ? 'space-y-2' : 'space-y-4'}>
        {items.map((item) => {
          const lockedCarry = item.status === 'CARRIED_FORWARD';
          const editableExecution = !readOnly && !lockedCarry && item.approvalStatus === 'APPROVED';
          const showApproverActions =
            canApprove && item.approvalStatus === 'SUBMITTED' && item.canApprove !== false;

          return (
            <article
              key={item.id}
              className={
                compact
                  ? 'rounded border border-border bg-background px-3 py-2.5 shadow-card'
                  : 'border border-border bg-background p-5 shadow-card'
              }
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                <div className="flex flex-wrap gap-2">
                  {item.isAdditional ? (
                    <StatusBadge status="pending" label="Mid-week add" />
                  ) : null}
                  <StatusBadge
                    status={approvalTone(item.approvalStatus)}
                    label={APPROVAL_LABEL[item.approvalStatus]}
                  />
                  {item.approvalStatus === 'APPROVED' ? (
                    <StatusBadge status={statusTone(item.status)} label={STATUS_LABEL[item.status]} />
                  ) : null}
                </div>
              </div>
              <p className={compact ? 'mt-1 text-xs text-muted' : 'mt-2 text-sm text-muted'}>
                {priorityTypeLine(item)}
                {item.carriedFromId ? ' · Continued from last week' : ''}
              </p>
              {item.csoComment && item.approvalStatus === 'RESUBMIT_REQUESTED' ? (
                <p className="mt-3 rounded border border-border bg-surface px-3 py-2 text-sm">
                  <span className="text-muted">Lead comment: </span>
                  {item.csoComment}
                </p>
              ) : null}

              {editableExecution ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`status-${item.id}`}>Status</Label>
                    <select
                      id={`status-${item.id}`}
                      className={selectClass}
                      value={item.status}
                      onChange={(event) => void onStatus(item.id, event.target.value as WorkPriority['status'])}
                    >
                      <option value="NOT_STARTED">Not started</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="COMPLETED">Done</option>
                      <option value="PARTIALLY_COMPLETED">Partly done</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="CARRIED_FORWARD">Carry to next week</option>
                    </select>
                  </div>
                  {item.status !== 'COMPLETED' && item.status !== 'CANCELLED' ? (
                    <div>
                      <Label htmlFor={`reason-${item.id}`}>If it will slip</Label>
                      <select
                        id={`reason-${item.id}`}
                        className={selectClass}
                        value={reasonById[item.id] ?? item.incompleteReason ?? ''}
                        onChange={(event) =>
                          setReasonById((prev) => ({ ...prev, [item.id]: event.target.value }))
                        }
                      >
                        <option value="">Optional reason</option>
                        {REASONS.map((reason) => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {item.approvalStatus === 'SUBMITTED' && !readOnly ? (
                <p className="mt-3 text-sm text-muted">
                  Waiting for your project lead. You can edit again only if they ask for a resubmit.
                </p>
              ) : null}

              {showApproverActions ? (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  <Button
                    type="button"
                    size="sm"
                    disabled={approveState.isLoading}
                    onClick={() => void onApprove(item.id)}
                  >
                    Approve
                  </Button>
                  <div>
                    <Label htmlFor={`resubmit-${item.id}`}>Ask for resubmit (comment required)</Label>
                    <Input
                      id={`resubmit-${item.id}`}
                      className="mt-1"
                      value={resubmitCommentById[item.id] ?? ''}
                      onChange={(event) =>
                        setResubmitCommentById((prev) => ({ ...prev, [item.id]: event.target.value }))
                      }
                      placeholder="What should they change?"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      disabled={resubmitState.isLoading}
                      onClick={() => void onRequestResubmit(item.id)}
                    >
                      Request resubmit
                    </Button>
                  </div>
                </div>
              ) : null}

              {lockedCarry ? (
                <p className="mt-3 text-sm text-muted">Kept for history. The new row is on next week’s plan.</p>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {showHeader && !readOnly ? <PageHeader kicker="Work" title="My priorities" /> : null}
      {readOnly && !fixedEmployeeId ? (
        <div className="mb-8 max-w-md">
          <Label htmlFor="work-employee">Employee</Label>
          <select
            id="work-employee"
            className={selectClass}
            value={employeeId ?? ''}
            onChange={(event) => {
              const next = event.target.value;
              router.replace(next ? `?employeeId=${next}` : window.location.pathname);
            }}
          >
            <option value="">Choose someone</option>
            {(employeeData?.data ?? []).map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {skip ? <p className="text-sm text-muted">Choose an employee to see their week.</p> : null}
      {isLoading ? <PageLoading compact message="Loading this week…" /> : null}

      {board && !readOnly ? <MyPrioritiesWizard board={board} /> : null}

      {board && readOnly ? (
        <div id="week" className={compact ? 'space-y-5' : 'space-y-8'}>
          {showWeekSummary ? (
            <section className="border border-border bg-background p-5 shadow-card">
              <Meta>This week</Meta>
              <p className="mt-2 text-sm">
                {board.week.start} → {board.week.end}
              </p>
              <p className="mt-2 text-sm text-muted">
                {canApprove
                  ? 'Approve each priority line, or ask for a resubmit with a short comment. Daily updates unlock only when every line is approved.'
                  : 'Employees set their own week goals. This view is read-only.'}
              </p>
            </section>
          ) : null}
          <section className={compact ? 'space-y-2' : 'space-y-3'}>
            <Meta>Weekly priorities</Meta>
            {renderList(goals, 'No week goals set.')}
          </section>
          <section className={compact ? 'space-y-2' : 'space-y-3'}>
            <Meta>Skill development</Meta>
            {renderList(skills, 'No skill plan set.')}
          </section>
        </div>
      ) : null}
    </>
  );
}
