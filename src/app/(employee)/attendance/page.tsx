'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetAttendanceMeQuery } from '@/store/api/api';

function tone(status: string): 'pending' | 'approved' | 'rejected' {
  if (status === 'PRESENT' || status === 'LEAVE' || status === 'HOLIDAY' || status === 'WEEK_OFF') return 'approved';
  if (status === 'ABSENT' || status === 'MISSING_PUNCH') return 'rejected';
  return 'pending';
}

function thisMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function AttendancePageBody() {
  const searchParams = useSearchParams();
  const fromLink = searchParams.get('period');
  const initial = fromLink && /^\d{4}-\d{2}$/.test(fromLink) ? fromLink : thisMonth();
  const [period, setPeriod] = useState(initial);
  const { data, isLoading } = useGetAttendanceMeQuery({ period });
  const month = data?.data;

  const rows = useMemo(() => month?.records ?? [], [month]);

  return (
    <>
      <PageHeader kicker="Attendance" title={month?.monthLabel ?? 'Attendance'} />
      <div className="mb-8 max-w-xs">
        <Label htmlFor="period">Month</Label>
        <Input id="period" type="month" value={period} onChange={(event) => setPeriod(event.target.value)} />
      </div>
      {!month?.published ? (
        <p className="text-sm text-muted">{month?.message ?? 'This month is not published yet.'}</p>
      ) : (
        <DataTable
          columns={[
            { id: 'date', header: 'Date', cell: (row) => row.attendanceDate },
            { id: 'in', header: 'In', cell: (row) => row.actualIn ?? '—' },
            { id: 'out', header: 'Out', cell: (row) => row.actualOut ?? '—' },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={tone(row.status)} label={row.status} />,
            },
          ]}
          rows={rows}
          loading={isLoading}
        emptyTitle="No days"
          emptyDescription="Published attendance appears here after HR confirms the month."
        />
      )}
    </>
  );
}

export default function AttendancePage() {
  return (
    <Suspense>
      <AttendancePageBody />
    </Suspense>
  );
}
