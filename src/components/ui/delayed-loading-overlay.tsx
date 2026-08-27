'use client';

import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useDelayedLoading } from '@/hooks/use-delayed-loading';

/** Shows the full-page spinner only after `active` stays true for 2s (long actions). */
export function DelayedLoadingOverlay({
  active,
  message = 'We are almost there…',
  delayMs = 2000,
}: {
  active: boolean;
  message?: string;
  delayMs?: number;
}) {
  const open = useDelayedLoading(active, delayMs);
  return <LoadingOverlay open={open} message={message} />;
}
