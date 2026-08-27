'use client';

import Link from 'next/link';
import { PageLoading } from '@/components/ui/page-loading';
import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { useGetWorkHistoryQuery } from '@/store/api/api';

function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function weekdayIndex(isoDate: string): number {
  const day = new Date(`${isoDate}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 6 : day - 1;
}

export function WorkHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
  const { data, isLoading } = useGetWorkHistoryQuery({ month });
  const history = data?.data;
  const leading = useMemo(() => (history?.days[0] ? weekdayIndex(history.days[0].isoDate) : 0), [history]);

  return (
    <>
      <PageHeader kicker="Work" title="History" />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={() => router.replace(`/work/history?month=${shiftMonth(month, -1)}`)}>
          Previous
        </Button>
        <Meta>{month}</Meta>
        <Button type="button" variant="outline" size="sm" onClick={() => router.replace(`/work/history?month=${shiftMonth(month, 1)}`)}>
          Next
        </Button>
        <Link href="/work" className="text-sm text-muted hover:text-foreground">
          Back to my week
        </Link>
      </div>
      <p className="mb-4 text-sm text-muted">✓ done · L leave · H holiday · M missing</p>
      {isLoading ? <PageLoading compact message="Loading…" /> : null}
      {history ? (
        <div className="space-y-8">
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
              <div key={label} className="text-muted">
                {label}
              </div>
            ))}
            {Array.from({ length: leading }).map((_, index) => (
              <div key={`pad-${index}`} />
            ))}
            {history.days.map((day) => (
              <div key={day.isoDate} className="border border-border bg-background py-3 shadow-card">
                <div className="text-muted">{Number(day.isoDate.slice(8, 10))}</div>
                <div className="mt-1 text-sm">{day.mark || '·'}</div>
              </div>
            ))}
          </div>
          <section className="space-y-4">
            <Meta>Notes this month</Meta>
            {history.submitted.length === 0 ? (
              <p className="text-sm text-muted">No daily notes yet.</p>
            ) : (
              history.submitted.map((row) => (
                <article key={row.date} className="border border-border bg-background p-5 shadow-card">
                  <p className="text-sm font-medium">{row.date}</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted">
                    {row.entries.map((entry, index) => (
                      <li key={`${row.date}-${index}`}>
                        {entry.category === 'UNPLANNED' ? 'Unplanned' : entry.category === 'SKILL' ? 'Skill' : 'Planned'}
                        {' · '}
                        {entry.description}
                      </li>
                    ))}
                  </ul>
                </article>
              ))
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
