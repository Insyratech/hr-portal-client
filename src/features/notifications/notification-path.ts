import type { NotificationItem } from '@/types/api';

export function leaveApprovalPath(roles: string[], id: string): string {
  if (roles.includes('SUPER_ADMIN')) {
    return `/super-admin/leaves/${encodeURIComponent(id)}`;
  }
  if (roles.includes('ADMIN')) {
    return `/admin/leaves/${encodeURIComponent(id)}`;
  }
  return `/leave?applicationId=${encodeURIComponent(id)}`;
}

export function pathForNotification(item: NotificationItem, roles: string[]): string {
  const id = item.referenceId;
  const superAdmin = roles.includes('SUPER_ADMIN');
  const admin = roles.includes('ADMIN');

  if (item.referenceType === 'leave_application' && id) {
    const handoverRequest = /handover requested/i.test(item.title) || /asked you to take handover/i.test(item.message);
    if (handoverRequest) {
      return `/leave/handover/${encodeURIComponent(id)}`;
    }
    return leaveApprovalPath(roles, id);
  }

  if (item.referenceType === 'holiday') {
    return superAdmin ? '/super-admin/holidays' : '/dashboard';
  }
  if (item.referenceType === 'leave_allocation') {
    return '/leave';
  }
  if (item.referenceType === 'hr_policy') {
    return superAdmin ? '/super-admin/hr-policies' : '/policies';
  }
  if (item.referenceType === 'shift_assignment') {
    return '/attendance';
  }
  if (item.referenceType === 'employee') {
    return superAdmin ? '/super-admin/profile' : '/dashboard';
  }

  if (item.referenceType === 'grievance' && id) {
    if (superAdmin) {
      return `/super-admin/grievances?id=${encodeURIComponent(id)}`;
    }
    if (admin) {
      return `/admin/grievances?id=${encodeURIComponent(id)}`;
    }
    return '/grievance';
  }

  if (superAdmin) return '/super-admin';
  if (admin) return '/admin';
  return '/dashboard';
}
