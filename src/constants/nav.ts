import type { IconName } from '@/components/ui/icon';

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

/** Primary employee chrome (header + mobile bottom nav). */
export const EMPLOYEE_NAV: readonly NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/work', label: 'Work', icon: 'grid' },
  { href: '/leave', label: 'Leave', icon: 'leave' },
  { href: '/permission', label: 'Permission', icon: 'clock' },
  { href: '/attendance', label: 'Attendance', icon: 'clock' },
  { href: '/more', label: 'More', icon: 'more' },
];

export const EMPLOYEE_WORK_SUBNAV: readonly NavItem[] = [
  { href: '/work', label: 'Today', icon: 'clock' },
  { href: '/work/priorities', label: 'Priorities', icon: 'grid' },
  { href: '/work/weekly-update', label: 'My weekly update', icon: 'file' },
  { href: '/work/trends', label: 'Trends', icon: 'overview' },
  { href: '/work/history', label: 'History', icon: 'calendar' },
];

/**
 * Personal employee tools for HR / GM / CSO / Finance sidebars.
 * Desktop: under the Employee major section. Mobile chips: after managerial links.
 */
export const MY_WORK_WORK_NAV: readonly NavItem[] = [
  { href: '/dashboard', label: 'My dashboard', icon: 'dashboard' },
  { href: '/work', label: 'Today’s update', icon: 'clock' },
  { href: '/work/priorities', label: 'My priorities', icon: 'grid' },
  { href: '/work/weekly-update', label: 'My weekly update', icon: 'file' },
  { href: '/work/trends', label: 'My trends', icon: 'overview' },
  { href: '/work/history', label: 'Work history', icon: 'calendar' },
];

export const MY_WORK_TIME_NAV: readonly NavItem[] = [
  { href: '/leave', label: 'My leave', icon: 'leave' },
  { href: '/permission', label: 'My permission', icon: 'clock' },
  { href: '/attendance', label: 'Attendance', icon: 'clock' },
];

export const MY_WORK_DOCS_NAV: readonly NavItem[] = [
  { href: '/payslips', label: 'Payslips', icon: 'file' },
  { href: '/grievance', label: 'My grievance', icon: 'shield' },
  { href: '/policies', label: 'Policies', icon: 'file' },
];

export const MY_WORK_ACCOUNT_NAV: readonly NavItem[] = [
  { href: '/more/password', label: 'Password', icon: 'settings' },
];

export const MY_WORK_NAV: readonly NavItem[] = [
  ...MY_WORK_WORK_NAV,
  ...MY_WORK_TIME_NAV,
  ...MY_WORK_DOCS_NAV,
  ...MY_WORK_ACCOUNT_NAV,
];

/** @deprecated Use GM_* — /admin redirects to /gm. */
export const ADMIN_OVERVIEW_NAV: readonly NavItem[] = [{ href: '/gm', label: 'Overview', icon: 'overview' }];
export const ADMIN_ORG_NAV: readonly NavItem[] = [];
export const ADMIN_LEAVE_NAV: readonly NavItem[] = [];
export const ADMIN_ATTENDANCE_NAV: readonly NavItem[] = [];
export const ADMIN_WORK_NAV: readonly NavItem[] = [];
export const ADMIN_POLICIES_NAV: readonly NavItem[] = [];
export const ADMIN_NAV: readonly NavItem[] = [...ADMIN_OVERVIEW_NAV];

export const SUPER_ADMIN_OVERVIEW_NAV: readonly NavItem[] = [
  { href: '/super-admin', label: 'Overview', icon: 'overview' },
];

export const SUPER_ADMIN_ORG_NAV: readonly NavItem[] = [
  { href: '/super-admin/employees', label: 'Employees', icon: 'users' },
  { href: '/super-admin/edit-requests', label: 'Edit requests', icon: 'audit' },
  { href: '/super-admin/roles', label: 'Roles', icon: 'shield' },
];

export const SUPER_ADMIN_POLICIES_NAV: readonly NavItem[] = [
  { href: '/super-admin/hr-policies', label: 'HR Policies', icon: 'file' },
];

export const SUPER_ADMIN_SYSTEM_NAV: readonly NavItem[] = [
  { href: '/super-admin/settings', label: 'Settings', icon: 'settings' },
  { href: '/super-admin/audit', label: 'Audit', icon: 'audit' },
  { href: '/super-admin/profile', label: 'Profile', icon: 'users' },
  { href: '/more/password', label: 'Password', icon: 'settings' },
];

