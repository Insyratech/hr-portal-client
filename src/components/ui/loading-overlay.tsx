'use client';

import { ThreeDotsSpinner } from '@/components/ui/three-dots-spinner';
import { cn } from '@/lib/utils';

/** Full-viewport glassy overlay for auth / long waits. */
export function LoadingOverlay({
  open,
  message = 'We are almost there…',
  className,
}: {
  open: boolean;
  message?: string;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div
      className={cn('overlay-scrim z-[70] flex flex-col items-center justify-center gap-5', className)}
      role="alertdialog"
      aria-busy="true"
      aria-live="assertive"
      aria-label={message}
    >
      <div className="rounded-2xl border border-border/60 bg-background/55 px-10 py-8 shadow-card backdrop-blur-md">
        <ThreeDotsSpinner size="lg" label={message} />
      </div>
      <p className="text-sm text-foreground/90">{message}</p>
    </div>
  );
}
