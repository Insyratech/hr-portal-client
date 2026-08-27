'use client';

import { PageHeader } from '@/components/layout/page-header';
import { skipsWorkApprovalLoop } from '@/features/work/work-loop';
import { useAppSelector } from '@/store/hooks';

/** Friendly empty state when SA / HR / GM / Finance open a personal work-loop URL. */
export function WorkLoopExcludedNotice({ title }: { title: string }) {
  return (
    <>
      <PageHeader kicker="Work" title={title} />
      <p className="max-w-2xl text-sm text-muted">
        Your role does not use the weekly priorities, daily update, or PPT loop. Those tools are for employees and
        CSO.
      </p>
    </>
  );
}

export function useSkipsWorkLoop(): boolean {
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  return skipsWorkApprovalLoop(roles);
}
