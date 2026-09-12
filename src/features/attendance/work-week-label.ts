import type { WorkWeek } from '@/types/api';

export const WORK_WEEK_OPTIONS: readonly { value: WorkWeek['pattern']; label: string }[] = [
  { value: 'SUNDAY_OFF', label: 'Sunday off (works Saturday)' },
  { value: 'WEEKEND_OFF', label: 'Saturday and Sunday off' },
  { value: 'SECOND_FOURTH_SATURDAY', label: 'Sunday off, plus 2nd and 4th Saturday off' },
];

export function workWeekLabel(pattern: WorkWeek['pattern'] | string): string {
  return WORK_WEEK_OPTIONS.find((item) => item.value === pattern)?.label ?? pattern;
}
