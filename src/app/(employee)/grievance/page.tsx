'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { uploadGrievanceFile } from '@/features/grievances/upload-attachment';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useCreateGrievanceAttachmentMutation,
  useCreateGrievanceMutation,
  useGetGrievancesQuery,
} from '@/store/api/api';
import { useAppDispatch } from '@/store/hooks';
import { openEntityDrawer } from '@/store/slices/ui-slice';
import type { GrievanceCategory } from '@/types/api';

const CATEGORIES: GrievanceCategory[] = [
  'WORKPLACE',
  'SALARY',
  'MANAGER',
  'ATTENDANCE',
  'POLICY',
  'OTHER',
];

const selectClass =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none focus:border-foreground';

const textareaClass =
  'min-h-[96px] w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground shadow-card outline-none focus:border-foreground';

function tone(status: string): 'pending' | 'approved' | 'rejected' {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'approved';
  return 'pending';
}

function GrievancePageBody() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useGetGrievancesQuery({ scope: 'mine' });
  const { data: assignedData, isLoading: assignedLoading } = useGetGrievancesQuery({ scope: 'assigned' });
  const [createGrievance, { isLoading: creating }] = useCreateGrievanceMutation();
  const [createAttachment] = useCreateGrievanceAttachmentMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  function openCase(id: string, label: string) {
    dispatch(
      openEntityDrawer({
        title: label,
        body: '',
        grievanceId: id,
      }),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const dataForm = new FormData(form);
    const file = (dataForm.get('attachment') as File | null) ?? null;
    try {
      const created = await createGrievance({
        category: String(dataForm.get('category') ?? '') as GrievanceCategory,
        subject: String(dataForm.get('subject') ?? ''),
        description: String(dataForm.get('description') ?? ''),
      }).unwrap();
      if (file && file.size > 0) {
        await uploadGrievanceFile(createAttachment, created.data.id, file);
      }
      form.reset();
      setCreateOpen(false);
      toast.success('Concern submitted.');
    } catch (cause) {
      const message = apiErrorMessage(cause, 'Unable to submit concern.');
      setError(message);
      toast.error(message);
    }
  }

  const columns = [
    { id: 'subject', header: 'Subject', cell: (row: { subject: string }) => row.subject },
    { id: 'category', header: 'Category', cell: (row: { category: string }) => row.category },
    {
      id: 'status',
      header: 'Status',
      cell: (row: { status: string }) => <StatusBadge status={tone(row.status)} label={row.status} />,
    },
    {
      id: 'open',
      header: 'Open',
      cell: (row: { id: string; subject: string }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => openCase(row.id, row.subject)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        kicker="Grievance"
        title="My concerns"
        actions={
          <Button
            type="button"
            onClick={() => {
              setError(null);
              setCreateOpen(true);
            }}
          >
            Raise concern
          </Button>
        }
      />

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle>Raise concern</DialogTitle>
          <DialogDescription>
            Share what happened. HR reviews every case and may assign an investigator. You can attach one supporting
            file.
          </DialogDescription>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select id="category" name="category" className={selectClass} required>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                className={textareaClass}
                required
                placeholder="What happened, and what outcome are you looking for?"
              />
            </div>
            <div>
              <Label htmlFor="attachment">Attachment</Label>
              <Input id="attachment" name="attachment" type="file" />
            </div>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Submitting…' : 'Submit'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <section className="mb-10">
        <Meta className="mb-4">Assigned to me</Meta>
        <DataTable
          columns={columns}
          rows={assignedData?.data ?? []}
          loading={assignedLoading}
          emptyTitle="No assigned cases"
          emptyDescription="When HR assigns you as investigator, those cases appear here."
        />
      </section>

      <section className="mb-10">
        <Meta className="mb-4">My concerns</Meta>
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          loading={isLoading}
          emptyTitle="No grievances"
          emptyDescription="Your filed concerns appear here."
        />
      </section>
    </>
  );
}

export default function GrievancePage() {
  return <GrievancePageBody />;
}