export const SUPER_ADMIN_CONFIG_NAV: readonly NavItem[] = [
  ...SUPER_ADMIN_ORG_NAV,
  ...SUPER_ADMIN_POLICIES_NAV,
  ...SUPER_ADMIN_SYSTEM_NAV,
];

export const HR_OVERVIEW_NAV: readonly NavItem[] = [{ href: '/hr', label: 'Overview', icon: 'overview' }];

export const HR_ORG_NAV: readonly NavItem[] = [
  { href: '/hr/employees', label: 'Employees', icon: 'users' },
  { href: '/hr/companies', label: 'Companies', icon: 'building' },
  { href: '/hr/departments', label: 'Departments', icon: 'building' },
  { href: '/hr/designations', label: 'Designations', icon: 'badge' },
];

export const HR_LEAVE_NAV: readonly NavItem[] = [
  { href: '/hr/leaves', label: 'Applications', icon: 'leave' },
  { href: '/hr/leave-types', label: 'Leave types', icon: 'leave' },
  { href: '/hr/holidays', label: 'Holidays', icon: 'calendar' },
  { href: '/hr/settings', label: 'Working days', icon: 'settings' },
];

export const HR_OPS_NAV: readonly NavItem[] = [
  { href: '/hr/shifts', label: 'Shifts', icon: 'clock' },
  { href: '/hr/permissions', label: 'Permissions', icon: 'clock' },
  { href: '/hr/grievances', label: 'Grievances', icon: 'shield' },
];

export const HR_WORK_NAV: readonly NavItem[] = [
  { href: '/hr/work', label: 'Team week', icon: 'calendar' },
  { href: '/hr/work/priorities', label: 'Priorities', icon: 'grid' },
];

export const HR_NAV: readonly NavItem[] = [
  ...HR_OVERVIEW_NAV,
  ...HR_ORG_NAV,
  ...HR_LEAVE_NAV,
  ...HR_OPS_NAV,
  ...HR_WORK_NAV,
];

export const GM_OVERVIEW_NAV: readonly NavItem[] = [{ href: '/gm', label: 'Overview', icon: 'overview' }];

export const GM_ATTENDANCE_NAV: readonly NavItem[] = [
  { href: '/gm/attendance', label: 'Attendance', icon: 'clock' },
  { href: '/gm/payroll', label: 'Payroll', icon: 'grid' },
  { href: '/gm/reports', label: 'Reports', icon: 'grid' },
  { href: '/gm/permissions', label: 'Permissions', icon: 'clock' },
];

export const GM_LEAVE_NAV: readonly NavItem[] = [
  { href: '/gm/leave-status', label: 'Who’s out', icon: 'leave' },
];

export const GM_WORK_NAV: readonly NavItem[] = [
  { href: '/gm/weekly-updates', label: 'Shared weekly updates', icon: 'file' },
];

export const GM_NAV: readonly NavItem[] = [...GM_OVERVIEW_NAV, ...GM_ATTENDANCE_NAV, ...GM_LEAVE_NAV, ...GM_WORK_NAV];

export const CSO_WORK_NAV: readonly NavItem[] = [
  { href: '/cso/work', label: 'Team week', icon: 'calendar' },
  { href: '/cso/work/priorities', label: 'Priorities', icon: 'grid' },
  { href: '/cso/work/weekly-updates', label: 'Weekly work updates', icon: 'file' },
  { href: '/cso/work/projects', label: 'Projects', icon: 'building' },
  { href: '/cso/work/employees', label: 'Employees', icon: 'users' },
  { href: '/cso/work/insights', label: 'Insights', icon: 'overview' },
];

export const CSO_NAV: readonly NavItem[] = [...CSO_WORK_NAV];

export const FINANCE_OVERVIEW_NAV: readonly NavItem[] = [
  { href: '/finance', label: 'Overview', icon: 'overview' },
];

export const FINANCE_NAV: readonly NavItem[] = [...FINANCE_OVERVIEW_NAV];

export function isNavActive(pathname: string, href: string): boolean {
  const roots = ['/super-admin', '/hr', '/gm', '/cso', '/finance', '/dashboard'];
  if (roots.includes(href)) {
    return pathname === href;
  }
  if (href === '/work') {
    return pathname === '/work' || pathname.startsWith('/work/');
  }
  if (
    href === '/super-admin/work' ||
    href === '/hr/work' ||
    href === '/gm/work' ||
    href === '/cso/work'
  ) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isWorkSubnavActive(pathname: string, href: string): boolean {
  return pathname === href;
}
