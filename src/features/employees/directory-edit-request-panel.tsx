'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import {
  useCancelDirectoryEditRequestMutation,
  useCreateDirectoryEditRequestMutation,
  useFulfillDirectoryEditRequestMutation,
  useGetDirectoryEditRequestForEmployeeQuery,
} from '@/store/api/api';
import type { DirectoryEditRequest } from '@/types/api';

function statusCopy(open: DirectoryEditRequest | null): string | null {
  if (!open) return null;
  if (open.status === 'PENDING') {
    return `Edit request pending Super Admin review. Reason: ${open.reason}`;
  }
  if (open.status === 'APPROVED' && open.unlockedUntil) {
    return `Unlocked for Super Admin until ${new Date(open.unlockedUntil).toLocaleString()}.`;
  }
  return null;
}

export function DirectoryEditRequestPanel({
  employeeId,
  canRequest,
  canEdit,
}: {
  employeeId: string;
  canRequest: boolean;
  canEdit: boolean;
}) {
  const toast = useToast();
  const { data, isLoading } = useGetDirectoryEditRequestForEmployeeQuery(employeeId);
  const [createRequest, { isLoading: creating }] = useCreateDirectoryEditRequestMutation();
  const [cancelRequest, { isLoading: cancelling }] = useCancelDirectoryEditRequestMutation();
  const [fulfillRequest, { isLoading: fulfilling }] = useFulfillDirectoryEditRequestMutation();
  const [openForm, setOpenForm] = useState(false);
  const [reason, setReason] = useState('');
  const [fieldHints, setFieldHints] = useState('');

  const open = data?.data.open ?? null;
  const serverCanRequest = data?.data.canRequest ?? false;
  const serverCanEdit = data?.data.canEdit ?? false;
  const showRequest = canRequest && serverCanRequest;
  const showEdit = canEdit && serverCanEdit;
  const message = statusCopy(open);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await createRequest({
        targetEmployeeId: employeeId,
        reason: reason.trim(),
        fieldHints: fieldHints.trim() || null,
      }).unwrap();
      toast.success('Edit request sent to Super Admin.');
      setOpenForm(false);
      setReason('');
      setFieldHints('');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to send edit request.'));
    }
  }

  async function onCancel() {
    if (!open) return;
    try {
      await cancelRequest(open.id).unwrap();
      toast.success('Edit request cancelled.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to cancel request.'));
    }
  }

  async function onFulfill() {
    if (!open) return;
    try {
      await fulfillRequest(open.id).unwrap();
      toast.success('Unlock closed. This employee is locked again.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to close unlock.'));
    }
  }

  if (isLoading && !data) {
    return null;
  }

  return (
    <div className="mb-6 max-w-2xl space-y-3 border border-border bg-surface/40 p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-meta" style={{ color: 'var(--meta)' }}>
        Directory edit
      </p>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      {open?.fieldHints ? <p className="text-sm">Hints: {open.fieldHints}</p> : null}

      {showRequest && !openForm ? (
        <Button type="button" size="sm" onClick={() => setOpenForm(true)}>
          Request edit
        </Button>
      ) : null}

      {showRequest && openForm ? (
        <form className="space-y-3" onSubmit={(event) => void onSubmit(event)}>
          <label className="block text-sm">
            Why does this need changing?
            <textarea
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
              rows={3}
              required
              minLength={8}
              maxLength={2000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Example: Wrong joining date and phone number"
            />
          </label>
          <label className="block text-sm">
            Fields to check (optional)
            <input
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
              maxLength={1000}
              value={fieldHints}
              onChange={(event) => setFieldHints(event.target.value)}
              placeholder="Joining date, phone"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={creating || reason.trim().length < 8}>
              Send request
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setOpenForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {canRequest && open?.status === 'PENDING' ? (
        <Button type="button" size="sm" variant="outline" disabled={cancelling} onClick={() => void onCancel()}>
          Withdraw request
        </Button>
      ) : null}

      {showEdit ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm">You can edit this person now. Save your changes, then close the unlock.</p>
          <Button type="button" size="sm" variant="outline" disabled={fulfilling} onClick={() => void onFulfill()}>
            Done editing
          </Button>
        </div>
      ) : null}

      {!showRequest && !showEdit && !message ? (
        <p className="text-sm text-muted">Details stay locked until HR requests an edit and Super Admin approves it. Access roles are assigned separately on the profile and do not use this unlock.</p>
      ) : null}
    </div>
  );
}
