'use client';

import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { formatClock, formatDuration } from '@/lib/attendance-format';
import { useGetAttendanceCorrectionsQuery, useGetAttendanceDayQuery } from '@/store/api/api';
import { openEntityDrawer } from '@/store/slices/ui-slice';
import { useAppDispatch } from '@/store/hooks';

function tone(status: string): 'pending' | 'approved' | 'rejected' {
  if (status === 'PRESENT' || status === 'LEAVE') return 'approved';
  if (status === 'ABSENT' || status === 'MISSING_PUNCH' || status === 'REJECTED') return 'rejected';
  return 'pending';
}

export default function AdminAttendancePage() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetAttendanceDayQuery();
  const { data: corrections } = useGetAttendanceCorrectionsQuery({ status: 'PENDING' });
  const summary = data?.data;
  const counts = summary?.counts;

  return (
    <>
      <PageHeader kicker="Attendance" title="Today" />
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Present', value: counts?.present ?? 0 },
          { label: 'Late', value: counts?.late ?? 0 },
          { label: 'Absent', value: counts?.absent ?? 0 },
          { label: 'On leave', value: counts?.onLeave ?? 0 },
        ].map((item) => (
          <div key={item.label} className="border border-border p-4">
            <Meta>{item.label}</Meta>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</p>
          </div>
        ))}
      </div>

      <Meta className="mb-3">Missing punches</Meta>
      <DataTable
        columns={[
          { id: 'employee', header: 'Employee', cell: (row) => row.employeeName ?? '—' },
          { id: 'in', header: 'In', cell: (row) => formatClock(row.actualIn) ?? '—' },
          { id: 'status', header: 'Status', cell: (row) => <StatusBadge status={tone(row.status)} label={row.status} /> },
        ]}
        rows={(summary?.records ?? []).filter((row) => row.status === 'MISSING_PUNCH')}
        emptyTitle="No missing punches"
        emptyDescription="Employees with punch-in but no punch-out appear here."
      />

      <div className="mt-10">
        <Meta className="mb-3">Pending corrections</Meta>
        <DataTable
          columns={[
            { id: 'employee', header: 'Employee', cell: (row) => row.employeeName ?? '—' },
            { id: 'date', header: 'Date', cell: (row) => row.attendanceDate },
            {
              id: 'times',
              header: 'Proposed',
              cell: (row) => `${formatClock(row.proposedIn) ?? '—'} → ${formatClock(row.proposedOut) ?? '—'}`,
            },
            {
              id: 'review',
              header: 'Review',
              cell: (row) => (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    dispatch(
                      openEntityDrawer({
                        title: `Correction · ${row.status}`,
                        body: [
                          row.employeeName ?? 'Employee',
                          row.attendanceDate,
                          `${formatClock(row.proposedIn)} → ${formatClock(row.proposedOut)}`,
                          row.reason,
                        ].join('\n'),
                        correctionId: row.id,
                        correctionStatus: row.status,
                      }),
                    )
                  }
                >
                  Open
                </Button>
              ),
            },
          ]}
          rows={corrections?.data ?? []}
          emptyTitle="No pending corrections"
          emptyDescription="Correction requests open in the review drawer."
        />
      </div>

      <div className="mt-10">
        <Meta className="mb-3">All records</Meta>
        <DataTable
          columns={[
            { id: 'employee', header: 'Employee', cell: (row) => row.employeeName ?? '—' },
            { id: 'in', header: 'In', cell: (row) => formatClock(row.actualIn) ?? '—' },
            { id: 'out', header: 'Out', cell: (row) => formatClock(row.actualOut) ?? '—' },
            { id: 'worked', header: 'Worked', cell: (row) => formatDuration(row.workedMinutes) ?? '—' },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={tone(row.status)} label={row.status} />,
            },
          ]}
          rows={summary?.records ?? []}
          emptyTitle={isLoading ? 'Loading' : 'No attendance'}
          emptyDescription="Records appear after employees punch or corrections are applied."
        />
      </div>
    </>
  );
}
