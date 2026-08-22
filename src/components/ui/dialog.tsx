'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;

/** Dims the page so the open card is the focus. Opacity is in globals.css (.overlay-scrim). */
export const OVERLAY_CLASS = 'overlay-scrim';

export function DialogOverlay({ className }: { className?: string }) {
  return <DialogPrimitive.Overlay className={cn(OVERLAY_CLASS, className)} />;
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-[51] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded border border-border bg-background p-6 shadow-card',
          className,
        )}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <DialogPrimitive.Title
      className={cn('text-xs uppercase tracking-[0.2em] text-muted', className)}
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
