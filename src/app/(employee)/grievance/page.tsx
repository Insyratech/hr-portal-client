'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { GrievanceDrawerPanel } from '@/features/grievances/grievance-drawer-panel';
import { uploadGrievanceFile } from '@/features/grievances/upload-attachment';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useCreateGrievanceAttachmentMutation,
  useCreateGrievanceMutation,
  useGetGrievancesQuery,
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
  return 'pending';
}

function GrievancePageBody() {
  const { data, isLoading } = useGetGrievancesQuery({ scope: 'mine' });
  const { data: assignedData, isLoading: assignedLoading } = useGetGrievancesQuery({ scope: 'assigned' });
  const [createGrievance, { isLoading: creating }] = useCreateGrievanceMutation();
  const [createAttachment] = useCreateGrievanceAttachmentMutation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const toast = useToast();

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
      toast.success('Concern submitted.');
      form.reset();
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to submit concern.'));
      setError(apiErrorMessage(cause, 'Unable to submit concern.'));
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
      cell: (row: { id: string }) => (
        <Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(row.id)}>
          View
        </Button>
      ),
    },
  ];

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

      <section className="mb-10">
        <Meta className="mb-4">Assigned to me</Meta>
        <DataTable
          columns={columns}
          rows={assignedData?.data ?? []}
          emptyTitle={assignedLoading ? 'Loading' : 'No assigned cases'}
          emptyDescription="When HR assigns you as investigator, those cases appear here."
        />
      </section>

      <section className="mb-10">
        <Meta className="mb-4">My concerns</Meta>
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          emptyTitle={isLoading ? 'Loading' : 'No grievances'}
          emptyDescription="Your filed concerns appear here."
        />
      </section>

      {selectedId ? (
        <section className="max-w-xl border border-border p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Meta>Case</Meta>
            <Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(null)}>
              Close
            </Button>
          </div>
          <GrievanceDrawerPanel grievanceId={selectedId} />
        </section>
      ) : null}
    </>
  );
}

export default function GrievancePage() {
  return <GrievancePageBody />;
}
