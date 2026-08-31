'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  EMPLOYEE_WORK_SUBNAV,
  isMyProjectNavActive,
  isWorkSubnavActive,
  MY_PROJECT_NAV,
  type NavItem,
} from '@/constants/nav';
import { Meta } from '@/components/layout/meta';
import { Icon } from '@/components/ui/icon';
import { isWorkLoopNavHref, skipsWorkApprovalLoop } from '@/features/work/work-loop';
import { useIsProjectLead } from '@/features/work/project-lead';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';

function NavSection({
  label,
  items,
  pathname,
}: {
  label: string;
  items: readonly NavItem[];
  pathname: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <Meta className="px-3">{label}</Meta>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = isMyProjectNavActive(pathname, item.href) || isWorkSubnavActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-foreground text-background'
                    : 'text-muted hover:bg-surface hover:text-foreground',
                )}
              >
                <Icon name={item.icon} className="h-3.5 w-3.5 shrink-0 opacity-80" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function useWorkNavGroups() {
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  const skipLoop = skipsWorkApprovalLoop(roles);
  const { isProjectLead } = useIsProjectLead();

  const workItems = EMPLOYEE_WORK_SUBNAV.filter((item) => {
    if (skipLoop && isWorkLoopNavHref(item.href)) return false;
    return true;
  });

  return {
    workItems,
    projectItems: isProjectLead ? MY_PROJECT_NAV : [],
    isProjectLead,
  };
}

/** Vertical Work nav for employee shell — My work and My project are separate sections. */
export function EmployeeWorkSidebar() {
  const pathname = usePathname();
  const { workItems, projectItems } = useWorkNavGroups();

  if (workItems.length === 0 && projectItems.length === 0) return null;

  return (
    <aside className="hidden min-h-[calc(100vh-7rem)] w-44 shrink-0 lg:block lg:w-48">
      <nav aria-label="Work sections" className="sticky top-1/2 -translate-y-1/2 space-y-8">
        <NavSection label="My work" items={workItems} pathname={pathname} />
        <NavSection label="My project" items={projectItems} pathname={pathname} />
      </nav>
    </aside>
  );
}
