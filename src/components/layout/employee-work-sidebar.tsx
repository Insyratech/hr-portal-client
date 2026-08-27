'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EMPLOYEE_WORK_SUBNAV, isWorkSubnavActive } from '@/constants/nav';
import { Icon } from '@/components/ui/icon';
import { isWorkLoopNavHref, skipsWorkApprovalLoop } from '@/features/work/work-loop';
import { cn } from '@/lib/utils';
import { useGetLeadProjectsQuery } from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';

function useWorkSidebarItems() {
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  const user = useAppSelector((state) => state.auth.user);
  const skipLoop = skipsWorkApprovalLoop(roles);
  const { data } = useGetLeadProjectsQuery(undefined, { skip: !user });
  const isLead = (data?.data ?? []).length > 0;

  return EMPLOYEE_WORK_SUBNAV.filter((item) => {
    if (item.href === '/work/projects') return isLead;
    if (skipLoop && isWorkLoopNavHref(item.href)) return false;
    return true;
  });
}

/** Vertical Work nav for employee shell — no chrome; active item is highlighted. */
export function EmployeeWorkSidebar() {
  const pathname = usePathname();
  const items = useWorkSidebarItems();
  if (items.length === 0) return null;

  return (
    <aside className="hidden min-h-[calc(100vh-7rem)] w-44 shrink-0 md:block lg:w-48">
      <nav aria-label="Work sections" className="sticky top-1/2 -translate-y-1/2">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = isWorkSubnavActive(pathname, item.href);
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
      </nav>
    </aside>
  );
}
