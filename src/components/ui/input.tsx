import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const isFile = type === 'file';
  return (
    <input
      type={type}
      className={cn(
        'w-full rounded border border-border bg-background text-sm text-foreground shadow-card outline-none placeholder:text-muted focus:border-foreground',
        isFile ? 'field-file' : 'h-10 px-3',
        type === 'number' &&
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        className,
      )}
      {...props}
    />
  );
}
