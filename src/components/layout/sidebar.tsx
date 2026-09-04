'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Meta } from '@/components/layout/meta';
import { NavSectionTitle } from '@/components/layout/nav-section-title';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
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
import { useIsProjectLead } from '@/features/work/project-lead';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/ui-slice';

function NavLinks({ items, collapsed }: { items: readonly NavItem[]; collapsed: boolean }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = MY_PROJECT_NAV.some((projectItem) => projectItem.href === item.href)
          ? isMyProjectNavActive(pathname, item.href)
          : isNavActive(pathname, item.href);
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
}: {
  label: string;
  items: readonly NavItem[];
  collapsed: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      {collapsed ? null : <Meta className="px-3">{label}</Meta>}
      <NavLinks items={items} collapsed={collapsed} />
    </div>
  );
}

/** Major sidebar block: Managerial responsibility vs Employee Features. */
function NavSection({
  title,
  collapsed,
  children,
}: {
  title: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5">
      {collapsed ? (
        <div className="mx-auto h-px w-6 bg-border" aria-hidden />
      ) : (
        <NavSectionTitle>{title}</NavSectionTitle>
      )}
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function EmployeeNavGroups({ collapsed }: { collapsed: boolean }) {
  return (
    <>
      <NavLinks items={[MY_WORK_DASHBOARD, MY_WORK_LINK]} collapsed={collapsed} />
      <NavGroup label="Time off" items={MY_WORK_TIME_NAV} collapsed={collapsed} />
      <NavGroup label="Pay & docs" items={MY_WORK_DOCS_NAV} collapsed={collapsed} />
      <NavGroup label="Account" items={MY_WORK_ACCOUNT_NAV} collapsed={collapsed} />
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
        <NavGroup label="Attendance" items={GM_ATTENDANCE_NAV} collapsed={collapsed} />
        <NavGroup label="Leave" items={GM_LEAVE_NAV} collapsed={collapsed} />
        <NavGroup label="Work" items={GM_WORK_NAV} collapsed={collapsed} />
      </>
    );
  }
  if (variant === 'cso') {
    return <NavGroup label="Work" items={CSO_WORK_NAV} collapsed={collapsed} />;
  }
  return <NavGroup label="Overview" items={FINANCE_OVERVIEW_NAV} collapsed={collapsed} />;
}

export function Sidebar({ variant }: { variant: Exclude<ShellVariant, 'employee'> }) {
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const dispatch = useAppDispatch();
  const { isProjectLead } = useIsProjectLead();

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
        {collapsed ? null : <Meta>HR Portal</Meta>}
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
      <nav className="flex-1 space-y-10 overflow-y-auto px-2 py-6">
        {variant === 'super-admin' ? (
          <>
            <NavGroup label="Overview" items={SUPER_ADMIN_OVERVIEW_NAV} collapsed={collapsed} />
            <NavGroup label="Organization" items={SUPER_ADMIN_ORG_NAV} collapsed={collapsed} />
            <NavGroup label="Policies" items={SUPER_ADMIN_POLICIES_NAV} collapsed={collapsed} />
            <NavGroup label="System" items={SUPER_ADMIN_SYSTEM_NAV} collapsed={collapsed} />
          </>
        ) : (
          <>
            <NavSection title="Managerial responsibility" collapsed={collapsed}>
              <ManagerialNavGroups variant={variant} collapsed={collapsed} />
            </NavSection>
            {isProjectLead ? (
              <NavSection title="My project" collapsed={collapsed}>
                <NavLinks items={MY_PROJECT_NAV} collapsed={collapsed} />
              </NavSection>
            ) : null}
            <NavSection title="Employee Features" collapsed={collapsed}>
              <EmployeeNavGroups collapsed={collapsed} />
            </NavSection>
          </>
        )}
      </nav>
    </aside>
  );
}
