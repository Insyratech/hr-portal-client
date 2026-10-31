'use client';

import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAcceptCompOffProjectLeadMutation } from '@/store/api/api';
import type { CompOffWork } from '@/types/api';

export function CompOffLeadReviewCard({
  row,
  onDone,
}: {
  row: CompOffWork;
  onDone?: () => void;
}) {
  const [accept, { isLoading }] = useAcceptCompOffProjectLeadMutation();
  const toast = useToast();

  async function onAccept() {
    try {
      await accept(row.id).unwrap();
      toast.success('Compensatory work approved as project lead.');
      onDone?.();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Unable to approve this request.'));
    }
  }

  return (
    <div className="space-y-4 border border-border bg-background p-4 shadow-card">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-meta">Project lead review</p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight">
          {row.employeeName ?? 'Teammate'} · work {row.workDate}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Compensatory work to earn COMP leave
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
