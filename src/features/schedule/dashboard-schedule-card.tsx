'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Meta } from '@/components/layout/meta';
import { formatShiftSummary } from '@/features/attendance/shift-label';
import { workWeekLabel } from '@/features/attendance/work-week-label';
import { useGetHolidaysQuery, useGetMyScheduleQuery } from '@/store/api/api';
import { CardSkeleton } from '@/components/ui/skeleton';

function upcomingHolidays(
  rows: { name: string; date: string; optional: boolean }[],
  today: string,
  limit = 3,
) {
  return [...rows]
    .filter((row) => row.date.slice(0, 10) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

/** Compact dashboard card — current shift, working week, and next holidays. */
export function DashboardScheduleCard() {
  const { data: scheduleData, isLoading: scheduleLoading } = useGetMyScheduleQuery();
  const { data: holidaysData, isLoading: holidaysLoading } = useGetHolidaysQuery();
  const today = new Date().toISOString().slice(0, 10);

  if (scheduleLoading || holidaysLoading) {
    return <CardSkeleton />;
  }

  const schedule = scheduleData?.data;
  const currentShift = schedule?.shift.current ?? null;
  const currentWeek = schedule?.workWeek.current ?? null;
  const nextHolidays = upcomingHolidays(holidaysData?.data ?? [], today);

  return (
    <section className="border border-border bg-background p-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Meta className="mb-0">My schedule</Meta>
        <Link href="/schedule" className="text-sm text-muted hover:text-foreground">
          Open schedule
        </Link>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-[0.12em] text-muted">Current shift</dt>
          <dd className="mt-1 text-foreground">
            {currentShift ? (
              <>
                <span className="font-medium">{currentShift.shiftName}</span>
                <span className="text-muted">
                  {' '}
                  ·{' '}
                  {formatShiftSummary({
                    flexible: currentShift.flexible,
                    minimumDurationMinutes: currentShift.minimumDurationMinutes,
                    startTime: currentShift.startTime ?? '00:00:00',
                    endTime: currentShift.endTime ?? '00:00:00',
                  })}
                </span>
              </>
            ) : (
              <span className="text-muted">Not assigned yet</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.12em] text-muted">Working week</dt>
          <dd className="mt-1 text-foreground">
            {currentWeek ? (
              workWeekLabel(currentWeek.pattern)
            ) : (
              <span className="text-muted">Company calendar</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.12em] text-muted">Upcoming holidays</dt>
          <dd className="mt-1">
            {nextHolidays.length === 0 ? (
              <span className="text-muted">None scheduled</span>
            ) : (
              <ul className="space-y-1">
                {nextHolidays.map((row) => (
                  <li key={`${row.date}-${row.name}`} className="text-foreground">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-muted">
                      {' '}
                      · {row.date.slice(0, 10)}
                      {row.optional ? ' · optional' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>

      {!currentShift && !currentWeek && nextHolidays.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Nothing assigned yet"
            description="When HR sets your shift or working week, they appear here. Holidays follow the company calendar."
          />
        </div>
      ) : null}
    </section>
  );
}
