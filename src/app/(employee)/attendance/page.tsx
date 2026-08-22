'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { formatClock, formatDuration } from '@/lib/attendance-format';
import {
  useGetAttendanceMeQuery,
  useSubmitAttendanceCorrectionMutation,
} from '@/store/api/api';

function tone(status: string): 'pending' | 'approved' | 'rejected' {
  if (status === 'PRESENT' || status === 'LEAVE' || status === 'HOLIDAY' || status === 'WEEK_OFF') return 'approved';
  if (status === 'ABSENT' || status === 'MISSING_PUNCH') return 'rejected';
  return 'pending';
}

export default function AttendancePage() {
  const { data, isLoading } = useGetAttendanceMeQuery();
  const [submitCorrection, { isLoading: saving }] = useSubmitAttendanceCorrectionMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const toast = useToast();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const form = new FormData(event.currentTarget);
    const date = String(form.get('date') ?? '');
    const proposedInLocal = String(form.get('proposedIn') ?? '');
    const proposedOutLocal = String(form.get('proposedOut') ?? '');
    try {
      await submitCorrection({
        date,
        proposedIn: new Date(`${date}T${proposedInLocal}:00`).toISOString(),
        proposedOut: new Date(`${date}T${proposedOutLocal}:00`).toISOString(),
        reason: String(form.get('reason') ?? ''),
      }).unwrap();
      setSuccess('Correction submitted for approval.');
      toast.success('Correction submitted for approval.');
      event.currentTarget.reset();
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to submit correction.'));
      setError(apiErrorMessage(cause, 'Unable to submit correction.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Attendance" title="History" />
      <form onSubmit={onSubmit} className="mb-10 max-w-xl space-y-4 border border-border p-6">
        <p className="text-sm text-muted">Request a correction if you forgot a punch. Admins must approve it.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" required />
          </div>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" name="reason" required />
          </div>
          <div>
            <Label htmlFor="proposedIn">Proposed in</Label>
            <Input id="proposedIn" name="proposedIn" type="time" required />
          </div>
          <div>
            <Label htmlFor="proposedOut">Proposed out</Label>
            <Input id="proposedOut" name="proposedOut" type="time" required />
          </div>
        </div>
        {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
        {success ? <StatusMessage tone="success">{success}</StatusMessage> : null}
        <Button type="submit" disabled={saving}>
          Submit correction
        </Button>
      </form>
      <DataTable
        columns={[
          { id: 'date', header: 'Date', cell: (row) => row.attendanceDate },
          {
            id: 'in',
            header: 'In',
            cell: (row) => formatClock(row.actualIn) ?? '—',
          },
          {
            id: 'out',
            header: 'Out',
            cell: (row) => formatClock(row.actualOut) ?? '—',
          },
          {
            id: 'worked',
            header: 'Worked',
            cell: (row) => formatDuration(row.workedMinutes) ?? '—',
          },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={tone(row.status)} label={row.status} />,
          },
        ]}
        rows={data?.data.history ?? []}
        emptyTitle={isLoading ? 'Loading' : 'No records'}
        emptyDescription="Punch history appears after you punch in."
      />
    </>
  );
}
