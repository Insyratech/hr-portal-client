import { cn } from '@/lib/utils';
import { ACCENT, type AccentTone } from '@/lib/ui-accents';
import type { ReactNode } from 'react';

/**
 * Major sidebar / mobile nav block title (HR Responsibility, My project, Employee Features).
 */
export function NavSectionTitle({
  children,
  className,
  tone = 'gold',
}: {
  children: ReactNode;
  className?: string;
  tone?: AccentTone;
}) {
  return (
    <span
      className={cn('block px-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em]', className)}
      style={{ color: ACCENT[tone] }}
    >
      {children}
    </span>
  );
}
