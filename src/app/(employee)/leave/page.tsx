'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApplyLeaveForm } from '@/features/leave/apply-leave-form';
import { HandoverReviewCard } from '@/features/leave/handover-review-card';
import { HandoversTakenList } from '@/features/leave/handovers-taken';
import { takenHandovers } from '@/features/leave/leave-presence';
import { leaveJourneySteps } from '@/features/leave/leave-journey';
import { LeaveStats } from '@/features/leave/leave-stats';
import { LeaveJourney } from '@/components/leave/leave-journey';
import { LeaveBalanceCard } from '@/components/leave/leave-balance-card';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  useCancelLeaveMutation,
  useGetLeaveApplicationsQuery,
  useGetLeaveBalancesQuery,
  useGetMeQuery,
} from '@/store/api/api';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import type { LeaveApplication } from '@/types/api';

function tone(status: string): 'pending' | 'approved' | 'rejected' {
  if (status === 'APPROVED') return 'approved';
  if (status === 'REJECTED' || status === 'CANCELLED') return 'rejected';
  return 'pending';
}

function LeavePageBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusId = searchParams.get('applicationId');
  const { data: me } = useGetMeQuery();
  const { data } = useGetLeaveApplicationsQuery();
  const { data: balanceData } = useGetLeaveBalancesQuery();
  const [cancelLeave, { isLoading }] = useCancelLeaveMutation();
  const toast = useToast();
  const [editing, setEditing] = useState<LeaveApplication | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const myId = me?.data.employeeId;

  useEffect(() => {
    if (!focusId || !myId) return;
    const row = (data?.data ?? []).find((item) => item.id === focusId);
    if (!row) return;
    if (row.handoverEmployeeId === myId && row.employeeId !== myId) {
      router.replace(`/leave/handover/${focusId}`);
    }
  }, [focusId, data, myId, router]);

  useEffect(() => {
    if (!focusId) return;
    rowRefs.current[focusId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId, data]);

  useEffect(() => {
    if (searchParams.get('apply') !== '1') return;
    setApplyOpen(true);
    const next = new URLSearchParams(searchParams.toString());
    next.delete('apply');
    const query = next.toString();
    router.replace(query ? `/leave?${query}` : '/leave');
  }, [router, searchParams]);

  const mine = (data?.data ?? []).filter((row) => row.employeeId === myId);
  const openMine = mine.filter((row) => row.status === 'PENDING' || row.status === 'APPROVED');
  const handoverInbox = (data?.data ?? []).filter(
    (row) => row.handoverEmployeeId === myId && !row.handoverAccepted && row.status === 'PENDING',
  );
  const covering = takenHandovers(data?.data ?? [], myId);
  const balances = (balanceData?.data ?? []).map((item) => ({ code: item.code, days: item.available }));

  return (
    <>
      <PageHeader kicker="Leave" title="Leave" />
      {handoverInbox.length > 0 ? (
        <section className="mb-10 space-y-4">
          <Meta>Handover requests</Meta>
          {handoverInbox.map((row) => (
            <div
              key={row.id}
              ref={(node) => {
                rowRefs.current[row.id] = node;
              }}
            >
              <HandoverReviewCard application={row} highlight={focusId === row.id} />
            </div>
          ))}
        </section>
      ) : null}
      <HandoversTakenList items={covering} />
      {openMine.length > 0 ? (
        <section className="mb-10 space-y-4">
          <Meta>Leave status</Meta>
          {openMine.map((row) => (
            <div
              key={row.id}
              ref={(node) => {
                rowRefs.current[row.id] = node;
              }}
              className={`border bg-background p-5 shadow-card ${focusId === row.id ? 'border-foreground' : 'border-border'}`}
            >
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">
                  {row.leaveTypeName ?? row.leaveTypeCode} · {row.startDate} – {row.endDate}
                </p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={tone(row.status)} label={row.status} />
                  {row.status === 'PENDING' ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditing(row)}>
                      Edit
                    </Button>
                  ) : null}
                </div>
              </div>
              <LeaveJourney steps={leaveJourneySteps(row)} />
              {row.reviewerComment ? (
                <p className="mt-4 text-sm">
                  <span className="text-muted">Requested changes: </span>
                  {row.reviewerComment}
                </p>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}
      <LeaveStats items={mine} />
      <div className="mb-10">
        <LeaveBalanceCard items={balances} />
      </div>
      <Button type="button" className="mb-10" onClick={() => setApplyOpen(true)}>
        Apply leave
      </Button>
      <DataTable
        columns={[
          { id: 'type', header: 'Type', cell: (row) => row.leaveTypeCode ?? '—' },
          { id: 'dates', header: 'Dates', cell: (row) => `${row.startDate} – ${row.endDate}` },
          { id: 'qty', header: 'Days', cell: (row) => row.quantity },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={tone(row.status)} label={row.status} />,
          },
          {
            id: 'handover',
            header: 'Handover',
            cell: (row) =>
              row.handoverEmployeeName ? (
                `${row.handoverEmployeeName}${row.handoverAccepted ? ' · accepted' : ' · waiting'}`
              ) : (
                '—'
              ),
          },
          {
            id: 'edit',
            header: 'Edit',
            cell: (row) =>
              row.status === 'PENDING' && row.employeeId === myId ? (
                <Button type="button" size="sm" variant="outline" onClick={() => setEditing(row)}>
                  Edit
                </Button>
              ) : (
                '—'
              ),
          },
          {
            id: 'cancel',
            header: 'Cancel',
            cell: (row) =>
              (row.status === 'PENDING' || row.status === 'APPROVED') && row.employeeId === myId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => {
                    void cancelLeave(row.id)
                      .unwrap()
                      .then(() => toast.success('Leave cancelled.'))
                      .catch((cause) => toast.error(apiErrorMessage(cause, 'Unable to cancel leave.')));
                  }}
                >
                  Cancel
                </Button>
              ) : (
                '—'
              ),
          },
        ]}
        rows={mine}
        emptyTitle="No applications"
        emptyDescription="Your leave requests will appear here."
      />
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle>Apply leave</DialogTitle>
          <DialogDescription className="sr-only">Submit a new leave request.</DialogDescription>
          <div className="mt-4">
            <ApplyLeaveForm variant="dialog" onApplied={() => setApplyOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle>Edit leave</DialogTitle>
          <DialogDescription className="sr-only">Update this leave request.</DialogDescription>
          <div className="mt-4">
            {editing ? (
              <ApplyLeaveForm
                variant="dialog"
                editing={editing}
                onCancelEdit={() => setEditing(null)}
                onApplied={() => setEditing(null)}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LeavePage() {
  return (
    <Suspense>
      <LeavePageBody />
    </Suspense>
  );
}
