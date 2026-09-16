/** Mirrors Backend/src/modules/leave/notice-deadline.ts — keep in sync. */

const WORK_TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = (5 * 60 + 30) * 60_000;

/** Flexible shifts store 00:00–23:59; notice uses the earliest typical start. */
const FLEXIBLE_LEAVE_NOTICE_CLOCK = '08:00';

/** When no shift is assigned, treat the working day as starting at 09:00 IST. */
const UNASSIGNED_LEAVE_NOTICE_CLOCK = '09:00';

export type LeaveNoticeShift = {
  name: string;
  startTime: string | null;
  flexible: boolean;
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function normalizeClockHhmm(value: string): string | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

function formatClock12Hour(clockHhmm: string): string {
  const clock = normalizeClockHhmm(clockHhmm);
  if (!clock) return clockHhmm;
  const hours = Number(clock.slice(0, 2));
  const minutes = clock.slice(3, 5);
  const suffix = hours < 12 ? 'am' : 'pm';
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${minutes} ${suffix}`;
}

function noticeClockForShift(shift: LeaveNoticeShift | null | undefined): string {
  if (!shift) return UNASSIGNED_LEAVE_NOTICE_CLOCK;
  if (shift.flexible) return FLEXIBLE_LEAVE_NOTICE_CLOCK;
  const stored = shift.startTime ? normalizeClockHhmm(shift.startTime) : null;
  if (!stored || stored === '00:00') return UNASSIGNED_LEAVE_NOTICE_CLOCK;
  return stored;
}

function instantFromIstClock(isoDate: string, clockHhmm: string): Date {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  const clock = normalizeClockHhmm(clockHhmm);
  if (!dateMatch || !clock) return new Date(NaN);
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hours = Number(clock.slice(0, 2));
  const minutes = Number(clock.slice(3, 5));
  return new Date(Date.UTC(year, month - 1, day, hours, minutes) - IST_OFFSET_MS);
}

export function noticeHoursValue(notice: { value: number; unit: 'hours' | 'days' }): number {
  return notice.unit === 'days' ? notice.value * 24 : notice.value;
}

function leaveNoticeDeadline(input: {
  startDate: string;
  noticeHours: number;
  shift?: LeaveNoticeShift | null;
}): Date {
  const clock = noticeClockForShift(input.shift);
  const shiftStart = instantFromIstClock(input.startDate, clock);
  return new Date(shiftStart.getTime() - input.noticeHours * 3_600_000);
}

export function leaveNoticeMet(input: {
  startDate: string;
  now?: Date;
  noticeHours: number;
  shift?: LeaveNoticeShift | null;
}): boolean {
  if (input.noticeHours <= 0) return true;
  const deadline = leaveNoticeDeadline(input);
  if (Number.isNaN(deadline.getTime())) return true;
  return (input.now ?? new Date()).getTime() <= deadline.getTime();
}

function formatNoticeDuration(value: number, unit: 'hours' | 'days'): string {
  const singular = unit === 'hours' ? 'hour' : 'day';
  const plural = unit === 'hours' ? 'hours' : 'days';
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatIstDate(instant: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: WORK_TIMEZONE,
  }).format(instant);
}

function hourMinuteInIst(instant: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: WORK_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

function formatNoticeDeadlineLabel(deadline: Date): string {
  return `${formatClock12Hour(hourMinuteInIst(deadline))} on ${formatIstDate(deadline)}`;
}

export function assignmentOnDate<T extends { effectiveFrom: string; effectiveTo: string | null }>(
  history: T[],
  isoDate: string,
): T | null {
  const covering = history.filter(
    (row) => row.effectiveFrom <= isoDate && (!row.effectiveTo || row.effectiveTo >= isoDate),
  );
  covering.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  return covering[0] ?? null;
}

export function leaveNoticeHint(input: {
  noticePeriod: { value: number; unit: 'hours' | 'days' };
  startDate?: string;
  shift?: LeaveNoticeShift | null;
}): string | null {
  if (input.noticePeriod.value <= 0) return null;
  const duration = formatNoticeDuration(input.noticePeriod.value, input.noticePeriod.unit);
  const clock = noticeClockForShift(input.shift);
  const clockLabel = formatClock12Hour(clock);
  const shiftName = input.shift?.name ?? 'your shift';
  if (!input.startDate) {
    return `${duration} notice required before ${shiftName} starts (${clockLabel}).`;
  }
  const deadline = leaveNoticeDeadline({
    startDate: input.startDate,
    noticeHours: noticeHoursValue(input.noticePeriod),
    shift: input.shift,
  });
  return `${duration} notice before ${shiftName} (${clockLabel}). Apply by ${formatNoticeDeadlineLabel(deadline)}.`;
}

export function leaveNoticeTooLateMessage(input: {
  noticePeriod: { value: number; unit: 'hours' | 'days' };
  startDate: string;
  shift?: LeaveNoticeShift | null;
}): string {
  const duration = formatNoticeDuration(input.noticePeriod.value, input.noticePeriod.unit);
  const clock = noticeClockForShift(input.shift);
  const deadline = leaveNoticeDeadline({
    startDate: input.startDate,
    noticeHours: noticeHoursValue(input.noticePeriod),
    shift: input.shift,
  });
  const shiftPart = input.shift?.flexible
    ? `${input.shift.name} (${formatClock12Hour(clock)} typical start)`
    : input.shift
      ? `${input.shift.name} (${formatClock12Hour(clock)})`
      : `shift start (${formatClock12Hour(clock)})`;
  return `This leave requires ${duration} notice before your ${shiftPart}. Apply by ${formatNoticeDeadlineLabel(deadline)}.`;
}
