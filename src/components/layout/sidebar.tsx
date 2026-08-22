'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  ADMIN_NAV,
  MY_WORK_NAV,
  SUPER_ADMIN_ATTENDANCE_NAV,
  SUPER_ADMIN_GRIEVANCE_NAV,
  SUPER_ADMIN_LEAVE_NAV,
  SUPER_ADMIN_ORG_NAV,
  SUPER_ADMIN_OVERVIEW_NAV,
  SUPER_ADMIN_POLICIES_NAV,
  SUPER_ADMIN_SYSTEM_NAV,
  isNavActive,
  type NavItem,
} from '@/constants/nav';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/ui-slice';

function NavLinks({ items, collapsed }: { items: readonly NavItem[]; collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-foreground text-background'
                  : 'text-foreground hover:bg-surface',
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
  return (
    <div className="space-y-2">
      {collapsed ? null : <Meta className="px-3">{label}</Meta>}
      <NavLinks items={items} collapsed={collapsed} />
    </div>
  );
}

export function Sidebar({ variant }: { variant: 'admin' | 'super-admin' }) {
  const collapsed = useAppSelector((state) => state.ui.sidebarCollapsed);
  const dispatch = useAppDispatch();

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 border-r border-border bg-background md:flex md:flex-col',
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
      <nav className="flex-1 space-y-8 overflow-y-auto px-2 py-6">
        <NavGroup label="My work" items={MY_WORK_NAV} collapsed={collapsed} />
        {variant === 'admin' ? (
          <NavGroup label="Admin" items={ADMIN_NAV} collapsed={collapsed} />
        ) : (
          <>
            <NavGroup label="Overview" items={SUPER_ADMIN_OVERVIEW_NAV} collapsed={collapsed} />
            <NavGroup label="Leave" items={SUPER_ADMIN_LEAVE_NAV} collapsed={collapsed} />
            <NavGroup label="Grievances" items={SUPER_ADMIN_GRIEVANCE_NAV} collapsed={collapsed} />
            <NavGroup label="Attendance" items={SUPER_ADMIN_ATTENDANCE_NAV} collapsed={collapsed} />
            <NavGroup label="Organization" items={SUPER_ADMIN_ORG_NAV} collapsed={collapsed} />
            <NavGroup label="Policies" items={SUPER_ADMIN_POLICIES_NAV} collapsed={collapsed} />
            <NavGroup label="System" items={SUPER_ADMIN_SYSTEM_NAV} collapsed={collapsed} />
          </>
        )}
      </nav>
    </aside>
  );
}
