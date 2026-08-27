'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { ProjectStatusUpdatesSection } from '@/features/work/project-status-updates';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useCreateProjectStatusUpdateMutation,
  useGetLeadProjectDeskQuery,
} from '@/store/api/api';

const APPROVAL_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Awaiting CSO',
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

function entryLabel(category: string): string {
  if (category === 'UNPLANNED') return 'Unplanned';
  if (category === 'SKILL') return 'Skill';
  return 'Planned';
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

  if (isLoading) {
    return <p className="text-sm text-muted">Loading project desk…</p>;
  }

  if (forbidden || isError || !desk) {
    return (
      <div className="space-y-4">
        <PageHeader kicker="Work" title="Project desk" />
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

  const { project, week, updates, priorities, dailyEntries } = desk;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageHeader kicker="Project lead" title={project.name} />
          <p className="mt-2 text-sm text-muted">
            {project.code} · Lead · {project.leadName}
          </p>
        </div>
        <Button asChild type="button" variant="outline" size="sm">
          <Link href="/work/projects">All my projects</Link>
        </Button>
      </div>

      <ProjectStatusUpdatesSection
        updates={updates}
        canPost
        draft={draft}
        onDraftChange={setDraft}
        onSubmit={() => void onPostUpdate()}
        submitting={createState.isLoading}
      />

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

      <section className="space-y-3">
        <Meta>Weekly priorities · this project</Meta>
        <p className="text-sm text-muted">Read-only. CSO approves submissions.</p>
        {priorities.length === 0 ? (
          <p className="text-sm text-muted">No project priorities for this week yet.</p>
        ) : (
          <div className="space-y-2">
            {priorities.map((item) => (
              <article
                key={item.id}
                className="rounded border border-border bg-background px-4 py-3 shadow-card"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{item.title}</p>
                  <div className="flex flex-wrap gap-2">
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
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <Meta>Daily work · this project</Meta>
        <p className="text-sm text-muted">Entries members logged against this project this week.</p>
        {dailyEntries.length === 0 ? (
          <p className="text-sm text-muted">No daily notes for this project in the selected week.</p>
        ) : (
          <ul className="space-y-2">
            {dailyEntries.map((entry) => (
              <li key={entry.id} className="rounded border border-border bg-background px-4 py-3 text-sm shadow-card">
                <p className="font-medium">
                  {entry.date} · {entry.employeeName}
                </p>
                <p className="mt-1 text-muted">
                  {entryLabel(entry.category)} · {entry.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
