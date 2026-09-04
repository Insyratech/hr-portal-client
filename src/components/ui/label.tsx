import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Label({ className, style, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-2 block text-xs uppercase tracking-[0.2em] text-meta', className)}
      style={{ color: 'var(--meta)', ...style }}
      {...props}
    />
  );
}
