import type { LeaveApplication } from '@/types/api';

export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function splitLeavePresence(items: LeaveApplication[], today = todayIso()) {
  const open = items.filter((row) => row.status === 'APPROVED' || row.status === 'PENDING');
  const onLeave = open.filter(
    (row) => row.status === 'APPROVED' && row.startDate <= today && row.endDate >= today,
  );
  const upcoming = open
    .filter((row) => row.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
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
