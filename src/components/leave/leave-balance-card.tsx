import Link from 'next/link';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type LeaveBalanceItem = {
  code: string;
  /** Days still available (balance). */
  available: number;
  /** Annual / period entitlement. */
  allocated: number;
};

type LeaveBalanceCardProps = {
  items: LeaveBalanceItem[];
  /** Optional footer CTA (e.g. dashboard → leave page). */
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

function balanceCopy(available: number, allocated: number): string {
  if (allocated <= 0) return `${available} available`;
  return `${available} out of ${allocated} is balance`;
}

export function LeaveBalanceCard({
  items,
  actionHref,
  actionLabel = 'Open leave',
  className,
}: LeaveBalanceCardProps) {
  return (
    <section className={cn('border border-border bg-background p-5 shadow-card sm:p-6', className)}>
      <Meta className="mb-5">Leave balance</Meta>
      {items.length === 0 ? (
        <EmptyState
          title="No balances"
          description="Leave allocations appear after the first approved or pending application for a type, or after an admin allocation."
        />
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(8.75rem,1fr))] gap-3">
          {items.map((item) => {
            const allocated = Math.max(0, Number(item.allocated) || 0);
            const available = Math.max(0, Number(item.available) || 0);
            const pct =
              allocated > 0 ? Math.min(100, Math.round((available / allocated) * 100)) : 0;
            return (
              <li
                key={item.code}
                className="rounded border border-border bg-surface/40 p-3 transition-colors hover:bg-surface"
                title={`${item.code}: ${balanceCopy(available, allocated)}`}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted">{item.code}</p>
                <p className="mt-2 text-lg font-semibold tracking-tight tabular-nums sm:text-xl">
                  <span className="text-foreground">{available}</span>
                  <span className="mx-1 text-sm font-normal text-muted">out of</span>
                  <span className="text-foreground">{allocated}</span>
                </p>
                <p className="mt-1 text-xs text-muted">is balance</p>
                <div
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-border"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${item.code} ${pct}% remaining`}
                >
                  <div
                    className="h-full rounded-full bg-foreground/80 transition-[width] duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {actionHref ? (
        <div className="mt-5">
          <Button asChild type="button" size="sm" variant="outline">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
