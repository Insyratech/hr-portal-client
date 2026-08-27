'use client';

import { ThreeDotsSpinner } from '@/components/ui/three-dots-spinner';
import { cn } from '@/lib/utils';

/**
 * Full-viewport loader.
 * Solid white (light) / solid black (dark) — never surface gray or blurred scrim.
 */
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
      className={cn(
        'fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 bg-white dark:bg-black',
        className,
      )}
      role="alertdialog"
      aria-busy="true"
      aria-live="assertive"
      aria-label={message}
    >
      <ThreeDotsSpinner size="lg" label={message} />
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
    </div>
  );
}
