'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV, MY_WORK_NAV, SUPER_ADMIN_CONFIG_NAV, SUPER_ADMIN_OVERVIEW_NAV, isNavActive } from '@/constants/nav';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export function MobileSectionNav({ variant }: { variant: 'admin' | 'super-admin' }) {
  const pathname = usePathname();
  const items =
    variant === 'admin'
      ? [...MY_WORK_NAV, ...ADMIN_NAV]
      : [...MY_WORK_NAV, ...SUPER_ADMIN_OVERVIEW_NAV, ...SUPER_ADMIN_CONFIG_NAV];

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
