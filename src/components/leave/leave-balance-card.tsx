import { EmptyState } from '@/components/dashboard/empty-state';
import { Meta } from '@/components/layout/meta';

export type LeaveBalanceItem = {
  code: string;
  days: number;
};

export function LeaveBalanceCard({ items }: { items: LeaveBalanceItem[] }) {
  return (
    <section className="border border-border bg-background p-6 shadow-card">
      <Meta className="mb-6">Leave balance</Meta>
      {items.length === 0 ? (
        <EmptyState
          title="No balances"
          description="Leave allocations appear after the first approved or pending application for a type, or after an admin allocation."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map((item) => (
            <li key={item.code}>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">{item.code}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{item.days}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
