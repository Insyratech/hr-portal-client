'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/ui/skeleton';
import { formatShiftSummary } from '@/features/attendance/shift-label';
import { workWeekLabel } from '@/features/attendance/work-week-label';
import { useGetMyScheduleQuery } from '@/store/api/api';

/** Dashboard card: current shift and working week only. */
export function DashboardScheduleCard() {
  const { data: scheduleData, isLoading } = useGetMyScheduleQuery();

  if (isLoading) {
    return <CardSkeleton />;
  }

  const schedule = scheduleData?.data;
  const currentShift = schedule?.shift.current ?? null;
  const currentWeek = schedule?.workWeek.current ?? null;
  const empty = !currentShift && !currentWeek;

  return (
    <section className="border border-border bg-background p-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Meta className="mb-0">My schedule</Meta>
        <Link href="/schedule" className="text-sm text-muted hover:text-foreground">
          Open schedule
        </Link>
      </div>

      {empty ? (
        <div className="mt-4">
          <EmptyState
            title="Nothing assigned yet"
            description="When HR sets your shift or working week, they appear here."
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          <div className="rounded border border-border bg-surface/40 p-3.5 transition-colors hover:bg-surface">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Current shift</p>
            {currentShift ? (
              <>
                <p className="mt-2 text-base font-medium text-foreground">{currentShift.shiftName}</p>
                <p className="mt-1 text-sm text-muted">
                  {formatShiftSummary({
                    flexible: currentShift.flexible,
                    minimumDurationMinutes: currentShift.minimumDurationMinutes,
                    startTime: currentShift.startTime ?? '00:00:00',
                    endTime: currentShift.endTime ?? '00:00:00',
                  })}
                </p>
                <p className="mt-2 text-xs text-muted">From {currentShift.effectiveFrom}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Not assigned yet</p>
            )}
          </div>

          <div className="rounded border border-border bg-surface/40 p-3.5 transition-colors hover:bg-surface">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">Working week</p>
            {currentWeek ? (
              <>
                <p className="mt-2 text-base font-medium text-foreground">
                  {workWeekLabel(currentWeek.pattern)}
                </p>
                <p className="mt-2 text-xs text-muted">From {currentWeek.effectiveFrom}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Company calendar</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4">
        <Button asChild type="button" size="sm" variant="outline">
          <Link href="/schedule">Open schedule</Link>
        </Button>
      </div>
    </section>
  );
}
