/** Mirrors Backend/src/modules/leave/booking-window.ts — keep in sync. */

export const LEAVE_MAX_ADVANCE_MONTHS = 1;

function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function utcToday(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addUtcMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const result = new Date(Date.UTC(year, month + months, 1));
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export function latestBookableLeaveStartDate(now = new Date()): string {
  return formatIsoDate(addUtcMonths(utcToday(now), LEAVE_MAX_ADVANCE_MONTHS));
}

export function isLeaveStartWithinBookingWindow(startDate: string, now = new Date()): boolean {
  const start = parseIsoDate(startDate);
  const latest = parseIsoDate(latestBookableLeaveStartDate(now));
  if (Number.isNaN(start.getTime())) {
    return false;
  }
  return start.getTime() <= latest.getTime();
}

export function leaveBookingWindowHint(now = new Date()): string {
  const latest = latestBookableLeaveStartDate(now);
  const formatted = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseIsoDate(latest));
  return `You can apply for leave up to ${LEAVE_MAX_ADVANCE_MONTHS} month ahead (latest start date: ${formatted}).`;
}

export function leaveTooFarInAdvanceMessage(now = new Date()): string {
  const latest = latestBookableLeaveStartDate(now);
  const formatted = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseIsoDate(latest));
  return `Leave can only be applied up to ${LEAVE_MAX_ADVANCE_MONTHS} month in advance. The latest start date you can request today is ${formatted}.`;
}
