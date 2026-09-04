'use client';

import { PageLoading } from '@/components/ui/page-loading';
import { useGetProjectPlanQuery } from '@/store/api/api';
import { MilestoneDescriptionSnippet } from '@/features/work/milestone-description';
import {
  formatMilestoneDates,
  MilestoneStatusChip,
} from '@/features/work/project-goals-milestones-shared';

export function ProjectGoalsMilestonesReadonly({ projectId }: { projectId: string }) {
  const { data, isLoading, isError } = useGetProjectPlanQuery(projectId);
  const goals = data?.data.goals ?? [];

  if (isLoading) return <PageLoading compact message="Loading goals…" />;
  if (isError) return <p className="text-sm text-muted">Could not load goals and milestones.</p>;
  if (goals.length === 0) {
    return <p className="text-sm text-muted">No goals yet. The project lead adds goals and milestones.</p>;
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <article key={goal.id} className="rounded border border-border bg-background p-4 shadow-card">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-medium text-foreground">{goal.name}</h3>
            {goal.isPrimary ? (
              <span className="text-xs uppercase tracking-[0.12em] text-meta" style={{ color: 'var(--meta)' }}>
                Primary goal
              </span>
            ) : null}
          </div>
          {goal.description ? <p className="mt-2 text-sm text-muted">{goal.description}</p> : null}
          {goal.milestones.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No milestones under this goal.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {goal.milestones.map((milestone) => (
                <li
                  key={milestone.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded border border-border px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{milestone.name}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatMilestoneDates(milestone)}</p>
                    <MilestoneDescriptionSnippet milestone={milestone} />
                  </div>
                  <MilestoneStatusChip status={milestone.status} />
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}
