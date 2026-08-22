'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EMPLOYEE_NAV, isNavActive } from '@/constants/nav';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-[2px] md:hidden">
      <ul className="grid grid-cols-4 px-1 py-1">
        {EMPLOYEE_NAV.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1 rounded text-[10px] uppercase tracking-[0.12em] transition-colors',
                  active ? 'bg-surface text-foreground' : 'text-muted',
                )}
              >
                <Icon name={item.icon} className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
