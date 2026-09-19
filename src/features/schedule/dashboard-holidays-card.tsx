'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import {
  daysUntil,
  daysUntilLabel,
  formatHolidayWhen,
  upcomingHolidays,
} from '@/features/schedule/holiday-format';
import { useGetHolidaysQuery } from '@/store/api/api';

/** Dashboard card: next company holidays, separate from shift/week schedule. */
export function DashboardHolidaysCard() {
  const { data: holidaysData, isLoading } = useGetHolidaysQuery();
  const today = new Date().toISOString().slice(0, 10);

  if (isLoading) {
    return <CardSkeleton />;
  }

  const nextHolidays = upcomingHolidays(holidaysData?.data ?? [], today, 4);

  return (
    <section className="border border-border bg-background p-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Meta className="mb-0" tone="orange">
          Upcoming holidays
        </Meta>
        <Link href="/leave/holidays" className="text-sm text-muted hover:text-foreground">
          Full list
        </Link>
      </div>

      {nextHolidays.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="None scheduled"
            description="Company holidays will show here when published on the calendar."
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {nextHolidays.map((row) => {
            const days = daysUntil(row.date, today);
            return (
              <li key={`${row.date}-${row.name}`}>
                <Link
                  href="/leave/holidays"
                  className="flex items-start justify-between gap-3 rounded border border-border bg-surface/40 px-3.5 py-3 text-sm transition-colors hover:bg-surface"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-foreground">{row.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {formatHolidayWhen(row.date)}
                      {row.optional ? ' · optional' : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs uppercase tracking-[0.12em] text-muted">
                    {daysUntilLabel(days)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild type="button" size="sm" variant="outline">
          <Link href="/leave/holidays">View holidays</Link>
        </Button>
        <Button asChild type="button" size="sm" variant="ghost">
          <Link href="/schedule">My schedule</Link>
        </Button>
      </div>
    </section>
  );
}
