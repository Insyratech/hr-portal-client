'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { Meta } from '@/components/layout/meta';
import { NavSectionTitle } from '@/components/layout/nav-section-title';
import {
  managerialSectionTitle,
  shellMobileNavSections,
  type NavMenuSection,
} from '@/components/layout/shell-nav-items';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  CSO_WORK_NAV,
  FINANCE_ACCOUNTANT_NAV,
  FINANCE_BANKING_NAV,
  FINANCE_GST_NAV,
  FINANCE_EXPENSES_NAV,
  FINANCE_ITEMS_NAV,
  FINANCE_OVERVIEW_NAV,
  FINANCE_PURCHASES_NAV,
  FINANCE_REPORTS_NAV,
  FINANCE_SALES_NAV,
  FINANCE_SETTINGS_NAV,
  GM_ATTENDANCE_NAV,
  GM_LEAVE_NAV,
  GM_ORG_NAV,
  GM_OVERVIEW_NAV,
  GM_WORK_NAV,
  HR_LEAVE_NAV,
  HR_OPS_NAV,
  HR_ORG_NAV,
  HR_OVERVIEW_NAV,
  HR_WORK_NAV,
  INVENTORY_MASTERS_NAV,
  INVENTORY_OVERVIEW_NAV,
  INVENTORY_STOCK_NAV,
  MY_WORK_ACCOUNT_NAV,
  MY_WORK_DASHBOARD,
  MY_WORK_DOCS_NAV,
  MY_WORK_LINK,
  MY_WORK_TIME_NAV,
  MY_PROJECT_NAV,
  SUPER_ADMIN_ORG_NAV,
  SUPER_ADMIN_OVERVIEW_NAV,
  SUPER_ADMIN_POLICIES_NAV,
  SUPER_ADMIN_SYSTEM_NAV,
  isMyProjectNavActive,
  isNavActive,
  type NavItem,
} from '@/constants/nav';
import { cn } from '@/lib/utils';
import type { ShellVariant } from '@/features/auth/role-access';
import { useMyProjectNavItems } from '@/features/work/my-projects';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/ui-slice';

function itemIsActive(pathname: string, href: string): boolean {
  return MY_PROJECT_NAV.some((projectItem) => projectItem.href === href)
    ? isMyProjectNavActive(pathname, href)
    : isNavActive(pathname, href);
}

function navItemsContainActive(pathname: string, items: readonly NavItem[]): boolean {
  return items.some((item) => itemIsActive(pathname, item.href));
}

function sectionContainsActive(pathname: string, section: NavMenuSection): boolean {
  return section.groups.some((group) => navItemsContainActive(pathname, group.items));
}

function NavLinks({ items, collapsed }: { items: readonly NavItem[]; collapsed: boolean }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = itemIsActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors',
                active ? 'bg-foreground text-background' : 'text-foreground hover:bg-surface',
                collapsed && 'justify-center px-2',
              )}
              title={item.label}
            >
              <Icon name={item.icon} className="h-4 w-4 opacity-80" />
              {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function NavGroup({
  label,
  items,
  collapsed,
  metaTone = 'gold',
}: {
  label: string;
  items: readonly NavItem[];
  collapsed: boolean;
  metaTone?: 'gold' | 'purple' | 'orange' | 'cyan';
}) {
  const pathname = usePathname();
  const panelId = useId();
  const containsActive = navItemsContainActive(pathname, items);
  const [open, setOpen] = useState(containsActive);

  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive, pathname]);

  if (items.length === 0) return null;

  if (collapsed) {
    return (
      <div className="space-y-2">
        <NavLinks items={items} collapsed={collapsed} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded px-3 py-1.5 text-left transition-colors hover:bg-surface"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Meta tone={metaTone}>{label}</Meta>
        <Icon
          name="chevron-down"
          className={cn('h-3.5 w-3.5 shrink-0 opacity-60 transition-transform', open && 'rotate-180')}
        />
      </button>
      <div id={panelId} hidden={!open} className={cn(!open && 'hidden')}>
        <NavLinks items={items} collapsed={collapsed} />
      </div>
    </div>
  );
}

