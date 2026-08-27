'use client';

import Link from 'next/link';
import { PageLoading } from '@/components/ui/page-loading';
import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { TodayUpdate } from '@/features/work/today-update';
import { FridaySummary, WorkIndicators } from '@/features/work/week-pulse';
import { useSkipsWorkLoop, WorkLoopExcludedNotice } from '@/features/work/work-loop-excluded';
import { useGetWorkOverviewQuery } from '@/store/api/api';

function WorkToday() {
  const excluded = useSkipsWorkLoop();
  const { data } = useGetWorkOverviewQuery(undefined, { skip: excluded });
  const overview = data?.data;

  if (excluded) {
    return <WorkLoopExcludedNotice title="Today" />;
  }

  return (
    <div className="space-y-8">
      <PageHeader kicker="Work" title="Today" />
      <p className="max-w-2xl text-sm text-muted">
        Log what you did today against your week plan. Set week goals and skill plans under{' '}
        <Link href="/work/priorities" className="text-foreground underline-offset-2 hover:underline">
          Priorities
        </Link>
        .
      </p>
      <TodayUpdate />
      {overview ? <WorkIndicators indicators={overview.indicators} /> : null}
      {overview?.friday ? <FridaySummary friday={overview.friday} /> : null}
      <p className="text-sm text-muted">
        <Link href="/work/priorities" className="hover:text-foreground">
          Edit priorities
        </Link>
        {' · '}
        <Link href="/work/history" className="hover:text-foreground">
          History
        </Link>
        {' · '}
        <Link href="/work/trends" className="hover:text-foreground">
          Trends
        </Link>
      </p>
    </div>
  );
}

export default function WorkPage() {
  return (
    <Suspense fallback={<PageLoading compact message="Loading…" />}>
      <WorkToday />
    </Suspense>
  );
}
