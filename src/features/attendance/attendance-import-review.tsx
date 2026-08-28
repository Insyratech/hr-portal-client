'use client';

import { useState } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { StatusMessage } from '@/components/ui/status-message';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useConfirmAttendanceImportMutation,
  useDeleteAttendanceImportMutation,
  useGetAttendanceImportQuery,
  useRejectAttendanceImportMutation,
} from '@/store/api/api';

export function AttendanceImportReview({
  importId,
  listHref,
  canManage,
}: {
  importId: string;
  listHref: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useGetAttendanceImportQuery(importId);
  const [confirm, { isLoading: confirming }] = useConfirmAttendanceImportMutation();
  const [reject, { isLoading: rejecting }] = useRejectAttendanceImportMutation();
  const [remove, { isLoading: deleting }] = useDeleteAttendanceImportMutation();
  const [askDelete, setAskDelete] = useState(false);
  const toast = useToast();
  const bundle = data?.data;

  async function onConfirm() {
    try {
      await confirm(importId).unwrap();
      toast.success('Month confirmed. Employees can now see this attendance.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to confirm this month.'));
    }
  }

  async function onReject() {
    try {
      await reject(importId).unwrap();
      toast.success('Import rejected.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to reject this import.'));
    }
  }

  async function onDelete() {
    try {
      await remove(importId).unwrap();
      toast.success('Rejected import deleted.');
      setAskDelete(false);
      router.push(listHref);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to delete this import.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Attendance" title={bundle ? bundle.import.period : 'Review'} />
      <p className="mb-8">
        <Link href={listHref} className="text-sm text-muted hover:text-foreground">
          Back to imports
        </Link>
      </p>
      {isLoading ? <PageLoading compact message="Loading import…" /> : null}
      {isError ? <StatusMessage tone="danger">{apiErrorMessage(error, 'Unable to load this import.')}</StatusMessage> : null}
      {bundle ? (
        <div className="space-y-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <Meta>{bundle.import.fileName}</Meta>
              <p className="mt-2 text-sm text-muted">
                {bundle.import.status === 'REJECTED'
                  ? 'This import was rejected. Delete it if you no longer need it.'
                  : bundle.openFlags === 0
                    ? 'Every flagged day has a LOP choice. You can confirm this month.'
                    : `${bundle.openFlags} day${bundle.openFlags === 1 ? '' : 's'} still need a LOP choice. Confirm stays off until those are done.`}
              </p>
              {bundle.import.status !== 'REJECTED' && bundle.openFlags > 0 ? (
                <ul className="mt-3 space-y-1 text-sm">
                  {bundle.cards
                    .filter((row) => row.openFlags > 0)
                    .map((row) => (
                      <li key={row.employeeId}>
                        <Link href={`${listHref}/${importId}/${row.employeeId}`} className="text-muted hover:text-foreground">
                          {row.fullName} — {row.openFlags} day{row.openFlags === 1 ? '' : 's'}
                        </Link>
                      </li>
                    ))}
                </ul>
              ) : null}
            </div>
            <StatusBadge
              status={bundle.import.status === 'CONFIRMED' ? 'approved' : bundle.import.status === 'REJECTED' ? 'rejected' : 'pending'}
              label={bundle.import.status}
            />
          </div>
          {bundle.exceptions.length > 0 ? (
            <section>
              <Meta className="mb-3">Exceptions</Meta>
              <DataTable
                columns={[
                  { id: 'code', header: 'UserID', cell: (row) => row.employeeCode },
                  { id: 'name', header: 'Name', cell: (row) => row.name || '—' },
                  { id: 'reason', header: 'Reason', cell: (row) => row.reason },
                ]}
                rows={bundle.exceptions}
                emptyTitle="No exceptions"
                emptyDescription=""
              />
            </section>
          ) : null}
          <DataTable
            columns={[
              { id: 'code', header: 'ID', cell: (row) => row.employeeCode },
              { id: 'name', header: 'Name', cell: (row) => row.fullName },
              { id: 'company', header: 'Company', cell: (row) => row.companyName ?? '—' },
              { id: 'shift', header: 'Shift', cell: (row) => row.shiftName ?? '—' },
              { id: 'flags', header: 'Flags', cell: (row) => String(row.openFlags) },
              { id: 'lop', header: 'Proposed LOP', cell: (row) => String(row.proposedLop) },
              {
                id: 'open',
                header: '',
                cell: (row) => (
                  <Link href={`${listHref}/${importId}/${row.employeeId}`} className="text-sm text-muted hover:text-foreground">
                    Review
                  </Link>
                ),
              },
            ]}
            rows={bundle.cards}
            emptyTitle="No employees"
            emptyDescription="Active employees appear here after parse."
          />
          {canManage && bundle.import.status !== 'CONFIRMED' && bundle.import.status !== 'REJECTED' ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  loading={confirming}
                  disabled={!bundle.canConfirm || confirming}
                  onClick={() => void onConfirm()}
                >
                  {confirming ? 'Confirming month' : 'Confirm month'}
                </Button>
                <Button type="button" variant="outline" loading={rejecting} disabled={rejecting || confirming} onClick={() => void onReject()}>
                  {rejecting ? 'Rejecting' : 'Reject import'}
                </Button>
              </div>
              {!bundle.canConfirm ? (
                <p className="text-sm text-muted">
                  Open each person with a Flags count above 0, choose Full / Half / No LOP or Exclude for those days,
                  then return here. Exceptions (unknown UserIDs) do not block confirm.
                </p>
              ) : null}
            </div>
          ) : null}
          {canManage && bundle.import.status === 'REJECTED' ? (
            <Button type="button" variant="outline" onClick={() => setAskDelete(true)}>
              Delete import
            </Button>
          ) : null}
        </div>
      ) : null}
      <Dialog open={askDelete} onOpenChange={(open) => !open && setAskDelete(false)}>
        <DialogContent>
          <DialogTitle>Delete rejected import</DialogTitle>
          <DialogDescription>
            The workbook and review cards for this upload will be removed. This cannot be undone.
          </DialogDescription>
          <div className="mt-8 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setAskDelete(false)}>
              Cancel
            </Button>
            <Button type="button" loading={deleting} disabled={deleting} onClick={() => void onDelete()}>
              {deleting ? 'Deleting' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
