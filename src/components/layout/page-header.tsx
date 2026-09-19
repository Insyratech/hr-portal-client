import type { ReactNode } from 'react';
import { Meta } from '@/components/layout/meta';
import type { AccentTone } from '@/lib/ui-accents';

export function PageHeader({
  kicker,
  title,
  actions,
  kickerTone = 'gold',
}: {
  kicker: string;
  title: string;
  actions?: ReactNode;
  /** Employee dashboards use orange; managerial pages keep gold. */
  kickerTone?: AccentTone;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div className="min-w-0 space-y-3">
        <Meta tone={kickerTone}>{kicker}</Meta>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
