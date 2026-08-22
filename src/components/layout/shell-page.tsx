import type { ReactNode } from 'react';
import { EmptyState } from '@/components/dashboard/empty-state';
import { PageHeader } from '@/components/layout/page-header';

export function ShellPage({
  kicker,
  title,
  emptyTitle,
  emptyDescription,
}: {
  kicker: string;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
}): ReactNode {
  return (
    <>
      <PageHeader kicker={kicker} title={title} />
      <EmptyState title={emptyTitle} description={emptyDescription} />
    </>
  );
}
