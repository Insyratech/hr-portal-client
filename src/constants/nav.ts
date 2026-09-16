import type { IconName } from '@/components/ui/icon';

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

/** Primary employee chrome (header + mobile bottom nav). Leave lives under More. */
export const EMPLOYEE_NAV: readonly NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/work', label: 'Work', icon: 'grid' },
  { href: '/permission', label: 'Permission', icon: 'clock' },
  { href: '/attendance', label: 'Attendance', icon: 'clock' },
  { href: '/more', label: 'More', icon: 'more' },
];

export const EMPLOYEE_WORK_SUBNAV: readonly NavItem[] = [
  { href: '/work', label: 'Today', icon: 'clock' },
  { href: '/work/priorities', label: 'Priorities', icon: 'grid' },
  { href: '/work/weekly-update', label: 'My weekly update', icon: 'file' },
  { href: '/work/jc', label: 'JC', icon: 'file' },
  { href: '/work/trends', label: 'Trends', icon: 'overview' },
  { href: '/work/history', label: 'History', icon: 'calendar' },
];

/** Project lead tools — only shown when the employee leads at least one active project. */
export const MY_PROJECT_NAV: readonly NavItem[] = [
  { href: '/work/projects', label: 'Project desk', icon: 'building' },
  { href: '/work/priorities/review', label: 'Team priorities', icon: 'users' },
  { href: '/work/team-permissions', label: 'Team permissions', icon: 'shield' },
];

/** Read-only project view for members who are not the project lead. */
export const MEMBER_PROJECT_NAV: readonly NavItem[] = [
  { href: '/work/projects', label: 'My projects', icon: 'building' },
];

/**
 * Personal employee tools for HR / GM / CSO / Finance sidebars.
 * Desktop: under the Employee major section. Mobile chips: after managerial links.
 * Dashboard and My work sit at the top; work sub-pages use the inner sidebar on /work/*.
 */
export const MY_WORK_DASHBOARD: NavItem = {
  href: '/dashboard',
  label: 'My dashboard',
  icon: 'dashboard',
};

/** Single entry to personal work — sub-pages use the inner Work sidebar on /work/*. */
export const MY_WORK_LINK: NavItem = {
  href: '/work',
  label: 'My work',
  icon: 'grid',
};

export const MY_WORK_TIME_NAV: readonly NavItem[] = [
  { href: '/leave', label: 'My leave', icon: 'leave' },
  { href: '/leave/holidays', label: 'Holidays', icon: 'calendar' },
  { href: '/schedule', label: 'My schedule', icon: 'calendar' },
  { href: '/permission', label: 'My permission', icon: 'clock' },
  { href: '/shift-change', label: 'My shift change', icon: 'clock' },
  { href: '/attendance', label: 'Attendance', icon: 'clock' },
];

export const MY_WORK_DOCS_NAV: readonly NavItem[] = [
  { href: '/payslips', label: 'Payslips', icon: 'file' },
  { href: '/grievance', label: 'My grievance', icon: 'shield' },
  { href: '/policies', label: 'Policies', icon: 'file' },
];

export const MY_WORK_ACCOUNT_NAV: readonly NavItem[] = [
  { href: '/more/profile', label: 'Profile details', icon: 'user' },
  { href: '/more/password', label: 'Password', icon: 'settings' },
];

