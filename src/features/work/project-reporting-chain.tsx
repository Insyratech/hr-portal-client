'use client';

import { StatusBadge } from '@/components/dashboard/status-badge';
import { Meta } from '@/components/layout/meta';
import { MilestoneStatusChip } from '@/features/work/project-goals-milestones-shared';
import type { ProjectReportingGoal } from '@/types/api';

const APPROVAL_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Awaiting review',
  APPROVED: 'Approved',
  RESUBMIT_REQUESTED: 'Needs resubmit',
};

function entryLabel(category: string): string {
  if (category === 'PLANNED') return 'Planned';
  if (category === 'UNPLANNED') return 'Unplanned';
  return category;
}

export function ProjectReportingChain({ chain }: { chain: ProjectReportingGoal[] }) {
  if (chain.length === 0) {
    return <p className="text-sm text-muted">No goals yet. Add goals and milestones to see the reporting chain.</p>;
  }

  const hasActivity = chain.some((goal) =>
    goal.milestones.some((milestone) => milestone.employees.length > 0),
  );
  if (!hasActivity) {
    return (
      <p className="text-sm text-muted">
        Goals and milestones are set. Team priorities and daily notes will appear here once members start the week.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {chain.map((goal) => (
        <div key={goal.id} className="space-y-4">
          <p className="text-sm font-medium text-foreground">{goal.name}</p>
          {goal.milestones.map((milestone) => (
            <div key={milestone.id} className="rounded border border-border bg-background p-4 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{milestone.name}</p>
                <MilestoneStatusChip status={milestone.status} />
              </div>
              {milestone.employees.length === 0 ? (
                <p className="mt-2 text-sm text-muted">No priorities on this milestone this week.</p>
              ) : (
                <ul className="mt-3 space-y-4">
                  {milestone.employees.map((employee) => (
                    <li key={employee.employeeId} className="border-t border-border pt-3 first:border-0 first:pt-0">
                      <p className="text-sm font-medium">{employee.fullName}</p>
                      <ul className="mt-2 space-y-3">
                        {employee.priorities.map((priority) => (
                          <li key={priority.id} className="rounded border border-border px-3 py-2 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{priority.title}</span>
                              {priority.isAdditional ? (
                                <StatusBadge status="pending" label="Additional" />
                              ) : null}
                              <StatusBadge
                                status={
                                  priority.approvalStatus === 'APPROVED'
                                    ? 'approved'
                                    : priority.approvalStatus === 'SUBMITTED'
                                      ? 'pending'
                                      : 'rejected'
                                }
                                label={APPROVAL_LABEL[priority.approvalStatus] ?? priority.approvalStatus}
                              />
                            </div>
                            {priority.dailyEntries.length === 0 ? (
                              <p className="mt-1 text-xs text-muted">No daily notes linked yet.</p>
                            ) : (
                              <ul className="mt-2 space-y-1 text-xs text-muted">
                                {priority.dailyEntries.map((entry) => (
                                  <li key={entry.id}>
                                    {entry.date} · {entryLabel(entry.category)} · {entry.description}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProjectReportingChainSection({ chain }: { chain: ProjectReportingGoal[] }) {
  return (
    <section className="space-y-3">
      <Meta>Reporting chain</Meta>
      <p className="text-sm text-muted">
        Project → goal → milestone → employee → weekly priority → daily work for the selected week.
      </p>
      <ProjectReportingChain chain={chain} />
    </section>
  );
}
