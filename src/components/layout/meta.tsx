import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/** Uppercase section / box heading — golden accent in light and dark themes. */
export function Meta({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn('text-xs uppercase tracking-[0.2em] text-meta', className)}
      style={{ color: 'var(--meta)' }}
    >
      {children}
    </p>
  );
}