/** Major sidebar block: role responsibility / My project / Employee Features. */
function NavSection({
  title,
  collapsed,
  showDivider,
  containsActive,
  tone = 'gold',
  children,
}: {
  title: string;
  collapsed: boolean;
  showDivider: boolean;
  containsActive: boolean;
  tone?: 'gold' | 'purple' | 'orange' | 'cyan';
  children: ReactNode;
}) {
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(containsActive);

  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive, pathname]);

  if (collapsed) {
    return (
      <section className={cn('space-y-5', showDivider && 'border-t border-border pt-6')}>
        <div className="mx-auto h-px w-6 bg-border" aria-hidden />
        <div className="space-y-5">{children}</div>
      </section>
    );
  }

  return (
    <section className={cn('space-y-3', showDivider && 'border-t border-border pt-6')}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 rounded px-3 py-1.5 text-left transition-colors hover:bg-surface"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <NavSectionTitle className="px-0" tone={tone}>
          {title}
        </NavSectionTitle>
        <Icon
          name="chevron-down"
          className={cn('h-3.5 w-3.5 shrink-0 opacity-70 transition-transform', open && 'rotate-180')}
        />
      </button>
      <div id={panelId} hidden={!open} className={cn('space-y-5', !open && 'hidden')}>
        {children}
      </div>
    </section>
  );
}

function EmployeeNavGroups({ collapsed }: { collapsed: boolean }) {
  return (
    <>
      <NavLinks items={[MY_WORK_DASHBOARD, MY_WORK_LINK]} collapsed={collapsed} />
      <NavGroup label="Time off" items={MY_WORK_TIME_NAV} collapsed={collapsed} metaTone="orange" />
      <NavGroup label="Pay & docs" items={MY_WORK_DOCS_NAV} collapsed={collapsed} metaTone="orange" />
      <NavGroup label="Account" items={MY_WORK_ACCOUNT_NAV} collapsed={collapsed} metaTone="orange" />
    </>
  );
}

function ManagerialNavGroups({
  variant,
  collapsed,
}: {
  variant: Exclude<ShellVariant, 'employee' | 'super-admin'>;
  collapsed: boolean;
}) {
  if (variant === 'hr') {
    return (
      <>
        <NavGroup label="Overview" items={HR_OVERVIEW_NAV} collapsed={collapsed} />
        <NavGroup label="Organization" items={HR_ORG_NAV} collapsed={collapsed} />
        <NavGroup label="Leave" items={HR_LEAVE_NAV} collapsed={collapsed} />
        <NavGroup label="Operations" items={HR_OPS_NAV} collapsed={collapsed} />
        <NavGroup label="Work" items={HR_WORK_NAV} collapsed={collapsed} />
      </>
    );
  }
  if (variant === 'gm' || variant === 'admin') {
    return (
      <>
        <NavGroup label="Overview" items={GM_OVERVIEW_NAV} collapsed={collapsed} />
        <NavGroup label="People" items={GM_ORG_NAV} collapsed={collapsed} />
        <NavGroup label="Attendance" items={GM_ATTENDANCE_NAV} collapsed={collapsed} />
        <NavGroup label="Leave" items={GM_LEAVE_NAV} collapsed={collapsed} />
        <NavGroup label="Work" items={GM_WORK_NAV} collapsed={collapsed} />
      </>
    );
  }
  if (variant === 'cso') {
    return <NavGroup label="Work" items={CSO_WORK_NAV} collapsed={collapsed} />;
  }
  if (variant === 'inventory') {
    return (
      <>
        <NavGroup label="Overview" items={INVENTORY_OVERVIEW_NAV} collapsed={collapsed} />
        <NavGroup label="Stock" items={INVENTORY_STOCK_NAV} collapsed={collapsed} />
        <NavGroup label="Masters" items={INVENTORY_MASTERS_NAV} collapsed={collapsed} />
      </>
    );
  }
  return (
    <>
      <NavGroup label="Overview" items={FINANCE_OVERVIEW_NAV} collapsed={collapsed} />
      <NavGroup label="Sales" items={FINANCE_SALES_NAV} collapsed={collapsed} />
      <NavGroup label="Purchases" items={FINANCE_PURCHASES_NAV} collapsed={collapsed} />
      <NavGroup label="Expenses" items={FINANCE_EXPENSES_NAV} collapsed={collapsed} />
      <NavGroup label="Banking" items={FINANCE_BANKING_NAV} collapsed={collapsed} />
      <NavGroup label="GST & Tax" items={FINANCE_GST_NAV} collapsed={collapsed} />
      <NavGroup label="Items" items={FINANCE_ITEMS_NAV} collapsed={collapsed} />
      <NavGroup label="Accountant" items={FINANCE_ACCOUNTANT_NAV} collapsed={collapsed} />
      <NavGroup label="Reports" items={FINANCE_REPORTS_NAV} collapsed={collapsed} />
      <NavGroup label="Settings" items={FINANCE_SETTINGS_NAV} collapsed={collapsed} />
    </>
  );
}

