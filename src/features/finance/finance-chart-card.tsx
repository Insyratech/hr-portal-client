import type { ReactNode } from 'react';
import { Meta } from '@/components/layout/meta';
import { cn } from '@/lib/utils';

export function FinanceChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded border border-border bg-background p-4 shadow-card sm:p-5', className)}>
      <Meta>{title}</Meta>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      <div className="mt-4 h-56 w-full min-w-0 sm:h-64">{children}</div>
    </section>
  );
}

export function FinanceEmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded border border-dashed border-border px-4 text-center text-sm text-muted">
      {message}
    </div>
  );
}
