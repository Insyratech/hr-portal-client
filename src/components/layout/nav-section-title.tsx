import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * Major sidebar / mobile nav block title (Managerial responsibility, Employee Features, …).
 * Theme foreground (white/black) — larger and bolder than gold Meta subgroup labels.
 */
export function NavSectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'px-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-foreground',
        className,
      )}
    >
      {children}
    </p>
  );
}
