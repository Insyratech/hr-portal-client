'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CSO_NAV,
  FINANCE_NAV,
  GM_NAV,
  HR_NAV,
  MY_WORK_ACCOUNT_NAV,
  MY_WORK_DASHBOARD,
  MY_WORK_DOCS_NAV,
  MY_WORK_TIME_NAV,
  MY_WORK_WORK_NAV,
  SUPER_ADMIN_CONFIG_NAV,
  SUPER_ADMIN_OVERVIEW_NAV,
  isNavActive,
  type NavItem,
} from '@/constants/nav';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import type { ShellVariant } from '@/features/auth/role-access';
import { isWorkLoopNavHref, skipsWorkApprovalLoop } from '@/features/work/work-loop';
import { useAppSelector } from '@/store/hooks';

function personalNav(roles: string[]): NavItem[] {
  const work = skipsWorkApprovalLoop(roles)
    ? MY_WORK_WORK_NAV.filter((item) => !isWorkLoopNavHref(item.href))
    : MY_WORK_WORK_NAV;
  return [MY_WORK_DASHBOARD, ...work, ...MY_WORK_TIME_NAV, ...MY_WORK_DOCS_NAV, ...MY_WORK_ACCOUNT_NAV];
}

function itemsFor(variant: Exclude<ShellVariant, 'employee'>, roles: string[]) {
  if (variant === 'super-admin') {
    return [...SUPER_ADMIN_OVERVIEW_NAV, ...SUPER_ADMIN_CONFIG_NAV];
  }
  // Managerial tools first, then personal employee tools (matches desktop sidebar).
  const personal = personalNav(roles);
  if (variant === 'hr') return [...HR_NAV, ...personal];
  if (variant === 'gm' || variant === 'admin') return [...GM_NAV, ...personal];
  if (variant === 'cso') return [...CSO_NAV, ...personal];
  if (variant === 'finance') return [...FINANCE_NAV, ...personal];
  return [...SUPER_ADMIN_OVERVIEW_NAV, ...SUPER_ADMIN_CONFIG_NAV];
}

export function MobileSectionNav({ variant }: { variant: Exclude<ShellVariant, 'employee'> }) {
  const pathname = usePathname();
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  const items = itemsFor(variant, roles);

  return (
    <nav className="border-b border-border bg-background md:hidden">
      <ul className="flex gap-1 overflow-x-auto px-3 py-2">
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-2 rounded border px-3 py-2 text-xs uppercase tracking-[0.12em] transition-colors',
                  active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-surface text-muted',
                )}
              >
                <Icon name={item.icon} className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
