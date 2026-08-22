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
import { uploadGrievanceFile } from '@/features/grievances/upload-attachment';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useAddGrievanceCommentMutation,
  useCreateGrievanceAttachmentMutation,
  useCreateGrievanceMutation,
  useGetGrievanceQuery,
  useGetGrievancesQuery,
  useLazyGetGrievanceAttachmentUrlQuery,
} from '@/store/api/api';
import type { GrievanceCategory } from '@/types/api';

const CATEGORIES: GrievanceCategory[] = [
  'WORKPLACE',
  'SALARY',
  'MANAGER',
  'ATTENDANCE',
  'POLICY',
  'OTHER',
];

function tone(status: string): 'pending' | 'approved' | 'rejected' {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'approved';
  if (status === 'OPEN') return 'pending';
  return 'pending';
}

export default function GrievancePage() {
  const { data, isLoading } = useGetGrievancesQuery();
  const [createGrievance, { isLoading: creating }] = useCreateGrievanceMutation();
  const [createAttachment] = useCreateGrievanceAttachmentMutation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detailData } = useGetGrievanceQuery(selectedId ?? '', { skip: !selectedId });
  const [addComment, { isLoading: commenting }] = useAddGrievanceCommentMutation();
  const [fetchUrl] = useLazyGetGrievanceAttachmentUrlQuery();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
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
      setSuccess('Concern submitted.');
      form.reset();
      setSelectedId(created.data.id);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to submit concern.'));
    }
  }

  async function onComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    const form = event.currentTarget;
    setError(null);
    setSuccess(null);
    try {
      await addComment({
        id: selectedId,
        body: String(new FormData(form).get('body') ?? ''),
        visibility: 'EMPLOYEE',
      }).unwrap();
      form.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to post message.'));
    }
  }

  async function openAttachment(attachmentId: string) {
    if (!selectedId) return;
    const result = await fetchUrl({ id: selectedId, attachmentId }).unwrap();
    window.open(result.data.url, '_blank', 'noopener,noreferrer');
  }

  const detail = detailData?.data;

  return (
    <>
      <PageHeader kicker="Grievance" title="Raise concern" />
      <form onSubmit={onSubmit} className="mb-10 max-w-xl space-y-4 border border-border p-6">
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            className="h-10 w-full rounded border border-border bg-background px-3 text-sm"
            required
          >
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
          <Input id="description" name="description" required />
        </div>
        <div>
          <Label htmlFor="attachment">Attachment</Label>
          <Input id="attachment" name="attachment" type="file" />
        </div>
        {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
        {success ? <StatusMessage tone="success">{success}</StatusMessage> : null}
        <Button type="submit" disabled={creating}>
          Submit
        </Button>
      </form>

      <DataTable
        columns={[
          { id: 'subject', header: 'Subject', cell: (row) => row.subject },
          { id: 'category', header: 'Category', cell: (row) => row.category },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => <StatusBadge status={tone(row.status)} label={row.status} />,
          },
          {
            id: 'open',
            header: 'Open',
            cell: (row) => (
              <Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(row.id)}>
                View
              </Button>
            ),
          },
        ]}
        rows={data?.data ?? []}
        emptyTitle={isLoading ? 'Loading' : 'No grievances'}
        emptyDescription="Your filed concerns appear here."
      />

      {detail ? (
        <section className="mt-10 max-w-xl space-y-4 border border-border p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{detail.status}</p>
          <p className="text-sm font-medium">{detail.subject}</p>
          <p className="whitespace-pre-line text-sm">{detail.description}</p>
          {detail.resolution ? <p className="text-sm">Resolution: {detail.resolution}</p> : null}
          <div className="space-y-2">
            {detail.comments.map((comment) => (
              <div key={comment.id} className="border border-border px-3 py-2 text-sm">
                <p className="text-xs text-muted">{comment.authorName ?? '—'}</p>
                <p className="mt-1 whitespace-pre-line">{comment.body}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {detail.attachments.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void openAttachment(item.id)}
              >
                {item.fileName}
              </Button>
            ))}
          </div>
          <form onSubmit={onComment} className="space-y-3">
            <Label htmlFor="reply">Reply</Label>
            <Input id="reply" name="body" required />
            <Button type="submit" size="sm" disabled={commenting}>
              Send
            </Button>
          </form>
        </section>
      ) : null}
    </>
  );
}
