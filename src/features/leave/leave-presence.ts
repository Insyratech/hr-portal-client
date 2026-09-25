import type { LeaveApplication } from '@/types/api';

const WORK_TIMEZONE = 'Asia/Kolkata';

function dateKey(value: string): string {
  return value.slice(0, 10);
}

export function todayIso(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: WORK_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function splitLeavePresence(items: LeaveApplication[], today = todayIso()) {
  const open = items.filter((row) => row.status === 'APPROVED' || row.status === 'PENDING');
  const onLeave = open.filter((row) => {
    const start = dateKey(row.startDate);
    const end = dateKey(row.endDate);
    return row.status === 'APPROVED' && start <= today && end >= today;
  });
  const upcoming = open
    .filter((row) => dateKey(row.startDate) > today)
    .sort((a, b) => dateKey(a.startDate).localeCompare(dateKey(b.startDate)));
  return { onLeave, upcoming };
}

export function takenHandovers(items: LeaveApplication[], employeeId: string | undefined): LeaveApplication[] {
  if (!employeeId) return [];
  return items.filter(
    (row) =>
      row.handoverEmployeeId === employeeId &&
      row.employeeId !== employeeId &&
      row.handoverAccepted &&
      (row.status === 'PENDING' || row.status === 'APPROVED'),
  );
}
