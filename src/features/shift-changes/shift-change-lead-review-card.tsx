'use client';

import { Button } from '@/components/ui/button';
import { shiftChangeDateLabel } from '@/features/shift-changes/shift-change-journey';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAcceptShiftChangeProjectLeadMutation } from '@/store/api/api';
import type { ShiftChangeRequest } from '@/types/api';

export function ShiftChangeLeadReviewCard({
  row,
  onDone,
}: {
  row: ShiftChangeRequest;
  onDone?: () => void;
}) {
  const [accept, { isLoading }] = useAcceptShiftChangeProjectLeadMutation();
  const toast = useToast();

  async function onAccept() {
    try {
      await accept(row.id).unwrap();
      toast.success('Shift change approved as project lead.');
      onDone?.();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Unable to approve this request.'));
    }
  }

  return (
    <div className="space-y-4 border border-border bg-background p-4 shadow-card">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Project lead review</p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight">
          {row.employeeName ?? 'Teammate'} · {shiftChangeDateLabel(row)}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Requested {row.requestedShiftName ?? 'shift'}
          {row.currentShiftName ? ` (current: ${row.currentShiftName})` : ''}
          {row.projectName ? ` · ${row.projectName}` : ''}
        </p>
      </div>
      {row.reason ? <p className="text-sm text-muted">{row.reason}</p> : null}
      <Button type="button" disabled={isLoading} onClick={() => void onAccept()}>
        {isLoading ? 'Saving…' : 'Approve as project lead'}
      </Button>
    </div>
  );
}
