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

export type LeavePresencePerson = {
  employeeId: string;
  employeeName: string;
  leaves: LeaveApplication[];
};

/** One row per employee (A→Z), with their leave lines underneath. */
export function groupLeavePresenceByEmployee(items: LeaveApplication[]): LeavePresencePerson[] {
  const byId = new Map<string, LeavePresencePerson>();
  for (const row of items) {
    const key = row.employeeId || row.id;
    const existing = byId.get(key);
    if (existing) {
      existing.leaves.push(row);
      continue;
    }
    byId.set(key, {
      employeeId: key,
      employeeName: row.employeeName?.trim() || 'Employee',
      leaves: [row],
    });
  }
  return [...byId.values()].sort((a, b) =>
    a.employeeName.localeCompare(b.employeeName, undefined, { sensitivity: 'base' }),
  );
}

export function formatLeavePresenceLine(row: LeaveApplication): string {
  const type = row.leaveTypeName ?? row.leaveTypeCode ?? 'Leave';
  const start = dateKey(row.startDate);
  const end = dateKey(row.endDate);
  const dates = start === end ? start : `${start} – ${end}`;
  const qty =
    row.duration === 'half'
      ? 'half day'
      : `${row.quantity} day${row.quantity === 1 ? '' : 's'}`;
  return `${type} · ${dates} · ${qty}`;
}

/** @deprecated Prefer LeavePresenceBoardData from the presence API. */
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
