'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StatusMessage } from '@/components/ui/status-message';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { GrievanceDrawerPanel } from '@/features/grievances/grievance-drawer-panel';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useApproveAttendanceCorrectionMutation,
  useApproveLeaveMutation,
  useRejectAttendanceCorrectionMutation,
  useRejectLeaveMutation,
} from '@/store/api/api';
import { closeEntityDrawer } from '@/store/slices/ui-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export function EntityDrawer() {
  const dispatch = useAppDispatch();
  const { open, title, body, leaveId, leaveStatus, correctionId, correctionStatus, grievanceId, handoverAccepted } =
    useAppSelector((state) => state.ui.entityDrawer);
  const [approveLeave, { isLoading: approvingLeave }] = useApproveLeaveMutation();
  const [rejectLeave, { isLoading: rejectingLeave }] = useRejectLeaveMutation();
  const [approveCorrection, { isLoading: approvingCorrection }] = useApproveAttendanceCorrectionMutation();
  const [rejectCorrection, { isLoading: rejectingCorrection }] = useRejectAttendanceCorrectionMutation();
  const correctionPending = correctionId && correctionStatus === 'PENDING';
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [leaveId, correctionId, grievanceId, open]);

  async function decideLeave(action: 'approve' | 'reject'): Promise<void> {
    if (!leaveId) return;
    setError(null);
    try {
      if (action === 'approve') await approveLeave({ id: leaveId }).unwrap();
      else await rejectLeave({ id: leaveId }).unwrap();
      dispatch(closeEntityDrawer());
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update this leave request.'));
    }
  }

  async function decideCorrection(action: 'approve' | 'reject'): Promise<void> {
    if (!correctionId) return;
    setError(null);
    try {
      if (action === 'approve') await approveCorrection(correctionId).unwrap();
      else await rejectCorrection(correctionId).unwrap();
      dispatch(closeEntityDrawer());
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update this correction.'));
    }
  }

  const busy = approvingLeave || rejectingLeave || approvingCorrection || rejectingCorrection;

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
            {leaveId && leaveStatus === 'PENDING' && !handoverAccepted ? (
              <p className="mt-4 text-sm text-muted">Waiting for the handover colleague to accept before you can approve.</p>
            ) : null}
            {leaveId && leaveStatus === 'PENDING' ? (
              <div className="mt-8 flex gap-3">
                <Button type="button" disabled={busy || !handoverAccepted} onClick={() => void decideLeave('approve')}>
                  Approve
                </Button>
                <Button type="button" variant="outline" disabled={busy} onClick={() => void decideLeave('reject')}>
                  Reject
                </Button>
              </div>
            ) : null}
            {correctionPending ? (
              <div className="mt-8 flex gap-3">
                <Button type="button" disabled={busy} onClick={() => void decideCorrection('approve')}>
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void decideCorrection('reject')}
                >
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
