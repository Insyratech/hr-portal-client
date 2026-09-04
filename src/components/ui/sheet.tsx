'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { OVERLAY_CLASS } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;

export function SheetContent({
  className,
  title,
  children,
  showClose = true,
}: {
  className?: string;
  title: string;
  children: ReactNode;
  /** Top-right round close control. Defaults on for review drawers. */
  showClose?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={OVERLAY_CLASS} />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 right-0 z-[51] flex w-full max-w-md flex-col border-l border-border bg-background shadow-card',
          className,
        )}
      >
        <div className="relative flex shrink-0 items-center border-b border-border px-6 py-4">
          <DialogPrimitive.Title
            className={cn(
              'text-xs uppercase tracking-[0.2em] text-meta',
              showClose ? 'pr-12' : undefined,
            )}
            style={{ color: 'var(--meta)' }}
          >
            {title}
          </DialogPrimitive.Title>
          {showClose ? (
            <DialogPrimitive.Close
              type="button"
              aria-label="Close"
              className="absolute right-4 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </DialogPrimitive.Close>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
