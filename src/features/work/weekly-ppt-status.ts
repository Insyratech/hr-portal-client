import type { StatusTone } from '@/components/dashboard/status-badge';
import type { WeeklyPptPersonStatus, WeeklyPptTiming } from '@/types/api';

/**
 * Shared wording for weekly PPT timing so the employee, CSO and GM screens never disagree.
 * A last-hour submission met the Sunday 23:59 deadline — it is flagged, not penalised.
 */
export function weeklyPptStatusLabel(status: WeeklyPptPersonStatus): string {
  switch (status) {
    case 'on_time':
      return 'On time';
    case 'last_hour':
      return 'Last hour submission';
    case 'late':
      return 'Late';
    case 'missing':
      return 'Missing';
    default:
      return 'Pending';
  }
}

export function weeklyPptStatusTone(status: WeeklyPptPersonStatus): StatusTone {
  switch (status) {
    case 'on_time':
      return 'approved';
    case 'late':
    case 'missing':
      return 'rejected';
    default:
      return 'pending';
  }
}

/** Short badge text for a submitted deck (never "missing" or "pending"). */
export function weeklyPptTimingLabel(timing: WeeklyPptTiming): string {
  return weeklyPptStatusLabel(timing);
}

export function weeklyPptTimingTone(timing: WeeklyPptTiming): StatusTone {
  return weeklyPptStatusTone(timing);
}
