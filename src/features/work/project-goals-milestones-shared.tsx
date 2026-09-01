'use client';

import { StatusBadge } from '@/components/dashboard/status-badge';
import type { MilestoneStatus, ProjectMilestone } from '@/types/api';

export function milestoneStatusLabel(status: MilestoneStatus): string {
  switch (status) {
    case 'UPCOMING':
      return 'Upcoming';
    case 'ACTIVE':
      return 'Active';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

export function milestoneStatusTone(status: MilestoneStatus): 'approved' | 'pending' | 'rejected' {
  if (status === 'ACTIVE' || status === 'COMPLETED') return 'approved';
  if (status === 'CANCELLED') return 'rejected';
  return 'pending';
}

export function MilestoneStatusChip({ status }: { status: MilestoneStatus }) {
  return <StatusBadge status={milestoneStatusTone(status)} label={milestoneStatusLabel(status)} />;
}

export function formatMilestoneDates(milestone: Pick<ProjectMilestone, 'startDate' | 'targetDate'>): string {
  const parts: string[] = [];
  if (milestone.startDate) parts.push(`from ${milestone.startDate}`);
  if (milestone.targetDate) parts.push(`target ${milestone.targetDate}`);
  return parts.join(' · ') || 'No dates set';
}

export const selectClass =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none focus:border-foreground';
