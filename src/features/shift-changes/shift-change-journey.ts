import type { JourneyState, JourneyStep } from '@/features/leave/leave-journey';
import type { ShiftChangeRequest } from '@/types/api';

function finish(
  steps: JourneyStep[],
  reviewState: JourneyState,
  decisionLabel: string,
  decisionState: JourneyState,
): JourneyStep[] {
  steps.push({ key: 'review', label: 'Under review', state: reviewState });
  steps.push({ key: 'decision', label: decisionLabel, state: decisionState });
  return steps;
}

export function shiftChangeJourneySteps(row: ShiftChangeRequest): JourneyStep[] {
  const rejected = row.status === 'REJECTED';
  const cancelled = row.status === 'CANCELLED';
  const approved = row.status === 'APPROVED';
  const needsLead = row.projectLeadRequired;
  const steps: JourneyStep[] = [{ key: 'applied', label: 'Applied', state: 'done' }];

  if (needsLead) {
    if (row.projectLeadAccepted) {
      steps.push({ key: 'project-lead', label: 'Project lead', state: 'done' });
    } else if (rejected || cancelled) {
      steps.push({ key: 'project-lead', label: 'Project lead', state: 'failed' });
    } else {
      steps.push({ key: 'project-lead', label: 'Project lead', state: 'current' });
    }
  }

  const waitingLead = needsLead && !row.projectLeadAccepted;

  if (approved) {
    return finish(steps, 'done', 'Approved', 'done');
  }
  if (rejected) {
    return finish(steps, waitingLead ? 'todo' : 'failed', 'Rejected', 'failed');
  }
  if (cancelled) {
    return finish(steps, 'todo', 'Cancelled', 'failed');
  }
  return finish(steps, waitingLead ? 'todo' : 'current', 'Approved', 'todo');
}

export function shiftChangeDateLabel(row: Pick<ShiftChangeRequest, 'startDate' | 'endDate'>): string {
  return row.startDate === row.endDate ? row.startDate : `${row.startDate} → ${row.endDate}`;
}
