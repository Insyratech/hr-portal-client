'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { OVERLAY_CLASS } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;

export function SheetContent({
  className,
  title,
  children,
}: {
  className?: string;
  title: string;
  children: ReactNode;
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
        <DialogPrimitive.Title className="border-b border-border px-6 py-4 text-xs uppercase tracking-[0.2em] text-muted">
          {title}
        </DialogPrimitive.Title>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
