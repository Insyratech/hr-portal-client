import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('hr-skeleton', className)} aria-hidden />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={cn('space-y-3 border border-border bg-background p-5 shadow-card', className)}
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-3/4 max-w-xs" />
      <Skeleton className="h-4 w-full max-w-sm" />
      <Skeleton className="mt-2 h-8 w-28" />
    </section>
  );
}

export function TableSkeleton({
  columns = 5,
  rows = 6,
  className,
}: {
  columns?: number;
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('overflow-hidden rounded border border-border bg-background shadow-card', className)}
      aria-busy="true"
      aria-label="Loading table"
    >
      <div className="border-b border-border bg-surface px-4 py-3.5">
        <div className="flex gap-6">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-16" />
          ))}
        </div>
      </div>
      <ul className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, row) => (
          <li key={row} className="flex gap-6 px-4 py-3.5">
            {Array.from({ length: columns }).map((_, col) => (
              <Skeleton
                key={col}
                className={cn('h-4', col === 0 ? 'w-20' : col === 1 ? 'w-36' : 'w-24')}
              />
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
