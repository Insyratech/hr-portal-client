'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLoading } from '@/components/ui/page-loading';
import { WorkDeskSection } from '@/features/work/work-desk-section';
import { useGetLeadDailyWorkQuery } from '@/store/api/api';
import type { LeadDailyWorkEntry } from '@/types/api';

const CATEGORY_LABEL: Record<string, string> = {
  PLANNED: 'Planned',
  UNPLANNED: 'Unplanned',
  SKILL: 'Skill',
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function groupEntries(entries: LeadDailyWorkEntry[]) {
  const byDate = new Map<string, LeadDailyWorkEntry[]>();
  for (const entry of entries) {
    const list = byDate.get(entry.date) ?? [];
    list.push(entry);
    byDate.set(entry.date, list);
  }
  return [...byDate.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

export function LeadDailyWorkPanel({
  weekDate,
  projectId,
  title = 'Daily work updates',
  description = 'Submitted daily notes for people on your project(s). This week is shown by default; open history for another range.',
  embeddedEntries,
  embeddedRange,
  className,
}: {
  weekDate: string;
  projectId?: string;
  title?: string;
  description?: string;
  /** When provided (project desk), skip the cross-project query and use these entries. */
  embeddedEntries?: LeadDailyWorkEntry[];
  embeddedRange?: { start: string; end: string };
  className?: string;
}) {
  const [mode, setMode] = useState<'week' | 'history'>('week');
  const [from, setFrom] = useState(weekDate);
  const [to, setTo] = useState(weekDate);

  const queryArg =
    mode === 'history'
      ? { from, to, projectId }
      : { date: weekDate, projectId };

  const { data, isLoading, isFetching } = useGetLeadDailyWorkQuery(queryArg, {
    skip: Boolean(embeddedEntries) && mode === 'week',
  });

  const range = embeddedEntries && mode === 'week' ? embeddedRange : data?.data.range;
  const entries = useMemo(() => {
    if (embeddedEntries && mode === 'week') return embeddedEntries;
    return data?.data.entries ?? [];
  }, [embeddedEntries, mode, data?.data.entries]);

  const grouped = useMemo(() => groupEntries(entries), [entries]);
  const showProject = !projectId;

  return (
    <WorkDeskSection
      title={title}
      description={description}
      className={className}
      bodyClassName="max-h-[28rem]"
      action={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === 'week' ? 'primary' : 'outline'}
            onClick={() => setMode('week')}
          >
            This week
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'history' ? 'primary' : 'outline'}
            onClick={() => {
              setMode('history');
              setFrom(range?.start ?? weekDate);
              setTo(range?.end ?? weekDate);
            }}
          >
            History
          </Button>
        </div>
      }
    >
      {mode === 'history' ? (
        <div className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface/40 p-3">
          <div>
            <Label htmlFor="daily-from">From</Label>
            <Input
              id="daily-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value || todayIso())}
            />
          </div>
          <div>
            <Label htmlFor="daily-to">To</Label>
            <Input
              id="daily-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value || todayIso())}
            />
          </div>
          <p className="text-sm text-muted">
            Showing <span className="text-foreground">{from}</span> →{' '}
            <span className="text-foreground">{to}</span>
          </p>
        </div>
      ) : range ? (
        <p className="text-sm text-muted">
          Week <span className="text-foreground">{range.start}</span> →{' '}
          <span className="text-foreground">{range.end}</span>
        </p>
      ) : null}

      {isLoading || isFetching ? <PageLoading compact message="Loading daily work…" /> : null}

      {!isLoading && !isFetching && grouped.length === 0 ? (
        <p className="text-sm text-muted">No daily work updates in this period yet.</p>
      ) : null}

      <div className="space-y-5">
        {grouped.map(([date, items]) => (
          <div key={date} className="space-y-2">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">{date}</p>
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded border border-border bg-surface/30 px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{item.employeeName}</p>
                    <p className="text-xs uppercase tracking-[0.12em] text-muted">
                      {CATEGORY_LABEL[item.category] ?? item.category}
                      {showProject ? ` · ${item.projectCode}` : ''}
                    </p>
                  </div>
                  {showProject ? (
                    <p className="mt-0.5 text-xs text-muted">{item.projectName}</p>
                  ) : null}
                  <p className="mt-2 whitespace-pre-wrap text-sm">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </WorkDeskSection>
  );
}