export function Sidebar({ variant }: { variant: Exclude<ShellVariant, 'employee'> }) {
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const projectItems = useMyProjectNavItems();
  const portalSections =
    variant === 'super-admin' ? [] : shellMobileNavSections(variant, projectItems);
  const responsibilityTitle =
    variant === 'super-admin' ? '' : managerialSectionTitle(variant);
  const managerialSection = responsibilityTitle
    ? portalSections.find((section) => section.title === responsibilityTitle)
    : undefined;
  const myProjectSection = portalSections.find((section) => section.title === 'My project');
  const employeeSection = portalSections.find((section) => section.title === 'Employee Features');

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 border-r border-border bg-background lg:flex lg:flex-col',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center border-b border-border px-3',
          collapsed ? 'justify-center' : 'justify-between gap-2',
        )}
      >
        {collapsed ? null : <Meta>ERP Portal</Meta>}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 shrink-0 rounded border border-transparent p-0 hover:border-border"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => dispatch(toggleSidebar())}
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} />
        </Button>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto px-2 py-6">
        {variant === 'super-admin' ? (
          <>
            <NavGroup label="Overview" items={SUPER_ADMIN_OVERVIEW_NAV} collapsed={collapsed} />
            <NavGroup label="Organization" items={SUPER_ADMIN_ORG_NAV} collapsed={collapsed} />
            <NavGroup label="Policies" items={SUPER_ADMIN_POLICIES_NAV} collapsed={collapsed} />
            <NavGroup label="System" items={SUPER_ADMIN_SYSTEM_NAV} collapsed={collapsed} />
          </>
        ) : (
          <>
            {managerialSection ? (
              <NavSection
                title={responsibilityTitle}
                collapsed={collapsed}
                showDivider={false}
                tone="gold"
                containsActive={sectionContainsActive(pathname, managerialSection)}
              >
                <ManagerialNavGroups variant={variant} collapsed={collapsed} />
              </NavSection>
            ) : null}
            {myProjectSection && projectItems.length > 0 ? (
              <NavSection
                title="My project"
                collapsed={collapsed}
                showDivider
                tone="purple"
                containsActive={sectionContainsActive(pathname, myProjectSection)}
              >
                <NavLinks items={projectItems} collapsed={collapsed} />
              </NavSection>
            ) : null}
            {employeeSection ? (
              <NavSection
                title="Employee Features"
                collapsed={collapsed}
                showDivider
                tone="orange"
                containsActive={sectionContainsActive(pathname, employeeSection)}
              >
                <EmployeeNavGroups collapsed={collapsed} />
              </NavSection>
            ) : null}
          </>
        )}
      </nav>
    </aside>
  );
}
