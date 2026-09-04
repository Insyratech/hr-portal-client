'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Meta } from '@/components/layout/meta';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/page-loading';
import { ProjectLeadReviewCard } from '@/features/leave/project-lead-review-card';
import { ShiftChangeLeadReviewCard } from '@/features/shift-changes/shift-change-lead-review-card';
import { useGetLeadPermissionsQuery } from '@/store/api/api';

function historyTone(status: string): 'approved' | 'pending' | 'rejected' {
  const value = status.toUpperCase();
  if (value === 'APPROVED' || value === 'RESOLVED' || value === 'CLOSED') return 'approved';
  if (value === 'REJECTED' || value === 'CANCELLED') return 'rejected';
  return 'pending';
}

function kindLabel(kind: 'leave' | 'shift_change'): string {
  return kind === 'leave' ? 'Leave' : 'Shift change';
}

export function TeamPermissionsPage() {
  const { data, isLoading, isError, isFetching, refetch } = useGetLeadPermissionsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const board = data?.data;
  const pendingLeaves = board?.pendingLeaves ?? [];
  const pendingShifts = board?.pendingShiftChanges ?? [];
  const history = board?.history ?? [];
  const pendingTotal = pendingLeaves.length + pendingShifts.length;
  const prioritiesCount = board?.pendingPrioritiesCount ?? 0;

  if (isLoading && !board) {
    return <PageLoading compact message="Loading team permissions…" />;
  }

  if (isError || !board) {
    return (
      <div className="space-y-4">
        <PageHeader kicker="My project" title="Team permissions" />
        <p className="text-sm text-muted">Unable to load approvals for your projects. Try again.</p>
        <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <PageHeader kicker="My project" title="Team permissions" />
          <p className="mt-2 text-sm text-muted">
            Leave and shift-change requests that need your approval as project lead. History shows what you already
            approved.
            {isFetching ? ' Refreshing…' : ''}
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
          Refresh
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded border border-border bg-background p-3 shadow-card">
          <Meta>Waiting for you</Meta>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{pendingTotal}</p>
        </div>
        <div className="rounded border border-border bg-background p-3 shadow-card">
          <Meta>Leave</Meta>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{pendingLeaves.length}</p>
        </div>
        <div className="rounded border border-border bg-background p-3 shadow-card">
          <Meta>Shift changes</Meta>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{pendingShifts.length}</p>
        </div>
        <div className="rounded border border-border bg-background p-3 shadow-card">
          <Meta>Priorities to review</Meta>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{prioritiesCount}</p>
          {prioritiesCount > 0 ? (
            <Link href="/work/priorities/review" className="mt-2 inline-block text-sm text-muted hover:text-foreground">
              Open Team priorities
            </Link>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <Meta>Needs your approval</Meta>
          <p className="mt-1 text-sm text-muted">
            Approve here to send the request to HR. Weekly priorities stay under Team priorities.
          </p>
        </div>
        {pendingTotal === 0 ? (
          <p className="rounded border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Nothing waiting for project-lead approval right now.
          </p>
        ) : (
          <div className="space-y-4">
            {pendingLeaves.map((row) => (
              <ProjectLeadReviewCard
                key={`leave-${row.id}`}
                application={row}
                backHref="/work/team-permissions"
                backLabel="Stay on Team permissions"
              />
            ))}
            {pendingShifts.map((row) => (
              <ShiftChangeLeadReviewCard key={`shift-${row.id}`} row={row} onDone={() => void refetch()} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <Meta>Previous history</Meta>
          <p className="mt-1 text-sm text-muted">
            Leave and shift changes you approved as project lead (newest first).
          </p>
        </div>
        <DataTable
          columns={[
            {
              id: 'kind',
              header: 'Type',
              cell: (row) => kindLabel(row.kind),
            },
            { id: 'employee', header: 'Employee', cell: (row) => row.employeeName },
            {
              id: 'project',
              header: 'Project',
              cell: (row) => row.projectName ?? row.projectCode ?? '—',
            },
            { id: 'summary', header: 'Summary', cell: (row) => row.summary },
            {
              id: 'acted',
              header: 'You acted',
              cell: (row) => row.actedAt.slice(0, 10),
            },
            {
              id: 'status',
              header: 'Request status',
              cell: (row) => <StatusBadge status={historyTone(row.requestStatus)} label={row.requestStatus} />,
            },
          ]}
          rows={history}
          emptyTitle="No history yet"
          emptyDescription="After you approve leave or shift changes, they appear here."
        />
      </section>
    </div>
  );
}
