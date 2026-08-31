'use client';

import Link from 'next/link';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useIsProjectLead } from '@/features/work/project-lead';

/** Compact lead-project list for the employee dashboard. */
export function DashboardMyProjectsCard() {
  const { projects, isLoading } = useIsProjectLead();

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (projects.length === 0) return null;

  return (
    <section className="border border-border bg-background p-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-end gap-3">
        <Link href="/work/projects" className="text-sm text-muted hover:text-foreground">
          Project desk
        </Link>
        <Link href="/work/priorities/review" className="text-sm text-muted hover:text-foreground">
          Team priorities
        </Link>
      </div>
      <Meta className="mt-3">My project</Meta>
      <p className="mt-2 text-sm text-muted">
        Projects you lead. Open a desk for members, status updates, and this week’s work.
      </p>
      <ul className="mt-4 space-y-2">
        {projects.slice(0, 4).map((project) => (
          <li key={project.id}>
            <Link
              href={`/work/projects/${project.id}`}
              className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2.5 text-sm transition-colors hover:bg-surface"
            >
              <span className="font-medium">
                {project.name}{' '}
                <span className="font-normal text-muted">({project.code})</span>
              </span>
              <span className="shrink-0 text-xs text-muted">
                {project.memberCount} member{project.memberCount === 1 ? '' : 's'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {projects.length > 4 ? (
        <p className="mt-3 text-sm text-muted">+{projects.length - 4} more on Project desk</p>
      ) : null}
      <div className="mt-4">
        <Button asChild type="button" size="sm" variant="outline">
          <Link href="/work/projects">Open Project desk</Link>
        </Button>
      </div>
    </section>
  );
}
