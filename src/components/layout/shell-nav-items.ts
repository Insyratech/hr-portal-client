import {
  CSO_BOTTOM_NAV,
  CSO_WORK_NAV,
  FINANCE_ACCOUNTANT_NAV,
  FINANCE_BANKING_NAV,
  FINANCE_BOTTOM_NAV,
  FINANCE_GST_NAV,
  FINANCE_ITEMS_NAV,
  FINANCE_OVERVIEW_NAV,
  FINANCE_EXPENSES_NAV,
  FINANCE_PURCHASES_NAV,
  FINANCE_REPORTS_NAV,
  FINANCE_SALES_NAV,
  FINANCE_SETTINGS_NAV,
  GM_ATTENDANCE_NAV,
  GM_BOTTOM_NAV,
  GM_LEAVE_NAV,
  GM_ORG_NAV,
  GM_OVERVIEW_NAV,
  GM_WORK_NAV,
  HR_BOTTOM_NAV,
  HR_LEAVE_NAV,
  HR_OPS_NAV,
  HR_ORG_NAV,
  HR_OVERVIEW_NAV,
  HR_WORK_NAV,
  INVENTORY_BOTTOM_NAV,
  INVENTORY_MASTERS_NAV,
  INVENTORY_OVERVIEW_NAV,
  INVENTORY_STOCK_NAV,
  MY_PROJECT_NAV,
  MY_WORK_ACCOUNT_NAV,
  MY_WORK_DASHBOARD,
  MY_WORK_DOCS_NAV,
  MY_WORK_LINK,
  MY_WORK_TIME_NAV,
  SUPER_ADMIN_BOTTOM_NAV,
  SUPER_ADMIN_ORG_NAV,
  SUPER_ADMIN_OVERVIEW_NAV,
  SUPER_ADMIN_POLICIES_NAV,
  SUPER_ADMIN_SYSTEM_NAV,
  isMyProjectNavActive,
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

function employeeSectionGroups(): NavMenuGroup[] {
  return [
    { items: [MY_WORK_DASHBOARD, MY_WORK_LINK] },
    { label: 'Time off', items: MY_WORK_TIME_NAV },
    { label: 'Pay & docs', items: MY_WORK_DOCS_NAV },
    { label: 'Account', items: MY_WORK_ACCOUNT_NAV },
  ];
}

function employeeSection(): NavMenuSection {
  return {
    title: 'Employee Features',
    groups: employeeSectionGroups(),
  };
}

function myProjectSection(items: readonly NavItem[]): NavMenuSection {
  return {
    title: 'My project',
    groups: [{ items }],
  };
}

/** Role-specific label for the managerial sidebar / mobile nav block. */
export function managerialSectionTitle(
  variant: Exclude<ShellVariant, 'employee' | 'super-admin'>,
): string {
  if (variant === 'hr') return 'HR Responsibility';
  if (variant === 'gm' || variant === 'admin') return 'GM Responsibility';
  if (variant === 'cso') return 'CSO Responsibility';
  if (variant === 'inventory') return 'Inventory Responsibility';
  return 'Finance Responsibility';
}

function managerialSection(variant: Exclude<ShellVariant, 'employee' | 'super-admin'>): NavMenuSection {
  const title = managerialSectionTitle(variant);
  if (variant === 'hr') {
    return {
      title,
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
      title,
      groups: [
        { label: 'Overview', items: GM_OVERVIEW_NAV },
        { label: 'People', items: GM_ORG_NAV },
        { label: 'Attendance', items: GM_ATTENDANCE_NAV },
        { label: 'Leave', items: GM_LEAVE_NAV },
        { label: 'Work', items: GM_WORK_NAV },
      ],
    };
  }
  if (variant === 'cso') {
    return {
      title,
      groups: [{ label: 'Work', items: CSO_WORK_NAV }],
    };
  }
  if (variant === 'inventory') {
    return {
      title,
      groups: [
        { label: 'Overview', items: INVENTORY_OVERVIEW_NAV },
        { label: 'Stock', items: INVENTORY_STOCK_NAV },
        { label: 'Masters', items: INVENTORY_MASTERS_NAV },
      ],
    };
  }
  return {
    title,
    groups: [
      { label: 'Overview', items: FINANCE_OVERVIEW_NAV },
      { label: 'Sales', items: FINANCE_SALES_NAV },
      { label: 'Purchases', items: FINANCE_PURCHASES_NAV },
      { label: 'Expenses', items: FINANCE_EXPENSES_NAV },
      { label: 'Banking', items: FINANCE_BANKING_NAV },
      { label: 'GST & Tax', items: FINANCE_GST_NAV },
      { label: 'Items', items: FINANCE_ITEMS_NAV },
      { label: 'Accountant', items: FINANCE_ACCOUNTANT_NAV },
      { label: 'Reports', items: FINANCE_REPORTS_NAV },
      { label: 'Settings', items: FINANCE_SETTINGS_NAV },
    ],
  };
}

export function shellMobileNavSections(
  variant: Exclude<ShellVariant, 'employee'>,
  myProjectItems: readonly NavItem[] = [],
): NavMenuSection[] {
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
  const sections: NavMenuSection[] = [managerialSection(variant)];
  if (myProjectItems.length > 0) sections.push(myProjectSection(myProjectItems));
  sections.push(employeeSection());
  return sections;
}

export function shellMobileNavTitle(variant: Exclude<ShellVariant, 'employee'>): string {
  if (variant === 'super-admin') return 'Super admin';
  if (variant === 'hr') return 'HR portal';
  if (variant === 'gm' || variant === 'admin') return 'General manager';
  if (variant === 'cso') return 'CSO';
  if (variant === 'finance') return 'Finance';
  if (variant === 'inventory') return 'Inventory';
  return 'Navigation';
}

export function shellNavItemActive(pathname: string, href: string): boolean {
  if (MY_PROJECT_NAV.some((item) => item.href === href)) {
    return isMyProjectNavActive(pathname, href);
  }
  return isNavActive(pathname, href);
}

export function shellBottomNavItems(variant: Exclude<ShellVariant, 'employee'>): readonly NavItem[] {
  if (variant === 'super-admin') return SUPER_ADMIN_BOTTOM_NAV;
  if (variant === 'hr') return HR_BOTTOM_NAV;
  if (variant === 'gm' || variant === 'admin') return GM_BOTTOM_NAV;
  if (variant === 'cso') return CSO_BOTTOM_NAV;
  if (variant === 'inventory') return INVENTORY_BOTTOM_NAV;
  return FINANCE_BOTTOM_NAV;
}
