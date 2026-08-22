import type { IconName } from '@/components/ui/icon';

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

export const EMPLOYEE_NAV: readonly NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/leave', label: 'Leave', icon: 'leave' },
  { href: '/attendance', label: 'Attendance', icon: 'clock' },
  { href: '/more', label: 'More', icon: 'more' },
];

/** Personal employee tools shown in Admin / Super Admin sidebars. */
export const MY_WORK_NAV: readonly NavItem[] = [
  { href: '/dashboard', label: 'My dashboard', icon: 'dashboard' },
  { href: '/leave', label: 'My leave', icon: 'leave' },
  { href: '/attendance', label: 'Punch / attendance', icon: 'clock' },
  { href: '/grievance', label: 'My grievance', icon: 'shield' },
  { href: '/policies', label: 'Policies', icon: 'file' },
  { href: '/more/password', label: 'Password', icon: 'settings' },
];

export const ADMIN_NAV: readonly NavItem[] = [
  { href: '/admin', label: 'Overview', icon: 'overview' },
  { href: '/admin/employees', label: 'Employees', icon: 'users' },
  { href: '/admin/leaves', label: 'Leaves', icon: 'leave' },
  { href: '/admin/attendance', label: 'Attendance', icon: 'clock' },
  { href: '/admin/grievances', label: 'Grievances', icon: 'shield' },
  { href: '/admin/policies', label: 'Policies', icon: 'file' },
  { href: '/admin/reports', label: 'Reports', icon: 'grid' },
];

export const SUPER_ADMIN_OVERVIEW_NAV: readonly NavItem[] = [
  { href: '/super-admin', label: 'Overview', icon: 'overview' },
];

export const SUPER_ADMIN_LEAVE_NAV: readonly NavItem[] = [
  { href: '/super-admin/leaves', label: 'Applications', icon: 'leave' },
  { href: '/super-admin/leave-types', label: 'Leave types', icon: 'leave' },
];

export const SUPER_ADMIN_GRIEVANCE_NAV: readonly NavItem[] = [
  { href: '/super-admin/grievances', label: 'Grievances', icon: 'shield' },
];

export const SUPER_ADMIN_ATTENDANCE_NAV: readonly NavItem[] = [
  { href: '/super-admin/shifts', label: 'Shifts', icon: 'clock' },
];

export const SUPER_ADMIN_ORG_NAV: readonly NavItem[] = [
  { href: '/super-admin/employees', label: 'Employees', icon: 'users' },
  { href: '/super-admin/departments', label: 'Departments', icon: 'building' },
  { href: '/super-admin/designations', label: 'Designations', icon: 'badge' },
  { href: '/super-admin/roles', label: 'Roles', icon: 'shield' },
];

export const SUPER_ADMIN_POLICIES_NAV: readonly NavItem[] = [
  { href: '/super-admin/hr-policies', label: 'HR Policies', icon: 'file' },
];

export const SUPER_ADMIN_SYSTEM_NAV: readonly NavItem[] = [
  { href: '/super-admin/holidays', label: 'Holidays', icon: 'calendar' },
  { href: '/super-admin/profile', label: 'Profile', icon: 'users' },
  { href: '/super-admin/settings', label: 'Settings', icon: 'settings' },
  { href: '/super-admin/audit', label: 'Audit', icon: 'audit' },
];

export const SUPER_ADMIN_CONFIG_NAV: readonly NavItem[] = [
  ...SUPER_ADMIN_LEAVE_NAV,
  ...SUPER_ADMIN_GRIEVANCE_NAV,
  ...SUPER_ADMIN_ATTENDANCE_NAV,
  ...SUPER_ADMIN_ORG_NAV,
  ...SUPER_ADMIN_POLICIES_NAV,
  ...SUPER_ADMIN_SYSTEM_NAV,
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/super-admin' || href === '/admin' || href === '/dashboard') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
