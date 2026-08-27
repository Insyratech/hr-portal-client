import { StatCard } from '@/components/dashboard/stat-card';
import { Meta } from '@/components/layout/meta';
import type { LeaveApplication } from '@/types/api';

export function LeaveStats({ items }: { items: LeaveApplication[] }) {
  const year = String(new Date().getFullYear());
  const thisYear = items.filter((row) => row.startDate.startsWith(year));
  const pending = items.filter((row) => row.status === 'PENDING').length;
  const approvedDays = thisYear
    .filter((row) => row.status === 'APPROVED')
    .reduce((sum, row) => sum + row.quantity, 0);

  return (
    <section className="mb-10 space-y-4">
      <Meta>Leave stats</Meta>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard value={String(pending)} label="Pending now" icon="leave" />
        <StatCard value={String(approvedDays)} label={`Approved days in ${year}`} icon="calendar" />
        <StatCard value={String(thisYear.length)} label={`Requests in ${year}`} icon="grid" />
      </div>
    </section>
  );
}
