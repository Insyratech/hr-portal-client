import {
  CSO_WORK_NAV,
  FINANCE_OVERVIEW_NAV,
  GM_ATTENDANCE_NAV,
  GM_LEAVE_NAV,
  GM_OVERVIEW_NAV,
  GM_WORK_NAV,
  HR_LEAVE_NAV,
  HR_OPS_NAV,
  HR_ORG_NAV,
  HR_OVERVIEW_NAV,
  HR_WORK_NAV,
  MY_WORK_ACCOUNT_NAV,
  MY_WORK_DASHBOARD,
  MY_WORK_DOCS_NAV,
  MY_WORK_LINK,
  MY_WORK_TIME_NAV,
  SUPER_ADMIN_ORG_NAV,
  SUPER_ADMIN_OVERVIEW_NAV,
  SUPER_ADMIN_POLICIES_NAV,
  SUPER_ADMIN_SYSTEM_NAV,
  isNavActive,
  type NavItem,
} from '@/constants/nav';
import type { ShellVariant } from '@/features/auth/role-access';

export type NavMenuGroup = {
  label?: string;
  items: readonly NavItem[];
};

export type NavMenuSection = {
  title: string;
  groups: readonly NavMenuGroup[];
};

function employeeSection(): NavMenuSection {
  return {
    title: 'Employee',
    groups: [
      { items: [MY_WORK_DASHBOARD, MY_WORK_LINK] },
      { label: 'Time off', items: MY_WORK_TIME_NAV },
      { label: 'Pay & docs', items: MY_WORK_DOCS_NAV },
      { label: 'Account', items: MY_WORK_ACCOUNT_NAV },
    ],
  };
}

function managerialSection(variant: Exclude<ShellVariant, 'employee' | 'super-admin'>): NavMenuSection {
  if (variant === 'hr') {
    return {
      title: 'Managerial responsibility',
      groups: [
        { label: 'Overview', items: HR_OVERVIEW_NAV },
        { label: 'Organization', items: HR_ORG_NAV },
        { label: 'Leave', items: HR_LEAVE_NAV },
        { label: 'Operations', items: HR_OPS_NAV },
        { label: 'Work', items: HR_WORK_NAV },
      ],
    };
  }
  if (variant === 'gm' || variant === 'admin') {
    return {
      title: 'Managerial responsibility',
      groups: [
        { label: 'Overview', items: GM_OVERVIEW_NAV },
        { label: 'Attendance', items: GM_ATTENDANCE_NAV },
        { label: 'Leave', items: GM_LEAVE_NAV },
        { label: 'Work', items: GM_WORK_NAV },
      ],
    };
  }
  if (variant === 'cso') {
    return {
      title: 'Managerial responsibility',
      groups: [{ label: 'Work', items: CSO_WORK_NAV }],
    };
  }
  return {
    title: 'Managerial responsibility',
    groups: [{ label: 'Overview', items: FINANCE_OVERVIEW_NAV }],
  };
}

export function shellMobileNavSections(variant: Exclude<ShellVariant, 'employee'>): NavMenuSection[] {
  if (variant === 'super-admin') {
    return [
      {
        title: 'Overview',
        groups: [{ items: SUPER_ADMIN_OVERVIEW_NAV }],
      },
      {
        title: 'Configuration',
        groups: [
          { label: 'Organization', items: SUPER_ADMIN_ORG_NAV },
          { label: 'Policies', items: SUPER_ADMIN_POLICIES_NAV },
          { label: 'System', items: SUPER_ADMIN_SYSTEM_NAV },
        ],
      },
    ];
  }
  return [managerialSection(variant), employeeSection()];
}

export function shellMobileNavTitle(variant: Exclude<ShellVariant, 'employee'>): string {
  if (variant === 'super-admin') return 'Super admin';
  if (variant === 'hr') return 'HR portal';
  if (variant === 'gm' || variant === 'admin') return 'General manager';
  if (variant === 'cso') return 'CSO';
  if (variant === 'finance') return 'Finance';
  return 'Navigation';
}

export function shellNavItemActive(pathname: string, href: string): boolean {
  return isNavActive(pathname, href);
}
