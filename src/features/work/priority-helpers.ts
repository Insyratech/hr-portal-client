import type { WorkPriority, WorkRegularSubtype } from '@/types/api';

export const REGULAR_SUBTYPE_OPTIONS: { value: WorkRegularSubtype; label: string }[] = [
  { value: 'TESTING', label: 'Testing' },
  { value: 'PRODUCTION', label: 'Production' },
  { value: 'GENERAL_MANAGEMENT', label: 'General management' },
  { value: 'INVENTORY', label: 'Inventory' },
  { value: 'OTHER', label: 'Other' },
];

export const IMPORTANCE_OPTIONS: { value: WorkPriority['level']; label: string }[] = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export function regularSubtypeLabel(item: Pick<WorkPriority, 'regularSubtype' | 'regularSubtypeLabel'>): string | null {
  if (!item.regularSubtype) return null;
  if (item.regularSubtype === 'OTHER') return item.regularSubtypeLabel?.trim() || 'Other';
  return REGULAR_SUBTYPE_OPTIONS.find((row) => row.value === item.regularSubtype)?.label ?? item.regularSubtype;
}

export function priorityTypeLine(item: WorkPriority): string {
  if (item.type === 'PROJECT') {
    return item.projectCode ? `R&D · ${item.projectCode}` : 'R&D project';
  }
  if (item.type === 'SKILL') return 'Skill';
  const subtype = regularSubtypeLabel(item);
  return subtype ? `Regular · ${subtype}` : 'Regular work';
}

export function isPendingSubmit(item: WorkPriority): boolean {
  return (
    item.status !== 'CANCELLED' &&
    item.status !== 'CARRIED_FORWARD' &&
    (item.approvalStatus === 'DRAFT' || item.approvalStatus === 'RESUBMIT_REQUESTED')
  );
}

export function isWorkGoal(item: WorkPriority): boolean {
  return item.type === 'PROJECT' || item.type === 'REGULAR';
}
