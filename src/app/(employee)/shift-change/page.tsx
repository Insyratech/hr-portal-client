'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { LeaveJourney } from '@/components/leave/leave-journey';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ApplyShiftChangeForm } from '@/features/shift-changes/apply-shift-change-form';
import { ShiftChangeLeadReviewCard } from '@/features/shift-changes/shift-change-lead-review-card';
import {
  shiftChangeDateLabel,
  shiftChangeJourneySteps,
} from '@/features/shift-changes/shift-change-journey';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCancelShiftChangeMutation,
  useGetMyShiftChangesQuery,
  useGetShiftChangeLeadInboxQuery,
} from '@/store/api/api';

export default function ShiftChangePage() {
  const canApply = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.SHIFT_CHANGE_APPLY),
  );
  const { data: mine, isLoading } = useGetMyShiftChangesQuery(undefined, { skip: !canApply });
  const { data: leadInbox } = useGetShiftChangeLeadInboxQuery();
  const [cancel, { isLoading: cancelling }] = useCancelShiftChangeMutation();
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const openRows = useMemo(
    () => (mine?.data ?? []).filter((row) => row.status === 'PENDING' || row.status === 'APPROVED'),
    [mine?.data],
  );
  const hasPending = (mine?.data ?? []).some((row) => row.status === 'PENDING');

  async function onCancel(id: string) {
    try {
      await cancel(id).unwrap();
      toast.success('Shift change request cancelled.');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Unable to cancel request.'));
    }
  }

  if (!canApply) {
    return (
      <div className="space-y-6">
        <PageHeader kicker="Attendance" title="Shift change" />
        <p className="text-sm text-muted">You do not have access to request shift changes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader kicker="Attendance" title="Shift change" />
      <p className="max-w-2xl text-sm text-muted">
        Request a different shift for one day or a short date range. Project lead (when required) reviews
        first, then HR. Other days keep your normal shift.
      </p>

      {(leadInbox?.data ?? []).length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-meta">Lead inbox</h2>
            <Link href="/work/team-permissions" className="text-sm text-muted hover:text-foreground">
              Open Team permissions
            </Link>
          </div>
          {(leadInbox?.data ?? []).map((row) => (
            <ShiftChangeLeadReviewCard key={row.id} row={row} />
          ))}
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-meta">Status</h2>
          <Button type="button" disabled={hasPending} onClick={() => setOpen(true)}>
            {hasPending ? 'Pending request open' : 'Request shift change'}
          </Button>
        </div>
        {openRows.length === 0 && !isLoading ? (
          <p className="text-sm text-muted">No active shift change requests.</p>
        ) : null}
        <div className="space-y-4">
          {openRows.map((row) => (
            <div key={row.id} className="space-y-4 border border-border bg-background p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {shiftChangeDateLabel(row)} · {row.requestedShiftName ?? 'Shift'}
                  </p>
                  <p className="mt-1 text-sm text-muted">{row.reason}</p>
                </div>
                {row.status === 'PENDING' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={cancelling}
                    onClick={() => void onCancel(row.id)}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
              <LeaveJourney steps={shiftChangeJourneySteps(row)} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-meta">History</h2>
        <DataTable
          columns={[
            { id: 'dates', header: 'Dates', cell: (row) => shiftChangeDateLabel(row) },
            { id: 'shift', header: 'Requested', cell: (row) => row.requestedShiftName ?? '—' },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => (
                <StatusBadge
                  status={
                    row.status === 'APPROVED' ? 'approved' : row.status === 'PENDING' ? 'pending' : 'rejected'
                  }
                  label={row.status}
                />
              ),
            },
            { id: 'reason', header: 'Reason', cell: (row) => row.reason || '—' },
          ]}
          rows={mine?.data ?? []}
          loading={isLoading}
          emptyTitle="No history yet"
          emptyDescription="Submitted shift changes will appear here."
        />
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle>Request shift change</DialogTitle>
          <DialogDescription className="sr-only">Submit a temporary shift change request.</DialogDescription>
          <ApplyShiftChangeForm
            onApplied={() => {
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
