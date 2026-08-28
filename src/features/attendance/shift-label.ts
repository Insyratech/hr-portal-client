import type { Shift } from '@/types/api';

export function formatShiftHours(minutes: number): string {
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${(minutes / 60).toFixed(1)}h`;
}

/** How a shift appears in lists and dropdowns. */
export function formatShiftSummary(shift: Pick<Shift, 'flexible' | 'minimumDurationMinutes' | 'startTime' | 'endTime'>): string {
  if (shift.flexible) {
    return `${formatShiftHours(shift.minimumDurationMinutes)} required · any start time`;
  }
  return `${shift.startTime.slice(0, 5)}–${shift.endTime.slice(0, 5)}`;
}

export function formatShiftOption(shift: Pick<Shift, 'name' | 'flexible' | 'minimumDurationMinutes' | 'startTime' | 'endTime'>): string {
  return `${shift.name} (${formatShiftSummary(shift)})`;
}
