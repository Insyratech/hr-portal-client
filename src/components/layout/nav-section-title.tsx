import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * Major sidebar / mobile nav block title (HR Responsibility, My project, Employee Features).
 * White, bold, and larger than subgroup Meta labels and nav links in the same block.
 */
export function NavSectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  /** @deprecated Section titles are always white; kept for call-site compatibility. */
  tone?: string;
}) {
  return (
    <span
      className={cn(
        'block px-3 text-sm font-bold uppercase tracking-[0.12em] text-foreground',
        className,
      )}
    >
      {children}
    </span>
  );
}
