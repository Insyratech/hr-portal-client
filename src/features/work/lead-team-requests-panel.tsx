'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/page-loading';
import { CompOffLeadReviewCard } from '@/features/comp-off-work/comp-off-lead-review-card';
import { ProjectLeadReviewCard } from '@/features/leave/project-lead-review-card';
import { ShiftChangeLeadReviewCard } from '@/features/shift-changes/shift-change-lead-review-card';
import { WorkDeskSection } from '@/features/work/work-desk-section';
import { useGetLeadPermissionsQuery } from '@/store/api/api';

export function LeadTeamRequestsPanel({
  projectId,
  variant = 'page',
}: {
  /** When set, only requests for this project are listed. */
  projectId?: string;
  variant?: 'page' | 'desk';
}) {
  const { data, isLoading, isError, isFetching, refetch } = useGetLeadPermissionsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const board = data?.data;
  const pendingLeaves = (board?.pendingLeaves ?? []).filter(
    (row) => !projectId || row.projectId === projectId,
  );
  const pendingShifts = (board?.pendingShiftChanges ?? []).filter(
    (row) => !projectId || row.projectId === projectId,
  );
  const pendingCompOff = (board?.pendingCompOffWork ?? []).filter(
    (row) => !projectId || row.projectId === projectId,
  );
  const pendingTotal = pendingLeaves.length + pendingShifts.length + pendingCompOff.length;
  const backHref = variant === 'desk' && projectId ? `/work/projects/${projectId}` : '/work/team-permissions';
  const backLabel = variant === 'desk' ? 'Stay on project desk' : 'Stay on Team requests';

  if (isLoading && !board) {
    return <PageLoading compact message="Loading team requests…" />;
  }

  if (isError || !board) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Unable to load team requests for your projects.</p>
        <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const list = (
    <div className="space-y-4">
      {pendingTotal === 0 ? (
        <p className="text-sm text-muted">
          {projectId
            ? 'No leave, shift-change, or compensatory-work requests waiting on you for this project.'
            : 'Nothing waiting for project-lead approval right now.'}
        </p>
      ) : (
        <>
          {pendingLeaves.map((row) => (
            <ProjectLeadReviewCard
              key={`leave-${row.id}`}
              application={row}
              backHref={backHref}
              backLabel={backLabel}
            />
          ))}
          {pendingShifts.map((row) => (
            <ShiftChangeLeadReviewCard
              key={`shift-${row.id}`}
              row={row}
              onDone={() => void refetch()}
            />
          ))}
          {pendingCompOff.map((row) => (
            <CompOffLeadReviewCard
              key={`comp-off-${row.id}`}
              row={row}
              onDone={() => void refetch()}
            />
          ))}
        </>
      )}
    </div>
  );

  if (variant === 'desk') {
    return (
      <WorkDeskSection
        title="Team requests"
        className="md:col-span-2 xl:col-span-3"
        description={
          <>
            Leave, shift changes, and compensatory work from this project that need your approval as project lead.
            {pendingTotal > 0 ? ` ${pendingTotal} waiting.` : ''}{' '}
            <Link href="/work/team-permissions" className="underline">
              All team requests
            </Link>
            {isFetching ? ' Refreshing…' : ''}
          </>
        }
      >
        {list}
      </WorkDeskSection>
    );
  }

  return list;
}
