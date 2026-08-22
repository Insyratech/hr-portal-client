import { EmptyState } from '@/components/dashboard/empty-state';
import { Meta } from '@/components/layout/meta';

export type TimelineItem = {
  id: string;
  title: string;
  detail: string;
};

export function ActivityTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <section>
      <Meta className="mb-4">Recent activity</Meta>
      {items.length === 0 ? (
        <EmptyState title="No activity" description="Approvals and corrections will appear here." />
      ) : (
        <ol className="border border-border bg-background shadow-card">
          {items.map((item) => (
            <li key={item.id} className="border-b border-border px-4 py-4 last:border-b-0">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted">{item.detail}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
