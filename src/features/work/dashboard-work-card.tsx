'use client';

import Link from 'next/link';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { useGetWorkOverviewQuery } from '@/store/api/api';

export function DashboardWorkCard() {
  const { data, isLoading } = useGetWorkOverviewQuery();
  const overview = data?.data;
  if (isLoading) {
    return (
      <section className="border border-border bg-background p-5 shadow-card">
        <Meta>This week</Meta>
        <p className="mt-2 text-sm text-muted">Checking your week…</p>
      </section>
    );
  }
  if (!overview) return null;

  const title = overview.actions.setPriorities
    ? 'Set this week’s priorities'
    : overview.actions.todayUpdate
      ? 'Log today’s update'
      : overview.wrapUp
        ? 'This week, from your records'
        : 'This week is on track';
  const detail = overview.actions.setPriorities
    ? 'Add at least one work goal (about 3–5 is a focused week). Submit before end of Monday. If you are on leave Monday, submit when you are back.'
    : overview.actions.todayUpdate
      ? 'Tick what you did and add a short note. No report needed.'
      : overview.wrapUp
        ? `${overview.friday?.done ?? 0} of ${overview.friday?.total ?? 0} priorities done.`
        : 'Open Priorities if you want to change anything.';

  return (
    <section className="border border-border bg-background p-5 shadow-card">
      <Meta>Work & Priorities</Meta>
      <p className="mt-2 text-sm font-medium">{title}</p>
      <p className="mt-2 text-sm text-muted">{detail}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {overview.actions.setPriorities ? (
          <Button asChild>
            <Link href="/work/priorities">Set priorities</Link>
          </Button>
        ) : null}
        {overview.actions.todayUpdate ? (
          <Button asChild variant={overview.actions.setPriorities ? 'outline' : 'primary'}>
            <Link href="/work">Today’s update</Link>
          </Button>
        ) : null}
        {!overview.actions.setPriorities && !overview.actions.todayUpdate ? (
          <Button asChild variant="outline">
            <Link href={overview.wrapUp ? '/work' : '/work/priorities'}>
              {overview.wrapUp ? 'See today' : 'My priorities'}
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
