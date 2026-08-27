'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useApproveWorkPriorityMutation,
  useCarryForwardWorkPriorityMutation,
  useCreateWorkPriorityMutation,
  useGetEmployeesQuery,
  useGetWorkWeekQuery,
  useRequestWorkPriorityResubmitMutation,
  useSubmitAllWorkPrioritiesMutation,
  useSubmitWorkPriorityMutation,
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
  SUBMITTED: 'Awaiting CSO',
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

function typeLabel(type: WorkPriority['type']): string {
  if (type === 'PROJECT') return 'Project';
  if (type === 'SKILL') return 'Skill';
  return 'Week goal';
}

function canEditContent(item: WorkPriority): boolean {
  return item.approvalStatus === 'DRAFT' || item.approvalStatus === 'RESUBMIT_REQUESTED';
}

function canEditExecution(item: WorkPriority): boolean {
  return item.approvalStatus === 'APPROVED';
}

export function MyWeekBoard({
  mode = 'self',
  fixedEmployeeId,
  showHeader = true,
  canApprove = false,
}: {
  /** self = employee plans own week; view = admin/CSO read (+ optional approve) */
  mode?: 'self' | 'view';
  fixedEmployeeId?: string;
  showHeader?: boolean;
  /** CSO only — Approve / Request resubmit on SUBMITTED lines */
  canApprove?: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const readOnly = mode === 'view';
  const employeeId = fixedEmployeeId ?? (readOnly ? (searchParams.get('employeeId') ?? '') : undefined);
  const skip = Boolean(readOnly && !employeeId);
  const { data: employeeData } = useGetEmployeesQuery(undefined, { skip: !readOnly || Boolean(fixedEmployeeId) });
  const { data, isLoading } = useGetWorkWeekQuery(employeeId ? { employeeId } : undefined, { skip });
  const [createPriority, createState] = useCreateWorkPriorityMutation();
  const [updatePriority] = useUpdateWorkPriorityMutation();
  const [carryForward] = useCarryForwardWorkPriorityMutation();
  const [submitOne, submitOneState] = useSubmitWorkPriorityMutation();
  const [submitAll, submitAllState] = useSubmitAllWorkPrioritiesMutation();
  const [approveOne, approveState] = useApproveWorkPriorityMutation();
  const [requestResubmit, resubmitState] = useRequestWorkPriorityResubmitMutation();

  const board = data?.data;
  const [goalType, setGoalType] = useState<'REGULAR' | 'PROJECT'>('REGULAR');
  const [projectId, setProjectId] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalLevel, setGoalLevel] = useState<WorkPriority['level']>('MEDIUM');
  const [skillTitle, setSkillTitle] = useState('');
  const [skillLevel, setSkillLevel] = useState<WorkPriority['level']>('MEDIUM');
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
  const pendingSubmit = useMemo(
    () =>
      (board?.priorities ?? []).filter(
        (item) =>
          item.status !== 'CANCELLED' &&
          item.status !== 'CARRIED_FORWARD' &&
          (item.approvalStatus === 'DRAFT' || item.approvalStatus === 'RESUBMIT_REQUESTED'),
      ),
    [board],
  );
  const count = board?.priorities.length ?? 0;
  const hint = useMemo(() => {
    if (!board) return null;
    if (board.overCap) return `There are ${count} items. Aim for 3–5 so the week stays focused.`;
    if (count === 0) return 'Add a few week goals, then one skill focus if you have time.';
    if (count >= board.softCap) return 'Five is a solid weekly maximum.';
    return null;
  }, [board, count]);

  async function onAddGoal(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await createPriority({
        type: goalType,
        projectId: goalType === 'PROJECT' ? projectId || null : null,
        title: goalTitle,
        level: goalLevel,
      }).unwrap();
      setGoalTitle('');
      if (result.data.warning) toast.warning(result.data.warning);
      else toast.success('Added as a draft. Submit for CSO approval when ready.');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not save this priority.'));
    }
  }

  async function onAddSkill(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await createPriority({
        type: 'SKILL',
        title: skillTitle,
        level: skillLevel,
      }).unwrap();
      setSkillTitle('');
      if (result.data.warning) toast.warning(result.data.warning);
      else toast.success('Skill plan added as a draft.');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not save this skill plan.'));
    }
  }

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

  async function onSubmitOne(id: string) {
    try {
      await submitOne(id).unwrap();
      toast.success('Sent to CSO for approval.');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not submit for approval.'));
    }
  }

  async function onSubmitAll() {
    try {
      const result = await submitAll().unwrap();
      toast.success(
        result.data.submitted.length === 1
          ? 'Sent 1 priority to CSO.'
          : `Sent ${result.data.submitted.length} priorities to CSO.`,
      );
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not submit priorities.'));
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
      <div className="space-y-4">
        {items.map((item) => {
          const lockedCarry = item.status === 'CARRIED_FORWARD';
          const editableContent = !readOnly && !lockedCarry && canEditContent(item);
          const editableExecution = !readOnly && !lockedCarry && canEditExecution(item);
          const showSubmit = editableContent;
          const showCsoActions = canApprove && item.approvalStatus === 'SUBMITTED';

          return (
            <article key={item.id} className="border border-border bg-background p-5 shadow-card">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={approvalTone(item.approvalStatus)} label={APPROVAL_LABEL[item.approvalStatus]} />
                  {item.approvalStatus === 'APPROVED' ? (
                    <StatusBadge status={statusTone(item.status)} label={STATUS_LABEL[item.status]} />
                  ) : null}
                </div>
              </div>
              <p className="mt-2 text-sm text-muted">
                {typeLabel(item.type)}
                {item.projectCode ? ` · ${item.projectCode}` : ''}
                {item.carriedFromId ? ' · Continued from last week' : ''}
              </p>
              {item.csoComment && item.approvalStatus === 'RESUBMIT_REQUESTED' ? (
                <p className="mt-3 rounded border border-border bg-surface px-3 py-2 text-sm">
                  <span className="text-muted">CSO comment: </span>
                  {item.csoComment}
                </p>
              ) : null}

              {showSubmit ? (
                <div className="mt-4">
                  <Button
                    type="button"
                    size="sm"
                    disabled={submitOneState.isLoading}
                    onClick={() => onSubmitOne(item.id)}
                  >
                    {item.approvalStatus === 'RESUBMIT_REQUESTED' ? 'Resubmit for approval' : 'Submit for approval'}
                  </Button>
                </div>
              ) : null}

              {editableExecution ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`status-${item.id}`}>Status</Label>
                    <select
                      id={`status-${item.id}`}
                      className={selectClass}
                      value={item.status}
                      onChange={(e) => onStatus(item.id, e.target.value as WorkPriority['status'])}
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
                        onChange={(e) => setReasonById((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      >
                        <option value="">Optional reason</option>
                        {REASONS.map((reason) => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </select>
                      {board?.week.isLastWorkingDay ? (
                        <p className="mt-2 text-xs text-muted">Last working day this week — a reason helps next week.</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {item.approvalStatus === 'SUBMITTED' && !readOnly ? (
                <p className="mt-3 text-sm text-muted">Waiting for CSO. You can edit again only if they ask for a resubmit.</p>
              ) : null}

              {showCsoActions ? (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" disabled={approveState.isLoading} onClick={() => onApprove(item.id)}>
                      Approve
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor={`resubmit-${item.id}`}>Ask for resubmit (comment required)</Label>
                    <Input
                      id={`resubmit-${item.id}`}
                      className="mt-1"
                      value={resubmitCommentById[item.id] ?? ''}
                      onChange={(e) => setResubmitCommentById((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="What should they change?"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      disabled={resubmitState.isLoading}
                      onClick={() => onRequestResubmit(item.id)}
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
      {isLoading ? <p className="text-sm text-muted">Loading this week…</p> : null}

      {board ? (
        <div id="week" className="space-y-8">
          <section className="border border-border bg-background p-5 shadow-card">
            <Meta>This week</Meta>
            <p className="mt-2 text-sm">
              {board.week.start} → {board.week.end}
            </p>
            <p className="mt-2 text-sm text-muted">
              {canApprove
                ? 'Approve each priority line, or ask for a resubmit with a short comment. Daily updates unlock only when every line is approved.'
                : readOnly
                  ? 'Employees set their own week goals. This view is read-only.'
                  : 'Add 3–5 week goals, then submit them for CSO approval. Today’s update opens only after every priority is approved. If you have not submitted yet, a reminder goes out Monday at 4:00 pm IST.'}
            </p>
            {hint && !readOnly ? <p className="mt-3 text-sm">{hint}</p> : null}
            {!readOnly && pendingSubmit.length > 0 ? (
              <div className="mt-4">
                <Button type="button" disabled={submitAllState.isLoading} onClick={onSubmitAll}>
                  {submitAllState.isLoading
                    ? 'Submitting…'
                    : `Submit ${pendingSubmit.length} for CSO approval`}
                </Button>
              </div>
            ) : null}
          </section>

          {!readOnly ? (
            <>
              <form onSubmit={onAddGoal} className="space-y-4 border border-border bg-background p-5 shadow-card">
                <Meta>Week goals</Meta>
                <p className="text-sm text-muted">What should get done this week (regular or project work).</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="goal-type">Type</Label>
                    <select
                      id="goal-type"
                      className={selectClass}
                      value={goalType}
                      onChange={(e) => setGoalType(e.target.value as 'REGULAR' | 'PROJECT')}
                    >
                      <option value="REGULAR">Regular work</option>
                      <option value="PROJECT">Project</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="goal-level">Importance</Label>
                    <select
                      id="goal-level"
                      className={selectClass}
                      value={goalLevel}
                      onChange={(e) => setGoalLevel(e.target.value as WorkPriority['level'])}
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>
                {goalType === 'PROJECT' ? (
                  <div>
                    <Label htmlFor="goal-project">Project</Label>
                    <select
                      id="goal-project"
                      className={selectClass}
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      required
                    >
                      <option value="">Pick a project</option>
                      {board.projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.code} · {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div>
                  <Label htmlFor="goal-title">What should get done?</Label>
                  <Input
                    id="goal-title"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="Short and specific"
                    required
                  />
                </div>
                <Button type="submit" disabled={createState.isLoading}>
                  Add goal
                </Button>
              </form>

              <form onSubmit={onAddSkill} className="space-y-4 border border-border bg-background p-5 shadow-card">
                <Meta>Skill development</Meta>
                <p className="text-sm text-muted">One skill focus for this week is enough.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="skill-title">Skill plan</Label>
                    <Input
                      id="skill-title"
                      value={skillTitle}
                      onChange={(e) => setSkillTitle(e.target.value)}
                      placeholder="e.g. Practice API design"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="skill-level">Importance</Label>
                    <select
                      id="skill-level"
                      className={selectClass}
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value as WorkPriority['level'])}
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" disabled={createState.isLoading}>
                  Add skill plan
                </Button>
              </form>
            </>
          ) : null}

          <section className="space-y-3">
            <Meta>Week goals</Meta>
            {renderList(goals, readOnly ? 'No week goals set.' : 'Nothing planned yet.')}
          </section>
          <section className="space-y-3">
            <Meta>Skill development</Meta>
            {renderList(skills, readOnly ? 'No skill plan set.' : 'No skill plan yet.')}
          </section>
        </div>
      ) : null}
    </>
  );
}
