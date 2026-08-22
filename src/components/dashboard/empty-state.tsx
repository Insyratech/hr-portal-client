import type { ReactNode } from 'react';
import { Meta } from '@/components/layout/meta';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded border border-dashed border-border bg-surface px-6 py-14 text-center shadow-card">
      <Meta className="mb-3">{title}</Meta>
      <p className="mx-auto max-w-md text-sm text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
