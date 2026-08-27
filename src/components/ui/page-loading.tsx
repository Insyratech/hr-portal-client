import { ThreeDotsSpinner } from '@/components/ui/three-dots-spinner';
import { cn } from '@/lib/utils';

/** Centered inline loader for page sections / Suspense fallbacks. */
export function PageLoading({
  message,
  className,
  compact = false,
}: {
  message?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        compact ? 'py-10' : 'min-h-[12rem] py-16',
        className,
      )}
      role="status"
      aria-busy="true"
    >
      <ThreeDotsSpinner size={compact ? 'md' : 'lg'} label={message ?? 'Loading'} />
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
