import { Meta } from '@/components/layout/meta';
import { StatusBadge } from '@/components/dashboard/status-badge';
import type { LeaveApplication } from '@/types/api';

export function HandoversTakenList({ items }: { items: LeaveApplication[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mb-10 space-y-4">
      <div>
        <Meta>Handovers taken · {items.length}</Meta>
        <p className="mt-2 text-sm text-muted">Leave you are covering for a colleague.</p>
      </div>
      {items.map((row) => (
        <div key={row.id} className="border border-border bg-background p-5 shadow-card">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium">
              {row.employeeName ?? 'Colleague'} · {row.leaveTypeName ?? row.leaveTypeCode} · {row.startDate} –{' '}
              {row.endDate}
            </p>
            <StatusBadge
              status={row.status === 'APPROVED' ? 'approved' : 'pending'}
              label={row.status}
            />
          </div>
          <p className="mt-2 text-sm text-muted">
            {row.quantity} day{row.quantity === 1 ? '' : 's'} · you accepted handover
          </p>
        </div>
      ))}
    </section>
  );
}
