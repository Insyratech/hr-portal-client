'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StatusMessage } from '@/components/ui/status-message';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { GrievanceDrawerPanel } from '@/features/grievances/grievance-drawer-panel';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { useApproveLeaveMutation, useRejectLeaveMutation } from '@/store/api/api';
import { closeEntityDrawer } from '@/store/slices/ui-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export function EntityDrawer() {
  const dispatch = useAppDispatch();
  const { open, title, body, leaveId, leaveStatus, grievanceId, handoverAccepted } = useAppSelector(
    (state) => state.ui.entityDrawer,
  );
  const canDecideLeave = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.LEAVE_APPROVE),
  );
  const [approveLeave, { isLoading: approvingLeave }] = useApproveLeaveMutation();
  const [rejectLeave, { isLoading: rejectingLeave }] = useRejectLeaveMutation();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const busy = approvingLeave || rejectingLeave;

  useEffect(() => {
    setError(null);
  }, [leaveId, grievanceId, open]);

  async function decideLeave(action: 'approve' | 'reject'): Promise<void> {
    if (!leaveId) return;
    setError(null);
    try {
      if (action === 'approve') {
        await approveLeave({ id: leaveId }).unwrap();
        toast.success('Leave approved.');
      } else {
        await rejectLeave({ id: leaveId }).unwrap();
        toast.success('Leave declined.');
      }
      dispatch(closeEntityDrawer());
    } catch (cause) {
      const text = apiErrorMessage(cause, 'Unable to update this leave request.');
      toast.error(text);
      setError(text);
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) dispatch(closeEntityDrawer());
      }}
    >
      <SheetContent title={title || 'REVIEW'}>
        {grievanceId ? (
          <GrievanceDrawerPanel grievanceId={grievanceId} />
        ) : (
          <>
            <p className="whitespace-pre-line text-sm text-foreground">{body}</p>
            {error ? (
              <div className="mt-4">
                <StatusMessage tone="danger">{error}</StatusMessage>
              </div>
            ) : null}
            {leaveId && leaveStatus === 'PENDING' && canDecideLeave && !handoverAccepted ? (
              <p className="mt-4 text-sm text-muted">Waiting for the handover colleague to accept before you can approve.</p>
            ) : null}
            {leaveId && leaveStatus === 'PENDING' && canDecideLeave ? (
              <div className="mt-8 flex gap-3">
                <Button type="button" disabled={busy || !handoverAccepted} onClick={() => void decideLeave('approve')}>
                  Approve
                </Button>
                <Button type="button" variant="outline" disabled={busy} onClick={() => void decideLeave('reject')}>
                  Reject
                </Button>
              </div>
            ) : null}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
