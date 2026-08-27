'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { MyWeekBoard } from '@/features/work/my-week-board';

export function AdminWorkPrioritiesPage({ canApprove = false }: { canApprove?: boolean }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <PageHeader kicker="Work" title="Priorities" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        {canApprove
          ? 'Review each priority line. Approve to unlock that employee’s daily updates for the week, or ask for a resubmit with a short comment.'
          : 'Employees set their own week goals and skill plans. Open someone to review — only CSO can approve. Daily submissions are on Team week; longer trends are on Insights.'}
      </p>
      <MyWeekBoard mode="view" showHeader={false} canApprove={canApprove} />
    </Suspense>
  );
}
