'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { EmptyState } from '@/components/dashboard/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { PageLoading } from '@/components/ui/page-loading';
import { formatAssignmentStatus } from '@/features/attendance/assignment-status';
import { formatShiftSummary } from '@/features/attendance/shift-label';
import { workWeekLabel } from '@/features/attendance/work-week-label';
import { useGetHolidaysQuery, useGetMyScheduleQuery } from '@/store/api/api';

function formatShiftHoursLabel(row: {
  flexible: boolean;
  minimumDurationMinutes: number;
  startTime: string | null;
  endTime: string | null;
}): string {
  return formatShiftSummary({
    flexible: row.flexible,
    minimumDurationMinutes: row.minimumDurationMinutes,
    startTime: row.startTime ?? '00:00:00',
    endTime: row.endTime ?? '00:00:00',
  });
}

/** Read-only employee view of shift, working week, and company holidays. */
export function MySchedulePage() {
  const { data: scheduleData, isLoading: scheduleLoading, isError: scheduleError } = useGetMyScheduleQuery();
  const { data: holidaysData, isLoading: holidaysLoading, isError: holidaysError } = useGetHolidaysQuery();
  const today = new Date().toISOString().slice(0, 10);

  if (scheduleLoading || holidaysLoading) {
    return <PageLoading compact message="Loading your schedule…" />;
  }

  if (scheduleError || holidaysError || !scheduleData?.data) {
    return (
      <div className="space-y-4">
        <PageHeader kicker="Schedule" title="My schedule" />
        <p className="max-w-xl text-sm text-muted">Could not load your schedule. Please try again.</p>
      </div>
    );
  }

  const { shift, workWeek } = scheduleData.data;
  const holidays = [...(holidaysData?.data ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = holidays.filter((row) => row.date.slice(0, 10) >= today);
  const past = holidays.filter((row) => row.date.slice(0, 10) < today).reverse();

  return (
    <div className="space-y-10">
      <div>
        <PageHeader kicker="Schedule" title="My schedule" />
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Your current shift and working week, plus the company holiday calendar. HR manages these — contact them
          if something looks wrong. To change a shift temporarily, use{' '}
          <Link href="/shift-change" className="text-foreground underline-offset-2 hover:underline">
            Request for shift change
          </Link>
          .
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border border-border bg-background p-5 shadow-card">
          <Meta>Current shift</Meta>
          {shift.current ? (
            <>
              <p className="mt-3 text-lg font-medium text-foreground">{shift.current.shiftName}</p>
              <p className="mt-1 text-sm text-muted">{formatShiftHoursLabel(shift.current)}</p>
              <p className="mt-2 text-sm text-muted">Effective from {shift.current.effectiveFrom}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">No shift assigned yet. HR will set this on your profile.</p>
          )}
        </div>
        <div className="border border-border bg-background p-5 shadow-card">
          <Meta>Working week</Meta>
          {workWeek.current ? (
            <>
              <p className="mt-3 text-lg font-medium text-foreground">{workWeekLabel(workWeek.current.pattern)}</p>
              <p className="mt-2 text-sm text-muted">Effective from {workWeek.current.effectiveFrom}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Using the company working days until HR sets a personal working week.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <Meta>Shift history</Meta>
        <DataTable
          columns={[
            { id: 'shift', header: 'Shift', cell: (row) => row.shiftName },
            { id: 'hours', header: 'Hours', cell: (row) => formatShiftHoursLabel(row) },
            { id: 'from', header: 'Effective from', cell: (row) => row.effectiveFrom },
            { id: 'status', header: 'Status', cell: (row) => formatAssignmentStatus(row.effectiveTo) },
          ]}
          rows={shift.history}
          emptyTitle="No shift history"
          emptyDescription="When HR assigns a shift, it appears here."
        />
      </section>

      <section className="space-y-4">
        <Meta>Working week history</Meta>
        <DataTable
          columns={[
            { id: 'week', header: 'Week-offs', cell: (row) => workWeekLabel(row.pattern) },
            { id: 'from', header: 'Effective from', cell: (row) => row.effectiveFrom },
            { id: 'status', header: 'Status', cell: (row) => formatAssignmentStatus(row.effectiveTo) },
          ]}
          rows={workWeek.history}
          emptyTitle="Using company working days"
          emptyDescription="A personal working week appears here after HR sets one."
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Meta className="mb-0">Holiday calendar</Meta>
          <Link href="/leave/holidays" className="text-sm text-muted hover:text-foreground">
            Full holidays list
          </Link>
        </div>
        {upcoming.length === 0 && past.length === 0 ? (
          <EmptyState title="No holidays" description="Company holidays will appear here when published." />
        ) : (
          <>
            <DataTable
              columns={[
                { id: 'date', header: 'Date', cell: (row) => row.date.slice(0, 10) },
                { id: 'name', header: 'Holiday', cell: (row) => row.name },
                {
                  id: 'type',
                  header: 'Type',
                  cell: (row) => (row.optional ? 'Optional' : row.type || 'Public'),
                },
              ]}
              rows={upcoming}
              emptyTitle="No upcoming holidays"
              emptyDescription="Past holidays are listed below."
            />
            {past.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Earlier this year and before</p>
                <DataTable
                  columns={[
                    { id: 'date', header: 'Date', cell: (row) => row.date.slice(0, 10) },
                    { id: 'name', header: 'Holiday', cell: (row) => row.name },
                    {
                      id: 'type',
                      header: 'Type',
                      cell: (row) => (row.optional ? 'Optional' : row.type || 'Public'),
                    },
                  ]}
                  rows={past.slice(0, 12)}
                  emptyTitle="No past holidays"
                  emptyDescription=""
                />
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
