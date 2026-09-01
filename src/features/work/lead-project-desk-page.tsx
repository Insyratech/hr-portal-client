'use client';

import Link from 'next/link';
import { PageLoading } from '@/components/ui/page-loading';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { ProjectGoalsMilestonesManage } from '@/features/work/project-goals-milestones-manage';
import { ProjectReportingChainSection } from '@/features/work/project-reporting-chain';
import { ProjectStatusUpdatesSection } from '@/features/work/project-status-updates';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useApproveWorkPriorityMutation,
  useCreateProjectStatusUpdateMutation,
  useGetLeadProjectDeskQuery,
  useRequestWorkPriorityResubmitMutation,
} from '@/store/api/api';

const APPROVAL_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Awaiting your review',
  APPROVED: 'Approved',
  RESUBMIT_REQUESTED: 'Needs resubmit',
};

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Done',
  PARTIALLY_COMPLETED: 'Partly done',
  BLOCKED: 'Blocked',
  CANCELLED: 'Cancelled',
  CARRIED_FORWARD: 'Carried forward',
};

function approvalTone(status: string): 'approved' | 'pending' | 'rejected' {
  if (status === 'APPROVED') return 'approved';
  if (status === 'RESUBMIT_REQUESTED') return 'rejected';
  return 'pending';
}

function statusTone(status: string): 'approved' | 'pending' | 'rejected' {
  if (status === 'COMPLETED') return 'approved';
  if (status === 'CANCELLED' || status === 'BLOCKED') return 'rejected';
  return 'pending';
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function LeadProjectDeskPage({ projectId }: { projectId: string }) {
  const toast = useToast();
  const [weekDate, setWeekDate] = useState(todayIso);
  const [draft, setDraft] = useState('');
  const { data, isLoading, isError, error, refetch } = useGetLeadProjectDeskQuery({
    projectId,
    date: weekDate,
  });
  const [createUpdate, createState] = useCreateProjectStatusUpdateMutation();
  const [approveOne, approveState] = useApproveWorkPriorityMutation();
  const [requestResubmit, resubmitState] = useRequestWorkPriorityResubmitMutation();
  const [resubmitCommentById, setResubmitCommentById] = useState<Record<string, string>>({});
  const desk = data?.data;

  const forbidden = useMemo(() => {
    const err = error as { status?: number; data?: { message?: string } } | undefined;
    return err?.status === 403;
  }, [error]);

  async function onPostUpdate() {
    const body = draft.trim();
    if (!body) return;
    try {
      await createUpdate({ projectId, body }).unwrap();
      setDraft('');
      toast.success('Status update posted.');
      await refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not post the update.'));
    }
  }

  async function onApprove(priorityId: string) {
    try {
      await approveOne(priorityId).unwrap();
      toast.success('Priority approved.');
      await refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not approve.'));
    }
  }

  async function onRequestResubmit(priorityId: string) {
    const comment = (resubmitCommentById[priorityId] ?? '').trim();
    if (!comment) {
      toast.error('Add a short comment so the employee knows what to change.');
      return;
    }
    try {
      await requestResubmit({ id: priorityId, comment }).unwrap();
      toast.success('Employee was asked to resubmit.');
      setResubmitCommentById((prev) => ({ ...prev, [priorityId]: '' }));
      await refetch();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not request resubmit.'));
    }
  }

  if (isLoading) {
    return <PageLoading compact message="Loading project desk…" />;
  }

  if (forbidden || isError || !desk) {
    return (
      <div className="space-y-4">
        <PageHeader kicker="My project" title="Project desk" />
        <p className="text-sm text-muted">
          {forbidden
            ? 'Only the current lead of an active project can open this desk. If the lead changed or the project is inactive, open My projects again.'
            : 'Could not load this project desk.'}
        </p>
        <Button asChild type="button" variant="outline" size="sm">
          <Link href="/work/projects">Back to My projects</Link>
        </Button>
      </div>
    );
  }

  const { project, week, updates, prioritiesByMilestone, reportingChain } = desk;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageHeader kicker="My project" title={project.name} />
          <p className="mt-2 text-sm text-muted">
            {project.code} · Lead · {project.leadName}
          </p>
        </div>
        <Button asChild type="button" variant="outline" size="sm">
          <Link href="/work/projects">All my projects</Link>
        </Button>
      </div>

      <section className="rounded border border-border bg-background p-5 shadow-card">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="lead-desk-week">Week containing</Label>
            <Input
              id="lead-desk-week"
              type="date"
              value={weekDate}
              onChange={(event) => setWeekDate(event.target.value || todayIso())}
            />
          </div>
          <p className="text-sm text-muted">
            Showing <span className="text-foreground">{week.start}</span> →{' '}
            <span className="text-foreground">{week.end}</span>
          </p>
        </div>
      </section>

      <ProjectGoalsMilestonesManage projectId={projectId} />

      <section className="space-y-3">
        <Meta>Team priorities this week</Meta>
        <p className="text-sm text-muted">
          Approve or ask for a resubmit on submitted lines. For regular or skill priorities, use{' '}
          <Link href="/work/priorities/review" className="underline">
            Team priorities
          </Link>
          .
        </p>
        {prioritiesByMilestone.length === 0 ? (
          <p className="text-sm text-muted">No project priorities for this week yet.</p>
        ) : (
          <div className="space-y-6">
            {prioritiesByMilestone.map((group) => (
              <div key={group.milestoneId ?? 'none'} className="space-y-2">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">{group.milestoneName}</p>
                {group.items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded border border-border bg-background px-4 py-3 shadow-card"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.isAdditional ? (
                          <StatusBadge status="pending" label="Additional" />
                        ) : null}
                        <StatusBadge
                          status={approvalTone(item.approvalStatus)}
                          label={APPROVAL_LABEL[item.approvalStatus] ?? item.approvalStatus}
                        />
                        {item.approvalStatus === 'APPROVED' ? (
                          <StatusBadge
                            status={statusTone(item.status)}
                            label={STATUS_LABEL[item.status] ?? item.status}
                          />
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {item.employeeName} · {item.type}
                    </p>
                    {item.approvalStatus === 'SUBMITTED' ? (
                      <div className="mt-3 space-y-3 border-t border-border pt-3">
                        <Button
                          type="button"
                          size="sm"
                          disabled={approveState.isLoading}
                          onClick={() => void onApprove(item.id)}
                        >
                          Approve
                        </Button>
                        <div>
                          <Label htmlFor={`lead-resubmit-${item.id}`}>Ask for resubmit</Label>
                          <Input
                            id={`lead-resubmit-${item.id}`}
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
                  </article>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <ProjectReportingChainSection chain={reportingChain ?? []} />

      <ProjectStatusUpdatesSection
        updates={updates}
        canPost
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={() => void onPostUpdate()}
        submitting={createState.isLoading}
      />

      <section className="space-y-3">
        <Meta>Members · {project.memberCount}</Meta>
        <ul className="rounded border border-border bg-background p-4 text-sm shadow-card">
          {project.members.map((member) => (
            <li key={member.employeeId} className="flex justify-between gap-3 border-b border-border py-2 last:border-0">
              <span>{member.fullName}</span>
              {member.employeeId === project.leadEmployeeId ? (
                <span className="text-xs uppercase tracking-[0.12em] text-muted">Lead</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}
