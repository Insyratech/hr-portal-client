'use client';

import { PageLoading } from '@/components/ui/page-loading';
import { Suspense } from 'react';
import { MyWeekBoard } from '@/features/work/my-week-board';
import { useSkipsWorkLoop, WorkLoopExcludedNotice } from '@/features/work/work-loop-excluded';

function PrioritiesBody() {
  const excluded = useSkipsWorkLoop();
  if (excluded) return <WorkLoopExcludedNotice title="My priorities" />;
  return <MyWeekBoard mode="self" />;
}

export default function WorkPrioritiesPage() {
  return (
    <Suspense fallback={<PageLoading compact message="Loading…" />}>
      <PrioritiesBody />
    </Suspense>
  );
}
