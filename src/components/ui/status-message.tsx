import { cn } from '@/lib/utils';

export type StatusTone = 'danger' | 'success' | 'warning';

export function StatusMessage({
  tone,
  children,
}: {
  tone: StatusTone;
  children: string;
}) {
  return (
    <p
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'text-sm',
        tone === 'danger' && 'text-danger',
        tone === 'success' && 'text-success',
        tone === 'warning' && 'text-warning',
      )}
    >
      {children}
    </p>
  );
}
