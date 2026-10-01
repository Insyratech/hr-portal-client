import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/attendance-format';
import type { AttendanceReviewDay } from '@/types/api';

/** Status label colors for attendance review cards. */
export function attendanceStatusClass(status: string): string {
  switch (status) {
    case 'PRESENT':
      return 'text-green-500';
    case 'LEAVE':
      return 'text-orange-500';
    case 'MISSING_PUNCH':
      return 'text-red-500';
    case 'HOLIDAY':
      return 'text-blue-500';
    case 'WEEK_OFF':
      return 'text-purple-500';
    case 'ABSENT':
      return 'text-pink-500';
    case 'LATE':
      return 'text-amber-500';
    case 'HALF_DAY':
      return 'text-amber-400';
    case 'NO_SHIFT':
      return 'text-muted';
    default:
      return 'text-foreground';
  }
}

/** Numeric LOP totals on the card header (proposed / final). */
export function attendanceLopAmountClass(amount: number): string {
  if (amount > 0) return 'text-red-500';
  return 'text-gray-200';
}

/**
 * Day LOP decision line:
 * - EXCLUDE → light olive
 * - LOP amount > 0 (or FULL/HALF) → red
 * - NO_LOP / zero → muted gray (not cyan)
 */
export function attendanceLopClass(day: AttendanceReviewDay): string {
  if (day.hrAction === 'EXCLUDE') return 'text-[#b4c48a]';
  const amount = day.hrAction ? (day.finalLop ?? 0) : (day.proposedLop ?? day.finalLop ?? 0);
  if (amount > 0 || day.hrAction === 'FULL_LOP' || day.hrAction === 'HALF_LOP') {
    return 'text-red-500';
  }
  return 'text-gray-200';
}

export function attendanceStatusMark(status: string): string {
  if (status === 'ABSENT' || status === 'MISSING_PUNCH') return '×';
  if (status === 'LATE' || status === 'HALF_DAY' || status === 'NO_SHIFT' || status === 'MISSING_PUNCH') return '○';
  return '●';
}

function workedHoursLine(day: AttendanceReviewDay, shiftName: string | null): string | null {
  if (day.workedMinutes == null) return null;
  const shift = day.shiftName ?? shiftName ?? 'hours required';
  const flexible =
    shift.toLowerCase().includes('flex') || shift.toLowerCase().includes('any start');
  return `Worked ${formatDuration(day.workedMinutes)} · ${
    flexible ? `flexible (any start time, ${shift})` : shift
  }`;
}

/**
 * Human detail under each day. Leave must win over skippedFromLop —
 * paid leave is skipped from LOP but is not a weekly off/holiday.
 * PRESENT and LATE show worked hours when punches allow; MISSING_PUNCH does not.
 */
export function attendanceDayDetail(day: AttendanceReviewDay, shiftName: string | null): string {
  if (day.status === 'LEAVE' || day.leaveTypeName) {
    const typeName = day.leaveTypeName ?? 'Leave';
    const paid = day.leavePaid ? 'paid' : 'unpaid';
    const duration = day.leaveDuration === 'half' ? ' · half' : '';
    return `${typeName} (${paid}${duration})`;
  }
  if (day.status === 'HOLIDAY') {
    return 'Holiday — skipped from LOP';
  }
  if (day.status === 'WEEK_OFF') {
    return 'Weekly off — skipped from LOP';
  }
  if (day.status === 'NO_SHIFT') {
    return 'No shift assigned — needs review';
  }
  if (day.status === 'MISSING_PUNCH') {
    return day.actualIn ? 'Punch-in only — missing punch-out' : 'Missing punch';
  }
  if (day.status === 'ABSENT' && day.workedMinutes == null) {
    return 'No punches';
  }
  const worked = workedHoursLine(day, shiftName);
  if (day.lateMinutes > 0) {
    const permission = day.permissionCovered
      ? ` · ${day.permissionMinutes}m permission covered this`
      : day.permissionMinutes
        ? ` · ${day.permissionMinutes}m permission`
        : ' · no permission';
    const lateLine = `Late ${day.lateMinutes}m${permission}`;
    return worked ? `${lateLine} · ${worked}` : lateLine;
  }
  if (worked) return worked;
  if (day.skippedFromLop) {
    return 'Skipped from LOP';
  }
  return '—';
}

export function attendanceDayLopLabel(day: AttendanceReviewDay): string {
  const amount = day.hrAction ? (day.finalLop ?? 0) : (day.proposedLop ?? day.finalLop ?? 0);
  return `${day.hrAction ?? 'No LOP'} · LOP ${amount}`;
}

export function attendanceStatusBadgeClass(status: string): string {
  return cn('inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em]', attendanceStatusClass(status));
}
