import { cn } from '@/lib/utils';

export type StatusTone = 'approved' | 'pending' | 'rejected';

const MARK: Record<StatusTone, string> = {
  approved: '●',
  pending: '○',
  rejected: '×',
};

export function StatusBadge({
  status,
  label,
}: {
  status: StatusTone;
  label: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em]')}>
      <span aria-hidden="true">{MARK[status]}</span>
      {label}
    </span>
  );
}
