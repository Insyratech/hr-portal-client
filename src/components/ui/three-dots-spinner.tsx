import { cn } from '@/lib/utils';

type SpinnerSize = 'sm' | 'md' | 'lg';

/** Glassy three-dot loader — white in dark mode, black in light (uses --foreground). */
export function ThreeDotsSpinner({
  size = 'md',
  className,
  label = 'Loading',
}: {
  size?: SpinnerSize;
  className?: string;
  /** Accessible name for screen readers */
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn('hr-dots', size === 'sm' && 'hr-dots--sm', size === 'md' && 'hr-dots--md', size === 'lg' && 'hr-dots--lg', className)}
    >
      <span className="hr-dots__dot" />
      <span className="hr-dots__dot" />
      <span className="hr-dots__dot" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
