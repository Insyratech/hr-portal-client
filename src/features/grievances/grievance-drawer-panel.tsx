'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { apiErrorMessage } from '@/lib/api-error';
import { PERMISSIONS } from '@/types/permissions';
import {
  useAddGrievanceCommentMutation,
  useAssignGrievanceMutation,
  useChangeGrievanceStatusMutation,
  useGetEmployeesQuery,
  useGetGrievanceHandlersQuery,
  useGetGrievanceQuery,
  useResolveGrievanceMutation,
} from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';

const NEXT_STATUS: Record<string, string | null> = {
  OPEN: 'UNDER_REVIEW',
  UNDER_REVIEW: 'INVESTIGATING',
  INVESTIGATING: 'RESOLVED',
  RESOLVED: 'CLOSED',
  CLOSED: null,
};

export function GrievanceDrawerPanel({ grievanceId }: { grievanceId: string }) {
  const employeeId = useAppSelector((state) => state.auth.user?.employeeId);
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage = permissions.includes(PERMISSIONS.GRIEVANCES_MANAGE);
  const { data, isLoading, isError } = useGetGrievanceQuery(grievanceId);
  const { data: employees } = useGetEmployeesQuery(undefined, { skip: !canManage });
  const { data: handlers, isError: handlersFailed } = useGetGrievanceHandlersQuery(undefined, {
    skip: canManage,
  });
  const [assignGrievance, { isLoading: assigning }] = useAssignGrievanceMutation();
  const [changeStatus, { isLoading: advancing }] = useChangeGrievanceStatusMutation();
  const [resolveGrievance, { isLoading: resolving }] = useResolveGrievanceMutation();
  const [addComment, { isLoading: commenting }] = useAddGrievanceCommentMutation();
  const [error, setError] = useState<string | null>(null);
  const detail = data?.data;
  const assigned = Boolean(detail?.assignments.some((item) => item.assigneeId === employeeId));
  const isFiler = detail?.employeeId === employeeId;
  const staff = canManage || assigned;
  const next = detail ? NEXT_STATUS[detail.status] : null;
  const canAdvance = staff && next && next !== 'RESOLVED' && next !== 'CLOSED';

  async function onAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    const assigneeId = String(new FormData(form).get('assigneeId') ?? '');
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
    const form = event.currentTarget;
    setError(null);
    try {
      await resolveGrievance({ id: grievanceId, resolution: String(new FormData(form).get('resolution') ?? '') }).unwrap();
      form.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to resolve.'));
    }
  }

  async function onComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = new FormData(form);
    setError(null);
    try {
      await addComment({
        id: grievanceId,
        body: String(payload.get('body') ?? ''),
        visibility: staff && payload.get('visibility') === 'INTERNAL' ? 'INTERNAL' : 'EMPLOYEE',
      }).unwrap();
      form.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to post comment.'));
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Loading</p>;
  if (isError || !detail) return <p className="text-sm">Unable to load grievance.</p>;

  const assignOptions = canManage
    ? (employees?.data ?? []).map((item) => ({ id: item.id, label: item.fullName }))
    : (handlers?.data ?? []).map((item) => ({
        id: item.employeeId,
        label: `${item.fullName} (${item.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'})`,
      }));

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

      {staff ? (
        <form onSubmit={onAssign} className="space-y-3 border-t border-border pt-4">
          <Label htmlFor="assigneeId">{canManage ? 'Assign investigator' : 'Escalate to Admin or Super Admin'}</Label>
          <select
            id="assigneeId"
            name="assigneeId"
            className="h-10 w-full rounded border border-border bg-background px-3 text-sm"
            required
          >
            <option value="">Select a person</option>
            {assignOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          {handlersFailed ? <StatusMessage tone="danger">Unable to load Admin / Super Admin list.</StatusMessage> : null}
          {assignOptions.length === 0 && !handlersFailed ? (
            <p className="text-sm text-muted">No Admin or Super Admin is available to forward to.</p>
          ) : null}
          <Button type="submit" size="sm" disabled={assigning || assignOptions.length === 0}>
            {canManage ? 'Assign' : 'Forward'}
          </Button>
        </form>
      ) : null}

      {canAdvance ? (
        <Button type="button" size="sm" variant="outline" disabled={advancing} onClick={() => void onAdvance()}>
          Advance to {next}
        </Button>
      ) : null}

      {canManage && detail.status === 'INVESTIGATING' ? (
        <form onSubmit={onResolve} className="space-y-3 border-t border-border pt-4">
          <Label htmlFor="resolution">Resolution</Label>
          <Input id="resolution" name="resolution" required />
          <Button type="submit" size="sm" disabled={resolving}>
            Resolve
          </Button>
        </form>
      ) : null}

      <form onSubmit={onComment} className="space-y-3 border-t border-border pt-4">
        <Label htmlFor="body">{isFiler && !staff ? 'Reply' : 'Message'}</Label>
        <Input id="body" name="body" required />
        {staff ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="visibility" value="INTERNAL" />
            Internal note (Admin / Super Admin only)
          </label>
        ) : null}
        <p className="text-xs text-muted">
          {staff
            ? 'Leave the box unchecked to reply to the employee who raised the concern.'
            : 'Your message goes to the assigned investigator, or to HR if none is assigned.'}
        </p>
        <Button type="submit" size="sm" variant="outline" disabled={commenting}>
          {staff ? 'Post' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
