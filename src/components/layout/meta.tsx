import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function Meta({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-xs uppercase tracking-[0.2em] text-muted', className)}>{children}</p>
  );
}
