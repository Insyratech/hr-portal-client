import Link from 'next/link';
import { EmptyState } from '@/components/dashboard/empty-state';
import { LeaveBalanceRing } from '@/components/leave/leave-balance-ring';
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
  /**
   * `simple` — dashboard: code + balance number only.
   * `rings` — leave page: segmented circular meters + colored balance.
   */
  variant?: 'simple' | 'rings';
  /** Optional footer CTA (e.g. dashboard → leave page). */
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export function LeaveBalanceCard({
  items,
  variant = 'simple',
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
      ) : variant === 'rings' ? (
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.code} className="flex justify-center">
              <LeaveBalanceRing
                code={item.code}
                available={item.available}
                allocated={item.allocated}
              />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map((item) => (
            <li key={item.code}>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">{item.code}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                {Math.max(0, Number(item.available) || 0)}
              </p>
            </li>
          ))}
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