export const MY_WORK_NAV: readonly NavItem[] = [
  MY_WORK_DASHBOARD,
  MY_WORK_LINK,
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
  { href: '/hr/shift-changes', label: 'Shift change requests', icon: 'clock' },
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

export const GM_ORG_NAV: readonly NavItem[] = [
  { href: '/gm/employees', label: 'Employees', icon: 'users' },
];

export const GM_ATTENDANCE_NAV: readonly NavItem[] = [
  { href: '/gm/attendance', label: 'Attendance', icon: 'clock' },
  { href: '/gm/payroll', label: 'Payroll', icon: 'grid' },
  { href: '/gm/reports', label: 'Reports', icon: 'grid' },
  { href: '/gm/permissions', label: 'Permissions', icon: 'clock' },
  { href: '/gm/shift-changes', label: 'Shift changes', icon: 'clock' },
];

export const GM_LEAVE_NAV: readonly NavItem[] = [
  { href: '/gm/leave-status', label: 'Who’s out', icon: 'leave' },
  { href: '/gm/holidays', label: 'Holidays', icon: 'calendar' },
];

export const GM_WORK_NAV: readonly NavItem[] = [
  { href: '/gm/weekly-updates', label: 'Shared weekly updates', icon: 'file' },
  { href: '/gm/jc', label: 'Team JC', icon: 'file' },
];

export const GM_NAV: readonly NavItem[] = [
  ...GM_OVERVIEW_NAV,
  ...GM_ORG_NAV,
  ...GM_ATTENDANCE_NAV,
  ...GM_LEAVE_NAV,
  ...GM_WORK_NAV,
];

export const CSO_WORK_NAV: readonly NavItem[] = [
  { href: '/cso/work', label: 'Team week', icon: 'calendar' },
  { href: '/cso/work/priorities', label: 'Priorities', icon: 'grid' },
  { href: '/cso/work/weekly-updates', label: 'Weekly work updates', icon: 'file' },
  { href: '/cso/work/jc', label: 'Team JC', icon: 'file' },
  { href: '/cso/work/projects', label: 'Projects', icon: 'building' },
  { href: '/cso/work/employees', label: 'Employees', icon: 'users' },
  { href: '/cso/work/insights', label: 'Insights', icon: 'overview' },
  { href: '/cso/shift-changes', label: 'Shift changes', icon: 'clock' },
];

export const CSO_NAV: readonly NavItem[] = [...CSO_WORK_NAV];

export const FINANCE_OVERVIEW_NAV: readonly NavItem[] = [
  { href: '/finance', label: 'Overview', icon: 'overview' },
];

export const FINANCE_REPORTS_NAV: readonly NavItem[] = [
  { href: '/finance/reports', label: 'Reports', icon: 'audit' },
];

export const FINANCE_SALES_NAV: readonly NavItem[] = [
  { href: '/finance/sales/overview', label: 'Overview', icon: 'overview' },
  { href: '/finance/customers', label: 'Customers', icon: 'users' },
  { href: '/finance/quotes', label: 'Quotes', icon: 'file' },
  { href: '/finance/sales-orders', label: 'Sales orders', icon: 'file' },
  { href: '/finance/delivery-notes', label: 'Delivery notes', icon: 'check' },
  { href: '/finance/invoices', label: 'Invoices', icon: 'file' },
  { href: '/finance/payments-received', label: 'Payments received', icon: 'grid' },
  { href: '/finance/credit-notes', label: 'Credit notes', icon: 'badge' },
];

export const FINANCE_PURCHASES_NAV: readonly NavItem[] = [
  { href: '/finance/purchases/overview', label: 'Overview', icon: 'overview' },
  { href: '/finance/indents', label: 'Indents', icon: 'file' },
  { href: '/finance/rfqs', label: 'RFQs', icon: 'search' },
  { href: '/finance/purchase-orders', label: 'Purchase orders', icon: 'file' },
  { href: '/finance/receipts', label: 'Receipts', icon: 'check' },
  { href: '/finance/bills', label: 'Bills', icon: 'file' },
  { href: '/finance/payments', label: 'Payments', icon: 'grid' },
  { href: '/finance/vendor-credits', label: 'Vendor credits', icon: 'badge' },
  { href: '/finance/vendors', label: 'Vendors', icon: 'building' },
];

export const FINANCE_EXPENSES_NAV: readonly NavItem[] = [
  { href: '/finance/expenses', label: 'Expenses', icon: 'grid' },
  { href: '/finance/expense-claims', label: 'Expense claims', icon: 'file' },
  { href: '/finance/reimbursements', label: 'Reimbursements', icon: 'badge' },
];

export const FINANCE_BANKING_NAV: readonly NavItem[] = [
  { href: '/finance/banking', label: 'Accounts', icon: 'building' },
  { href: '/finance/banking/transactions', label: 'Transactions', icon: 'grid' },
  { href: '/finance/banking/import', label: 'Import', icon: 'file' },
  { href: '/finance/banking/reconciliation', label: 'Reconciliation', icon: 'check' },
];

export const FINANCE_GST_NAV: readonly NavItem[] = [
  { href: '/finance/gst/outward', label: 'Outward', icon: 'file' },
  { href: '/finance/gst/inward', label: 'Inward / ITC', icon: 'grid' },
  { href: '/finance/gst/hsn', label: 'HSN', icon: 'badge' },
  { href: '/finance/gst/workbooks', label: 'Workbooks', icon: 'file' },
  { href: '/finance/gst/tds', label: 'TDS', icon: 'check' },
  { href: '/finance/integrations', label: 'Integrations', icon: 'settings' },
];

export const FINANCE_ITEMS_NAV: readonly NavItem[] = [
  { href: '/finance/items', label: 'Items', icon: 'grid' },
];

export const FINANCE_ACCOUNTANT_NAV: readonly NavItem[] = [
  { href: '/finance/accounts', label: 'Accounts', icon: 'file' },
  { href: '/finance/journals', label: 'Journals', icon: 'file' },
  { href: '/finance/ledger', label: 'General ledger', icon: 'grid' },
  { href: '/finance/trial-balance', label: 'Trial balance', icon: 'badge' },
  { href: '/finance/opening-balances', label: 'Opening balances', icon: 'file' },
  { href: '/finance/period-locks', label: 'Period lock', icon: 'settings' },
  { href: '/finance/tax', label: 'Tax', icon: 'badge' },
  { href: '/finance/series', label: 'Number series', icon: 'audit' },
];

export const FINANCE_SETTINGS_NAV: readonly NavItem[] = [
  { href: '/finance/settings', label: 'Settings', icon: 'settings' },
];

export const FINANCE_NAV: readonly NavItem[] = [
  ...FINANCE_OVERVIEW_NAV,
  ...FINANCE_SALES_NAV,
  ...FINANCE_PURCHASES_NAV,
  ...FINANCE_EXPENSES_NAV,
  ...FINANCE_BANKING_NAV,
  ...FINANCE_GST_NAV,
  ...FINANCE_ITEMS_NAV,
  ...FINANCE_ACCOUNTANT_NAV,
  ...FINANCE_REPORTS_NAV,
  ...FINANCE_SETTINGS_NAV,
];

/** Primary managerial shortcuts for phone and tablet bottom nav (full menu stays in the hamburger). */
export const HR_BOTTOM_NAV: readonly NavItem[] = [
  { href: '/hr', label: 'Overview', icon: 'overview' },
  { href: '/hr/employees', label: 'Employees', icon: 'users' },
  { href: '/hr/leaves', label: 'Leave', icon: 'leave' },
  { href: '/hr/permissions', label: 'Permissions', icon: 'clock' },
  { href: '/hr/grievances', label: 'Grievances', icon: 'shield' },
];

export const GM_BOTTOM_NAV: readonly NavItem[] = [
  { href: '/gm', label: 'Overview', icon: 'overview' },
  { href: '/gm/employees', label: 'Employees', icon: 'users' },
  { href: '/gm/attendance', label: 'Attendance', icon: 'clock' },
  { href: '/gm/payroll', label: 'Payroll', icon: 'grid' },
  { href: '/gm/leave-status', label: 'Leave', icon: 'leave' },
];

export const CSO_BOTTOM_NAV: readonly NavItem[] = [
  { href: '/cso/work', label: 'Team week', icon: 'calendar' },
  { href: '/cso/work/priorities', label: 'Priorities', icon: 'grid' },
  { href: '/cso/work/weekly-updates', label: 'Updates', icon: 'file' },
  { href: '/cso/work/projects', label: 'Projects', icon: 'building' },
  { href: '/cso/work/insights', label: 'Insights', icon: 'overview' },
];

export const SUPER_ADMIN_BOTTOM_NAV: readonly NavItem[] = [
  { href: '/super-admin', label: 'Overview', icon: 'overview' },
  { href: '/super-admin/employees', label: 'Employees', icon: 'users' },
  { href: '/super-admin/edit-requests', label: 'Requests', icon: 'audit' },
  { href: '/super-admin/roles', label: 'Roles', icon: 'shield' },
  { href: '/super-admin/audit', label: 'Audit', icon: 'audit' },
];

export const FINANCE_BOTTOM_NAV: readonly NavItem[] = [
  { href: '/finance', label: 'Overview', icon: 'overview' },
  { href: '/finance/indents', label: 'Indents', icon: 'file' },
  { href: '/finance/purchase-orders', label: 'POs', icon: 'file' },
  { href: '/finance/bills', label: 'Bills', icon: 'file' },
  { href: '/finance/settings', label: 'Settings', icon: 'settings' },
];

export function isNavActive(pathname: string, href: string): boolean {
  const roots = ['/super-admin', '/hr', '/gm', '/cso', '/finance', '/dashboard'];
  if (roots.includes(href)) {
    return pathname === href;
  }
  if (href === '/work') {
    return (
      pathname === '/work' ||
      (pathname.startsWith('/work/') && !isMyProjectArea(pathname))
    );
  }
  if (href === '/leave') {
    return pathname === '/leave' || (pathname.startsWith('/leave/') && !pathname.startsWith('/leave/holidays'));
  }
  if (
    href === '/super-admin/work' ||
    href === '/hr/work' ||
    href === '/gm/work' ||
    href === '/cso/work'
  ) {
    return pathname === href;
  }
  if (href === '/finance/banking') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isWorkSubnavActive(pathname: string, href: string): boolean {
  if (isMyProjectArea(pathname)) return false;
  return pathname === href;
}

export function isMyProjectNavActive(pathname: string, href: string): boolean {
  if (href === '/work/projects') {
    return pathname === href || pathname.startsWith('/work/projects/');
  }
  if (href === '/work/priorities/review') {
    return pathname === href || pathname.startsWith('/work/priorities/review');
  }
  if (href === '/work/team-permissions') {
    return pathname === href || pathname.startsWith('/work/team-permissions');
  }
  return pathname === href;
}

export function isMyProjectArea(pathname: string): boolean {
  return (
    pathname === '/work/projects' ||
    pathname.startsWith('/work/projects/') ||
    pathname === '/work/priorities/review' ||
    pathname.startsWith('/work/priorities/review') ||
    pathname === '/work/team-permissions' ||
    pathname.startsWith('/work/team-permissions/')
  );
}
