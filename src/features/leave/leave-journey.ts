import type { LeaveApplication } from '@/types/api';

export type JourneyState = 'done' | 'current' | 'todo' | 'failed';

export type JourneyStep = {
  key: string;
  label: string;
  state: JourneyState;
};

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

export function leaveJourneySteps(row: LeaveApplication): JourneyStep[] {
  const rejected = row.status === 'REJECTED';
  const cancelled = row.status === 'CANCELLED';
  const approved = row.status === 'APPROVED';
  const needsHandover = Boolean(row.handoverEmployeeId);
  const needsLead = Boolean(row.hasProjectLeadStep);
  const steps: JourneyStep[] = [];

  if (needsHandover) {
    if (row.handoverAccepted) {
      steps.push({ key: 'handover-review', label: 'Handover review', state: 'done' });
      steps.push({ key: 'handover-accepted', label: 'Handover accepted', state: 'done' });
    } else if (rejected || cancelled) {
      steps.push({ key: 'handover-review', label: 'Handover review', state: 'failed' });
      steps.push({ key: 'handover-accepted', label: 'Handover accepted', state: 'todo' });
    } else {
      steps.push({ key: 'handover-review', label: 'Handover review', state: 'current' });
      steps.push({ key: 'handover-accepted', label: 'Handover accepted', state: 'todo' });
    }
  } else {
    steps.push({ key: 'applied', label: 'Applied', state: 'done' });
  }

  const waitingHandover = needsHandover && !row.handoverAccepted;
  const waitingLead = needsLead && !row.projectLeadAccepted;

  if (needsLead) {
    if (row.projectLeadAccepted) {
      steps.push({ key: 'project-lead', label: 'Project lead', state: 'done' });
    } else if (rejected || cancelled) {
      steps.push({
        key: 'project-lead',
        label: 'Project lead',
        state: waitingHandover ? 'todo' : 'failed',
      });
    } else {
      steps.push({
        key: 'project-lead',
        label: 'Project lead',
        state: waitingHandover ? 'todo' : 'current',
      });
    }
  }

  const waitingPrior = waitingHandover || waitingLead;

  if (approved) {
    return finish(steps, 'done', 'Approved', 'done');
  }
  if (rejected) {
    return finish(steps, waitingPrior ? 'todo' : 'failed', 'Rejected', 'failed');
  }
  if (cancelled) {
    return finish(steps, 'todo', 'Cancelled', 'failed');
  }
  if (row.reviewerComment) {
    return finish(steps, 'current', 'Approved', 'todo');
  }
  return finish(steps, waitingPrior ? 'todo' : 'current', 'Approved', 'todo');
}
