import { Meta } from '@/components/layout/meta';
import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export function StatCard({
  value,
  label,
  icon,
  onClick,
}: {
  value: string;
  label: string;
  icon?: IconName;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'group rounded border border-border bg-background p-6 text-left shadow-card transition-colors',
        onClick ? 'hover:bg-surface' : 'cursor-default',
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        {icon ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded border border-border bg-surface text-foreground">
            <Icon name={icon} className="h-4 w-4" />
          </span>
        ) : (
          <span />
        )}
      </div>
      <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      <Meta className="mt-3">{label}</Meta>
    </button>
  );
}
