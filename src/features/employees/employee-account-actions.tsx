'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useActivateEmployeeMutation,
  useDeactivateEmployeeMutation,
  useDeleteEmployeeMutation,
} from '@/store/api/api';
import type { Employee } from '@/types/api';

export function EmployeeAccountActions({
  employee,
  listHref,
}: {
  employee: Employee;
  listHref: string;
}) {
  const router = useRouter();
  const [deactivate, { isLoading: deactivating }] = useDeactivateEmployeeMutation();
  const [activate, { isLoading: activating }] = useActivateEmployeeMutation();
  const [remove, { isLoading: deleting }] = useDeleteEmployeeMutation();
  const [confirm, setConfirm] = useState<'deactivate' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = deactivating || activating || deleting;

  async function onDeactivate() {
    setError(null);
    try {
      await deactivate(employee.id).unwrap();
      setConfirm(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to deactivate this account.'));
    }
  }

  async function onActivate() {
    setError(null);
    try {
      await activate(employee.id).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to activate this account.'));
    }
  }

  async function onDelete() {
    setError(null);
    try {
      await remove(employee.id).unwrap();
      setConfirm(null);
      router.push(listHref);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to delete this employee.'));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {employee.status === 'active' ? (
          <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirm('deactivate')}>
            Deactivate temporarily
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled={busy} onClick={() => void onActivate()}>
            Activate
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => setConfirm('delete')}
          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
        >
          Delete permanently
        </Button>
      </div>
      {error ? (
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      ) : null}

      <Dialog open={confirm === 'deactivate'} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent>
          <DialogTitle>Deactivate temporarily</DialogTitle>
          <DialogDescription>
            {employee.fullName} will not be able to sign in until you activate the account again. Leave,
            attendance, and salary slips stay on file.
          </DialogDescription>
          <div className="mt-8 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onDeactivate()}>
              Deactivate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirm === 'delete'} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent>
          <DialogTitle>Delete permanently</DialogTitle>
          <DialogDescription>
            This cannot be undone. {employee.fullName} will be removed from the directory and cannot sign
            in. Historical attendance and published salary slips are kept for records.
          </DialogDescription>
          <div className="mt-8 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onDelete()}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
