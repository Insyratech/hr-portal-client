'use client';

import type { ReactNode } from 'react';
import { Meta } from '@/components/layout/meta';
import { cn } from '@/lib/utils';

/** Clear desk panel so leads can tell sections apart at a glance. */
export function WorkDeskSection({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        'flex h-full min-h-0 flex-col rounded border border-border bg-background shadow-card',
        className,
      )}
    >
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
        <div className="min-w-0 flex-1 space-y-1">
          <Meta>{title}</Meta>
          {description ? <div className="text-sm text-muted">{description}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn('min-h-0 flex-1 space-y-4 overflow-auto px-4 py-3 sm:px-5 sm:py-4', bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
