'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;

/** Dims and blurs the page so the open card is the focus. Opacity/blur live in globals.css (.overlay-scrim). */
export const OVERLAY_CLASS = 'overlay-scrim';

export function DialogOverlay({ className }: { className?: string }) {
  return <DialogPrimitive.Overlay className={cn(OVERLAY_CLASS, className)} />;
}

export function DialogContent({
  className,
  children,
  showClose = true,
}: {
  className?: string;
  children: ReactNode;
  /** Top-right round close control. Defaults on for leave / attendance cards. */
  showClose?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-[51] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded border border-border bg-background p-6 shadow-card',
          className,
        )}
      >
        {showClose ? (
          <DialogPrimitive.Close
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80"
          >
            <Icon name="close" className="h-3.5 w-3.5" />
          </DialogPrimitive.Close>
        ) : null}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <DialogPrimitive.Title
      className={cn('pr-10 text-xs uppercase tracking-[0.2em] text-meta', className)}
      style={{ color: 'var(--meta)' }}
    >
      {children}
    </DialogPrimitive.Title>
  );
}

export function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Description className={cn('mt-4 text-sm text-foreground', className)}>
      {children}
    </DialogPrimitive.Description>
  );
}
