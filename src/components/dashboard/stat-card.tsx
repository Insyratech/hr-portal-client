import { Meta } from '@/components/layout/meta';
import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export function StatCard({
  value,
  label,
  icon,
  onClick,
  compact = false,
  active = false,
}: {
  value: string;
  label: string;
  icon?: IconName;
  onClick?: () => void;
  /** Tighter padding and type for dense boards (Team week, Insights). */
  compact?: boolean;
  /** Selected filter / toggle state when the card is clickable. */
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={onClick ? active : undefined}
      className={cn(
        'group rounded border text-left shadow-card transition-colors',
        compact ? 'p-3' : 'p-6',
        onClick ? 'hover:bg-surface' : 'cursor-default',
        active ? 'border-foreground bg-surface' : 'border-border bg-background',
      )}
    >
      {icon ? (
        <div className={cn('flex items-start justify-between gap-3', compact ? 'mb-2' : 'mb-4')}>
          <span
            className={cn(
              'inline-flex items-center justify-center rounded border border-border bg-surface text-foreground',
              compact ? 'h-7 w-7' : 'h-9 w-9',
            )}
          >
            <Icon name={icon} className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </span>
        </div>
      ) : null}
      <p
        className={cn(
          'font-semibold tracking-tight text-foreground',
          compact ? 'text-xl' : 'text-3xl',
        )}
      >
        {value}
      </p>
      <Meta className={compact ? 'mt-1.5' : 'mt-3'}>{label}</Meta>
    </button>
  );
}
