import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none placeholder:text-muted focus:border-foreground',
        className,
      )}
      {...props}
    />
  );
}
