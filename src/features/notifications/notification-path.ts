import { homePathForRoles } from '@/features/auth/role-access';
import type { NotificationItem } from '@/types/api';

export function leaveApprovalPath(roles: string[], id: string): string {
  if (roles.includes('HR_MANAGER')) {
    return `/hr/leaves/${encodeURIComponent(id)}`;
  }
  if (roles.includes('GENERAL_MANAGER') || roles.includes('ADMIN')) {
    return `/gm/leave-status`;
  }
  if (roles.includes('SUPER_ADMIN')) {
    return `/super-admin`;
  }
  return `/leave?applicationId=${encodeURIComponent(id)}`;
}

/** CSO review alerts use referenceId = employeeId (see work service notify). */
function isCsoPriorityReview(item: NotificationItem): boolean {
  return /submitted for approval|resubmitted for approval/i.test(item.title);
}

export function pathForNotification(item: NotificationItem, roles: string[]): string {
  const id = item.referenceId;
  const superAdmin = roles.includes('SUPER_ADMIN');
  const hrManager = roles.includes('HR_MANAGER');
  const gm = roles.includes('GENERAL_MANAGER') || roles.includes('ADMIN');
  const cso = roles.includes('CSO');
  const finance = roles.includes('FINANCE_MANAGER');

  if (item.referenceType === 'leave_application' && id) {
    const handoverRequest = /handover requested/i.test(item.title) || /asked you to take handover/i.test(item.message);
    if (handoverRequest) {
      return `/leave/handover/${encodeURIComponent(id)}`;
    }
    const leadRequest =
      /project lead approval/i.test(item.title) || /project-lead approval/i.test(item.message);
    if (leadRequest) {
      return `/leave/lead/${encodeURIComponent(id)}`;
    }
    return leaveApprovalPath(roles, id);
  }

  if (item.referenceType === 'holiday') {
    return hrManager ? '/hr/holidays' : superAdmin ? '/super-admin/settings' : '/dashboard';
  }
  if (item.referenceType === 'leave_allocation') {
    return '/leave';
  }
  if (item.referenceType === 'hr_policy') {
    return superAdmin ? '/super-admin/hr-policies' : '/policies';
  }
  if (item.referenceType === 'attendance_import' || item.referenceType === 'attendance_record') {
    if (gm) {
      if (id && /^\d{4}-\d{2}$/.test(id)) {
        return `/gm/attendance?period=${encodeURIComponent(id)}`;
      }
      return '/gm/attendance';
    }
    if (id && /^\d{4}-\d{2}$/.test(id)) {
      return `/attendance?period=${encodeURIComponent(id)}`;
    }
    return '/attendance';
  }
  if (item.referenceType === 'employee') {
    return superAdmin ? '/super-admin/profile' : homePathForRoles(roles);
  }

  if (item.referenceType === 'salary_slip' && id) {
    return `/payslips/${encodeURIComponent(id)}`;
  }

  if (item.referenceType === 'payroll_run') {
    if (gm) return '/gm/payroll';
    if (finance) return '/finance';
    return '/payslips';
  }

  if (item.referenceType === 'work_permission') {
    if (hrManager) return '/hr/permissions';
    if (gm) return '/gm/permissions';
    return id ? `/permission?permissionId=${encodeURIComponent(id)}` : '/permission';
  }

  if (
    item.referenceType === 'daily_work_day' ||
    item.referenceType === 'weekly_plan' ||
    item.referenceType === 'weekly_priority' ||
    item.referenceType === 'weekly_work_update' ||
    item.referenceType === 'weekly_ppt_desk' ||
    item.referenceType === 'weekly_ppt_share' ||
    item.referenceType === 'work_retention'
  ) {
    if (superAdmin && item.referenceType === 'work_retention') return '/super-admin/settings';
    if (item.referenceType === 'weekly_ppt_share') {
      return id ? `/gm/weekly-updates?shareId=${encodeURIComponent(id)}` : '/gm/weekly-updates';
    }
    if (item.referenceType === 'weekly_ppt_desk') {
      return id && /^\d{4}-\d{2}-\d{2}$/.test(id)
        ? `/cso/work/weekly-updates?weekStart=${encodeURIComponent(id)}`
        : '/cso/work/weekly-updates';
    }
    if (item.referenceType === 'weekly_work_update') {
      return '/work/weekly-update';
    }
    if (item.referenceType === 'weekly_priority' || item.referenceType === 'weekly_plan') {
      if (cso && isCsoPriorityReview(item)) {
        return id
          ? `/cso/work/priorities?employeeId=${encodeURIComponent(id)}`
          : '/cso/work/priorities';
      }
      // Employee-facing (approve / resubmit / own Monday reminders) — including CSO as employee.
      return '/work/priorities';
    }
    // daily_work_day and other personal work reminders
    return '/work';
  }

  if (item.referenceType === 'grievance' && id) {
    if (hrManager) return `/hr/grievances?id=${encodeURIComponent(id)}`;
    return '/grievance';
  }

  if (item.referenceType === 'directory_edit_request') {
    if (superAdmin) return '/super-admin/edit-requests';
    if (hrManager) return '/hr/employees';
  }

  if (superAdmin) return '/super-admin';
  if (hrManager) return '/hr';
  if (gm) return '/gm';
  if (cso) return '/cso/work';
  if (finance) return '/finance';
  return '/dashboard';
}
