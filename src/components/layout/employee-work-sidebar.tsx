'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EMPLOYEE_WORK_SUBNAV, isMyProjectArea, isWorkSubnavActive } from '@/constants/nav';
import { Icon } from '@/components/ui/icon';
import { isWorkLoopNavHref, skipsWorkApprovalLoop } from '@/features/work/work-loop';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';

export function useWorkNavGroups() {
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  const skipLoop = skipsWorkApprovalLoop(roles);

  const workItems = EMPLOYEE_WORK_SUBNAV.filter((item) => !(skipLoop && isWorkLoopNavHref(item.href)));

  return { workItems };
}

/** Vertical Work nav for employee shell — personal My work only. My project lives in the header. */
export function EmployeeWorkSidebar() {
  const pathname = usePathname();
  const { workItems } = useWorkNavGroups();

  if (isMyProjectArea(pathname) || workItems.length === 0) return null;

  return (
    <aside className="hidden min-h-[calc(100vh-7rem)] w-44 shrink-0 lg:block lg:w-48">
      <nav aria-label="My work" className="sticky top-1/2 -translate-y-1/2">
        <ul className="space-y-1">
          {workItems.map((item) => {
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
