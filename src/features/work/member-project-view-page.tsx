'use client';

import Link from 'next/link';
import { Meta } from '@/components/layout/meta';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/page-loading';
import { findMyProject, useMyProjects } from '@/features/work/my-projects';
import { ProjectGoalsMilestonesReadonly } from '@/features/work/project-goals-milestones-readonly';

/** Read-only project view for a member who is not the project lead. */
export function MemberProjectViewPage({ projectId }: { projectId: string }) {
  const { projects, isLoading, isError } = useMyProjects();
  const project = findMyProject(projects, projectId);

  if (isLoading) {
    return <PageLoading compact message="Loading project…" />;
  }

  if (isError || !project) {
    return (
      <div className="space-y-4">
        <PageHeader kicker="My project" title="Project not available" />
        <p className="max-w-xl text-sm text-muted">
          {isError
            ? 'Could not load your projects. Please try again.'
            : 'You are not part of this project, or it is no longer active.'}
        </p>
        <Button asChild type="button" variant="outline" size="sm">
          <Link href="/work/projects">Back to My projects</Link>
        </Button>
      </div>
    );
  }

  const { activeMilestone, milestoneSummary } = project;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <PageHeader kicker="My project" title={project.name} />
          <p className="mt-2 text-sm text-muted">
            {project.code} · Lead · {project.leadName ?? 'Not assigned'} · {project.memberCount} member
            {project.memberCount === 1 ? '' : 's'}
          </p>
        </div>
        <Button asChild type="button" variant="outline" size="sm">
          <Link href="/work/projects">All my projects</Link>
        </Button>
      </div>

      <p className="max-w-2xl text-sm text-muted">
        Read-only view. The project lead maintains the goals and milestones below. Pick this project on My
        priorities to plan your own work against the active milestone.
      </p>

      {activeMilestone ? (
        <section className="rounded border border-border bg-background p-5 shadow-card">
          <Meta>Active milestone</Meta>
          <p className="mt-2 text-lg font-medium text-foreground">{activeMilestone.name}</p>
          <p className="mt-1 text-sm text-muted">
            Goal: {activeMilestone.goalName || '—'}
            {activeMilestone.targetDate ? ` · target ${activeMilestone.targetDate}` : ''}
          </p>
          {milestoneSummary ? (
            <p className="mt-2 text-sm text-muted">
              This week: {milestoneSummary.initialCount} planned, {milestoneSummary.additionalCount} additional,{' '}
              {milestoneSummary.completedCount} completed.
            </p>
          ) : null}
        </section>
      ) : (
        <section className="rounded border border-dashed border-border bg-background p-5 shadow-card">
          <Meta>No active milestone</Meta>
          <p className="mt-2 text-sm text-muted">
            You cannot add R&amp;D priorities for this project until the project lead activates a milestone.
          </p>
        </section>
      )}

      <section className="space-y-3">
        <Meta>Goals and milestones</Meta>
        <ProjectGoalsMilestonesReadonly projectId={projectId} />
      </section>
    </div>
  );
}
