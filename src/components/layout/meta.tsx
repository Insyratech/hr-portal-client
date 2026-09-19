import { cn } from '@/lib/utils';
import { ACCENT, type AccentTone } from '@/lib/ui-accents';
import type { ReactNode } from 'react';

/** Uppercase section / box heading. Default gold; pass tone for hierarchy. */
export function Meta({
  children,
  className,
  tone = 'gold',
}: {
  children: ReactNode;
  className?: string;
  tone?: AccentTone;
}) {
  return (
    <span className={cn('block text-xs uppercase tracking-[0.2em]', className)} style={{ color: ACCENT[tone] }}>
      {children}
    </span>
  );
}
