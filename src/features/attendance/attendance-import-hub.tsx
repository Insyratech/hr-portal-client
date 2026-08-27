'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useDeleteAttendanceImportMutation,
  useGetAttendanceImportsQuery,
  useUploadAttendanceImportMutation,
} from '@/store/api/api';
import type { AttendanceImport } from '@/types/api';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AttendanceImportHub({
  listHref,
  canManage,
}: {
  listHref: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const { data, isLoading } = useGetAttendanceImportsQuery();
  const [upload, { isLoading: uploading }] = useUploadAttendanceImportMutation();
  const [remove, { isLoading: deleting }] = useDeleteAttendanceImportMutation();
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AttendanceImport | null>(null);
  const toast = useToast();
  const defaultPeriod = new Date().toISOString().slice(0, 7);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      setError('Choose an Excel file (.xls or .xlsx).');
      return;
    }
    try {
      const contentBase64 = await fileToBase64(file);
      const result = await upload({
        period: String(form.get('period') ?? defaultPeriod),
        fileName: file.name,
        contentBase64,
      }).unwrap();
      toast.success('File parsed. Review each employee before confirming.');
      router.push(`${listHref}/${result.data.import.id}`);
    } catch (cause) {
      const text = apiErrorMessage(cause, 'Unable to upload this file.');
      toast.error(text);
      setError(text);
    }
  }

  async function onDelete() {
    if (!pendingDelete) return;
    try {
      await remove(pendingDelete.id).unwrap();
      toast.success('Rejected import deleted.');
      setPendingDelete(null);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to delete this import.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Attendance" title="Monthly import" />
      {canManage ? (
        <form onSubmit={(event) => void onSubmit(event)} className="mb-10 max-w-xl space-y-4 border border-border p-6">
          <p className="text-sm text-muted">
            Upload the biometric workbook for a month (.xls or .xlsx). Flexible shifts are judged on hours worked, not
            clock-in time. Confirm month turns on after every flagged day has a LOP choice. Rejected uploads can be
            deleted from the list.
          </p>
          <div>
            <Label htmlFor="period">Month</Label>
            <Input id="period" name="period" type="month" required defaultValue={defaultPeriod} />
          </div>
          <div>
            <Label htmlFor="file">Excel file</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept=".xlsx,.xls,.xlsm,.xlsb,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              required
            />
          </div>
          {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
          <Button type="submit" disabled={uploading}>
            {uploading ? 'Parsing…' : 'Upload and review'}
          </Button>
        </form>
      ) : (
        <p className="mb-10 text-sm text-muted">View-only. General Manager uploads and confirms the month.</p>
      )}
      <Meta className="mb-3">Recent imports</Meta>
      <DataTable
        columns={[
          { id: 'period', header: 'Month', cell: (row) => row.period },
          { id: 'file', header: 'File', cell: (row) => row.fileName },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => (
              <StatusBadge
                status={row.status === 'CONFIRMED' ? 'approved' : row.status === 'REJECTED' ? 'rejected' : 'pending'}
                label={row.status}
              />
            ),
          },
          {
            id: 'open',
            header: '',
            cell: (row) => (
              <div className="flex flex-wrap gap-3">
                <Link href={`${listHref}/${row.id}`} className="text-sm text-muted hover:text-foreground">
                  Open
                </Link>
                {canManage && row.status === 'REJECTED' ? (
                  <button
                    type="button"
                    className="text-sm text-muted hover:text-foreground"
                    onClick={() => setPendingDelete(row)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No imports"
        emptyDescription="HR uploads a biometric Excel file to start a month."
      />
      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogTitle>Delete rejected import</DialogTitle>
          <DialogDescription>
            {pendingDelete
              ? `${pendingDelete.fileName} for ${pendingDelete.period} will be removed. This cannot be undone.`
              : ''}
          </DialogDescription>
          <div className="mt-8 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={deleting} onClick={() => void onDelete()}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
