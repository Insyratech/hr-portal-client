'use client';

import Link from 'next/link';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useMyProjects } from '@/features/work/my-projects';

/** Compact list of the employee's projects for the dashboard — led projects and read-only memberships. */
export function DashboardMyProjectsCard() {
  const { projects, isLoading, isProjectLead } = useMyProjects();

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (projects.length === 0) return null;

  return (
    <section className="border border-border bg-background p-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-end gap-3">
        <Link href="/work/projects" className="text-sm text-muted hover:text-foreground">
          {isProjectLead ? 'Project desk' : 'My projects'}
        </Link>
        {isProjectLead ? (
          <Link href="/work/priorities/review" className="text-sm text-muted hover:text-foreground">
            Team priorities
          </Link>
        ) : null}
      </div>
      <Meta className="mt-3" tone="orange">
        My project
      </Meta>
      <p className="mt-2 text-sm text-muted">
        {isProjectLead
          ? 'Projects you are part of. Open a desk you lead for members, status updates, and this week’s work.'
          : 'Projects you are part of. Open one to read its goals and milestones.'}
      </p>
      <ul className="mt-4 space-y-2">
        {projects.slice(0, 4).map((project) => (
          <li key={project.id}>
            <Link
              href={`/work/projects/${project.id}`}
              className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2.5 text-sm transition-colors hover:bg-surface"
            >
              <span className="font-medium">
                {project.name} <span className="font-normal text-muted">({project.code})</span>
              </span>
              <span className="shrink-0 text-xs text-muted">{project.isLead ? 'Lead' : 'Member'}</span>
            </Link>
          </li>
        ))}
      </ul>
      {projects.length > 4 ? (
        <p className="mt-3 text-sm text-muted">+{projects.length - 4} more on My projects</p>
      ) : null}
      <div className="mt-4">
        <Button asChild type="button" size="sm" variant="outline">
          <Link href="/work/projects">{isProjectLead ? 'Open Project desk' : 'Open My projects'}</Link>
        </Button>
      </div>
    </section>
  );
}
