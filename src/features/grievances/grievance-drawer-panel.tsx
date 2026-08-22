'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useAddGrievanceCommentMutation,
  useAssignGrievanceMutation,
  useChangeGrievanceStatusMutation,
  useGetEmployeesQuery,
  useGetGrievanceQuery,
  useResolveGrievanceMutation,
} from '@/store/api/api';

const NEXT_STATUS: Record<string, string | null> = {
  OPEN: 'UNDER_REVIEW',
  UNDER_REVIEW: 'INVESTIGATING',
  INVESTIGATING: 'RESOLVED',
  RESOLVED: 'CLOSED',
  CLOSED: null,
};

export function GrievanceDrawerPanel({ grievanceId }: { grievanceId: string }) {
  const { data, isLoading, isError } = useGetGrievanceQuery(grievanceId);
  const { data: employees } = useGetEmployeesQuery();
  const [assignGrievance, { isLoading: assigning }] = useAssignGrievanceMutation();
  const [changeStatus, { isLoading: advancing }] = useChangeGrievanceStatusMutation();
  const [resolveGrievance, { isLoading: resolving }] = useResolveGrievanceMutation();
  const [addComment, { isLoading: commenting }] = useAddGrievanceCommentMutation();
  const [error, setError] = useState<string | null>(null);
  const detail = data?.data;
  const next = detail ? NEXT_STATUS[detail.status] : null;

  async function onAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const assigneeId = String(new FormData(event.currentTarget).get('assigneeId') ?? '');
    try {
      await assignGrievance({ id: grievanceId, assigneeId }).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to assign.'));
    }
  }

  async function onAdvance() {
    if (!next || next === 'RESOLVED') return;
    setError(null);
    try {
      await changeStatus({ id: grievanceId, status: next }).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update status.'));
    }
  }

  async function onResolve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const resolution = String(new FormData(event.currentTarget).get('resolution') ?? '');
    try {
      await resolveGrievance({ id: grievanceId, resolution }).unwrap();
      event.currentTarget.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to resolve.'));
    }
  }

  async function onComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    try {
      await addComment({
        id: grievanceId,
        body: String(data.get('body') ?? ''),
        visibility: data.get('visibility') === 'EMPLOYEE' ? 'EMPLOYEE' : 'INTERNAL',
      }).unwrap();
      form.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to post comment.'));
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Loading</p>;
  if (isError || !detail) return <p className="text-sm">Unable to load grievance.</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{detail.category}</p>
        <p className="mt-2 text-sm font-medium">{detail.subject}</p>
        <p className="mt-2 text-sm text-muted">{detail.employeeName}</p>
        <p className="mt-4 whitespace-pre-line text-sm">{detail.description}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted">{detail.status}</p>
        {detail.resolution ? <p className="mt-2 text-sm">Resolution: {detail.resolution}</p> : null}
      </div>

      {detail.assignments[0] ? (
        <p className="text-sm">Investigator: {detail.assignments[0].assigneeName ?? '—'}</p>
      ) : null}

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Thread</p>
        {detail.comments.length === 0 ? <p className="text-sm text-muted">No comments yet.</p> : null}
        {detail.comments.map((comment) => (
          <div key={comment.id} className="border border-border px-3 py-2 text-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              {comment.visibility} · {comment.authorName ?? '—'}
            </p>
            <p className="mt-1 whitespace-pre-line">{comment.body}</p>
          </div>
        ))}
      </div>

      {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}

      <form onSubmit={onAssign} className="space-y-3 border-t border-border pt-4">
        <Label htmlFor="assigneeId">Assign investigator</Label>
        <select
          id="assigneeId"
          name="assigneeId"
          className="h-10 w-full rounded border border-border bg-background px-3 text-sm"
          required
        >
          {(employees?.data ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.fullName}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={assigning}>
          Assign
        </Button>
      </form>

      {next && next !== 'RESOLVED' ? (
        <Button type="button" size="sm" variant="outline" disabled={advancing} onClick={() => void onAdvance()}>
          Advance to {next}
        </Button>
      ) : null}

      {detail.status === 'INVESTIGATING' ? (
        <form onSubmit={onResolve} className="space-y-3 border-t border-border pt-4">
          <Label htmlFor="resolution">Resolution</Label>
          <Input id="resolution" name="resolution" required />
          <Button type="submit" size="sm" disabled={resolving}>
            Resolve
          </Button>
        </form>
      ) : null}

      <form onSubmit={onComment} className="space-y-3 border-t border-border pt-4">
        <Label htmlFor="body">Note</Label>
        <Input id="body" name="body" required />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="visibility" value="EMPLOYEE" /> Visible to employee
        </label>
        <Button type="submit" size="sm" variant="outline" disabled={commenting}>
          Post note
        </Button>
      </form>
    </div>
  );
}
