/** Mirrors Backend shift-change date rules — keep in sync with leave booking window. */

import {
  latestBookableLeaveStartDate,
  leaveBookingWindowHint,
} from '@/lib/leave-booking-window';

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

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function earliestShiftChangeStartDate(now = new Date()): string {
  return formatIsoDate(addUtcDays(utcToday(now), 1));
}

export function latestShiftChangeEndDate(now = new Date()): string {
  return latestBookableLeaveStartDate(now);
}

export function shiftChangeBookingHint(now = new Date()): string {
  const earliest = earliestShiftChangeStartDate(now);
  const latest = latestShiftChangeEndDate(now);
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(parseIsoDate(iso));
  return `Request at least 1 day ahead, up to 1 month ahead (${fmt(earliest)} – ${fmt(latest)}). Single day or a short date range.`;
}

export function shiftChangeWindowError(startDate: string, endDate: string, now = new Date()): string | null {
  const earliest = earliestShiftChangeStartDate(now);
  const latest = latestShiftChangeEndDate(now);
  if (!startDate || !endDate) return 'Pick start and end dates.';
  if (endDate < startDate) return 'End date cannot be before start date.';
  if (startDate < earliest) {
    return 'Shift changes must be requested at least 1 day in advance. Pick a future date starting tomorrow.';
  }
  if (startDate > latest || endDate > latest) {
    return leaveBookingWindowHint(now).replace(/^You can apply for leave/, 'Shift changes can only go');
  }
  return null;
}
