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

/** LOP decision line (NO_LOP / EXCLUDE / FULL_LOP, etc.). */
export function attendanceLopClass(): string {
  return 'text-cyan-400';
}

export function attendanceStatusMark(status: string): string {
  if (status === 'ABSENT' || status === 'MISSING_PUNCH') return '×';
  if (status === 'LATE' || status === 'HALF_DAY' || status === 'NO_SHIFT' || status === 'MISSING_PUNCH') return '○';
  return '●';
}

/**
 * Human detail under each day. Leave must win over skippedFromLop —
 * paid leave is skipped from LOP but is not a weekly off/holiday.
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
  if (day.lateMinutes > 0) {
    const permission = day.permissionCovered
      ? ` · ${day.permissionMinutes}m permission covered this`
      : day.permissionMinutes
        ? ` · ${day.permissionMinutes}m permission`
        : ' · no permission';
    return `Late ${day.lateMinutes}m${permission}`;
  }
  if (day.workedMinutes != null) {
    const shift = shiftName ?? 'hours required';
    return `Worked ${formatDuration(day.workedMinutes)} · ${shift.includes('flexible') || shift.toLowerCase().includes('flex') ? `flexible (any start time, ${shift})` : shift}`;
  }
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
