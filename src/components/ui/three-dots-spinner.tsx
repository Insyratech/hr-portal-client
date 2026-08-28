import { cn } from '@/lib/utils';

type SpinnerSize = 'sm' | 'md' | 'lg';

/** Inline three-dot loader — safe inside buttons, paragraphs, and text rows. */
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
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn('hr-dots', size === 'sm' && 'hr-dots--sm', size === 'md' && 'hr-dots--md', size === 'lg' && 'hr-dots--lg', className)}
    >
      <span className="hr-dots__dot" aria-hidden />
      <span className="hr-dots__dot" aria-hidden />
      <span className="hr-dots__dot" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}
