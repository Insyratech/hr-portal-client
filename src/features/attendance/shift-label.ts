import type { Shift } from '@/types/api';

export function formatShiftHours(minutes: number): string {
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${(minutes / 60).toFixed(1)}h`;
}

function formatShiftClock(value: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return value.slice(0, 5);
  const hours = Number(match[1]);
  const minutes = match[2];
  const suffix = hours < 12 ? 'am' : 'pm';
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${minutes} ${suffix}`;
}

/** How a shift appears in lists and dropdowns. */
export function formatShiftSummary(shift: Pick<Shift, 'flexible' | 'minimumDurationMinutes' | 'startTime' | 'endTime'>): string {
  if (shift.flexible) {
    return `${formatShiftHours(shift.minimumDurationMinutes)} required · any start time`;
  }
  return `${formatShiftClock(shift.startTime)} – ${formatShiftClock(shift.endTime)}`;
}

export function formatShiftOption(shift: Pick<Shift, 'name' | 'flexible' | 'minimumDurationMinutes' | 'startTime' | 'endTime'>): string {
  return `${shift.name} (${formatShiftSummary(shift)})`;
}
