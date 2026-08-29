'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/icon';
import { isNavActive, type NavItem } from '@/constants/nav';
import { cn } from '@/lib/utils';

export function MobileBottomNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-[2px] lg:hidden">
      <ul
        className="grid px-0.5 py-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-0.5 rounded px-0.5 text-[9px] uppercase tracking-[0.08em] transition-colors sm:text-[10px] sm:tracking-[0.12em]',
                  active ? 'bg-surface text-foreground' : 'text-muted',
                )}
              >
                <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
