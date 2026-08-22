'use client';

import { Icon, type IconName } from '@/components/ui/icon';

export function IconButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-foreground shadow-card transition-colors hover:bg-surface"
    >
      <Icon name={icon} className="h-3.5 w-3.5" />
    </button>
  );
}
