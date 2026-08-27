import type { StatusTone } from '@/components/dashboard/status-badge';
import type { WorkPermission } from '@/types/api';

export const PERMISSION_QUOTA_MINUTES = 120;

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function monthLabel(isoDate: string): string {
  return new Date(`${monthKey(isoDate)}-01T00:00:00Z`).toLocaleString('en-GB', {
    month: 'long',
    timeZone: 'UTC',
  });
}

export function usedInMonth(items: WorkPermission[], isoDate: string): number {
  const key = monthKey(isoDate);
  return items
    .filter(
      (item) =>
        monthKey(item.permissionDate) === key && (item.status === 'PENDING' || item.status === 'APPROVED'),
    )
    .reduce((sum, item) => sum + item.minutes, 0);
}

export function remainingInMonth(items: WorkPermission[], isoDate: string, quota = PERMISSION_QUOTA_MINUTES): number {
  return Math.max(0, quota - usedInMonth(items, isoDate));
}

export function remainingText(remaining: number, isoDate: string): string {
  return `${remaining}m left in ${monthLabel(isoDate)}`;
}

export function hoursLabel(minutes: number): string {
  return minutes === 120 ? '2 hours' : '1 hour';
}

export function slotLabel(slot: WorkPermission['slot'] | undefined): string {
  return slot === 'END' ? 'End of shift' : 'Start of shift';
}

export function permissionTone(status: WorkPermission['status']): StatusTone {
  if (status === 'APPROVED') return 'approved';
  if (status === 'REJECTED') return 'rejected';
  return 'pending';
}
