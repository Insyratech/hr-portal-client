'use client';

import { Suspense, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { MyWeekBoard } from '@/features/work/my-week-board';
import { FridaySummary, WorkIndicators } from '@/features/work/week-pulse';
import { WorkAnalyticsPanel } from '@/features/work/work-analytics-panel';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateWorkFeedbackMutation,
  useGetWorkHistoryQuery,
  useGetWorkOverviewQuery,
  useGetWorkWeekQuery,
} from '@/store/api/api';
import type { WorkHistoryMonth, WorkPriorityApprovalStatus } from '@/types/api';

const selectClass =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none focus:border-foreground';

function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function weekdayIndex(isoDate: string): number {
  const day = new Date(`${isoDate}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 6 : day - 1;
}

function entryLabel(category: string): string {
  if (category === 'UNPLANNED') return 'Unplanned';
  if (category === 'SKILL') return 'Skill';
  return 'Planned';
}

function planApprovalSummary(statuses: WorkPriorityApprovalStatus[]): string {
  if (statuses.length === 0) return 'No plan yet';
  if (statuses.every((status) => status === 'APPROVED')) return 'Approved';
  if (statuses.some((status) => status === 'RESUBMIT_REQUESTED')) return 'Needs resubmit';
  if (statuses.some((status) => status === 'SUBMITTED')) return 'Awaiting project lead';
  if (statuses.some((status) => status === 'DRAFT')) return 'Draft';
  return 'In progress';
}

function WorkSection({
  title,
  summary,
  open,
  onToggle,
  children,
  defaultBody,
  openLabel = 'Show',
  closeLabel = 'Hide',
}: {
  title: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** Content always visible (e.g. calendar). Toggle reveals the rest. */
  defaultBody?: ReactNode;
  openLabel?: string;
  closeLabel?: string;
}) {
  return (
    <section className="overflow-hidden rounded border border-border bg-background shadow-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-surface"
      >
        <div className="min-w-0">
          <Meta>{title}</Meta>
          {summary ? <p className="mt-1 truncate text-sm text-muted">{summary}</p> : null}
        </div>
        <span className="flex shrink-0 items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted">
          {open ? closeLabel : openLabel}
          <Icon name="chevron-down" className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </span>
      </button>
      {defaultBody ? <div className="border-t border-border px-5 py-4">{defaultBody}</div> : null}
      {open ? <div className={cn('px-5 pb-5', defaultBody ? 'pt-0' : 'border-t border-border pt-4')}>{children}</div> : null}
    </section>
  );
}

function WorkMonthGrid({
  history,
  selectedDate,
  onSelectDate,
}: {
  history: WorkHistoryMonth;
  selectedDate: string | null;
  onSelectDate: (isoDate: string) => void;
}) {
  const leading = useMemo(() => (history.days[0] ? weekdayIndex(history.days[0].isoDate) : 0), [history]);
  const submittedByDate = useMemo(() => {
    const map = new Map<string, WorkHistoryMonth['submitted'][number]>();
    for (const row of history.submitted) map.set(row.date, row);
    return map;
  }, [history.submitted]);
  const selected = selectedDate ? submittedByDate.get(selectedDate) : null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">✓ submitted · L leave · H holiday · M missing — tap a submitted day for notes</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
          <div key={label} className="text-muted">
            {label}
          </div>
        ))}
        {Array.from({ length: leading }).map((_, index) => (
          <div key={`pad-${index}`} />
        ))}
        {history.days.map((day) => {
          const hasNotes = submittedByDate.has(day.isoDate);
          const active = selectedDate === day.isoDate;
          return (
            <button
              key={day.isoDate}
              type="button"
              disabled={!hasNotes && day.mark !== '✓'}
              onClick={() => onSelectDate(day.isoDate)}
              className={cn(
                'border border-border bg-background py-3 shadow-card transition-colors',
                hasNotes || day.mark === '✓' ? 'hover:bg-surface' : 'cursor-default opacity-90',
                active && 'border-foreground bg-surface',
              )}
            >
              <div className="text-muted">{Number(day.isoDate.slice(8, 10))}</div>
              <div className="mt-1 text-sm">{day.mark || '·'}</div>
            </button>
          );
        })}
      </div>
      {selectedDate ? (
        <div className="rounded border border-border bg-surface px-4 py-3">
          <p className="text-sm font-medium">{selectedDate}</p>
          {selected && selected.entries.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {selected.entries.map((entry, index) => (
                <li key={`${selectedDate}-${index}`}>
                  {entryLabel(entry.category)} · {entry.description}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No notes recorded for this day.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function EmployeeWorkPanel({ employeeId }: { employeeId: string }) {
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canFeedback = permissions.includes(PERMISSIONS.WORK_FEEDBACK);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [trendsOpen, setTrendsOpen] = useState(false);
  const [type, setType] = useState('POSITIVE');
  const [comment, setComment] = useState('');

  const { data: overviewData } = useGetWorkOverviewQuery({ employeeId });
  const { data: historyData } = useGetWorkHistoryQuery({ month, employeeId });
  const { data: weekData } = useGetWorkWeekQuery({ employeeId });
  const [createFeedback, { isLoading }] = useCreateWorkFeedbackMutation();

  const overview = overviewData?.data;
  const history = historyData?.data;
  const board = weekData?.data;
  const feedback = board?.feedback ?? [];

  const workGoals = useMemo(
    () => (board?.priorities ?? []).filter((item) => item.type !== 'SKILL'),
    [board?.priorities],
  );
  const skillGoals = useMemo(
    () => (board?.priorities ?? []).filter((item) => item.type === 'SKILL'),
    [board?.priorities],
  );
  const planSummary = useMemo(() => {
    if (!board) return 'Loading this week’s plan…';
    const approval = planApprovalSummary(board.priorities.map((item) => item.approvalStatus));
    return `${board.week.start} → ${board.week.end} · ${workGoals.length} work · ${skillGoals.length} skill · ${approval}`;
  }, [board, workGoals.length, skillGoals.length]);

  const todayLine = overview
    ? overview.actions.todayUpdate
      ? 'Today’s update still expected'
      : overview.indicators.compliancePct === 100
        ? 'Updates are in for due days this week'
        : 'Check daily updates below for leave, missing, or submitted days'
    : null;

  async function onFeedback(event: FormEvent) {
    event.preventDefault();
    try {
      await createFeedback({ employeeId, type, comment }).unwrap();
      setComment('');
      toast.success('Feedback saved.');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not save feedback.'));
    }
  }

  return (
    <div className="space-y-5">
      {overview ? (
        <section className="space-y-4 rounded border border-border bg-background p-5 shadow-card">
          <div>
            <Meta>This week</Meta>
            {todayLine ? <p className="mt-2 text-sm">{todayLine}</p> : null}
          </div>
          <WorkIndicators indicators={overview.indicators} embedded />
          {overview.friday ? <FridaySummary friday={overview.friday} embedded /> : null}
          {overview.blockers.length > 0 ? (
            <div>
              <Meta>Open blockers</Meta>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {overview.blockers.map((item, index) => (
                  <li key={`${item.description}-${index}`}>{item.description}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted">No open blockers this week.</p>
          )}
        </section>
      ) : null}

      <WorkSection
        title="Daily updates"
        summary={`${month} · calendar always visible · open for the full notes list`}
        open={notesOpen}
        onToggle={() => setNotesOpen((value) => !value)}
        openLabel="All notes"
        closeLabel="Hide notes"
        defaultBody={
          history ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
                  Previous
                </Button>
                <Meta>{month}</Meta>
                <Button type="button" variant="outline" size="sm" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
                  Next
                </Button>
              </div>
              <WorkMonthGrid
                history={history}
                selectedDate={selectedDate}
                onSelectDate={(isoDate) => setSelectedDate((prev) => (prev === isoDate ? null : isoDate))}
              />
            </div>
          ) : (
            <PageLoading compact message="Loading calendar…" />
          )
        }
      >
        <Meta>All notes this month</Meta>
        {!history || history.submitted.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No daily notes yet for this month.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {history.submitted.map((row) => (
              <li key={row.date} className="rounded border border-border px-3 py-2">
                <p className="text-sm font-medium">{row.date}</p>
                <ul className="mt-1 space-y-1 text-sm text-muted">
                  {row.entries.map((entry, index) => (
                    <li key={`${row.date}-${index}`}>
                      {entryLabel(entry.category)} · {entry.description}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </WorkSection>

      <WorkSection
        title="Week plan"
        summary={planSummary}
        open={planOpen}
        onToggle={() => setPlanOpen((value) => !value)}
      >
        <p className="mb-4 text-sm text-muted">
          Weekly priorities and skill development for this employee. Read-only here — employees set their own plan.
        </p>
        <Suspense fallback={<PageLoading compact message="Loading week…" />}>
          <MyWeekBoard mode="view" fixedEmployeeId={employeeId} showHeader={false} showWeekSummary={false} compact />
        </Suspense>
      </WorkSection>

      <WorkSection
        title="Longer trends"
        summary="Reliability and skills over a date range — open only when you need history"
        open={trendsOpen}
        onToggle={() => setTrendsOpen((value) => !value)}
      >
        {trendsOpen ? <WorkAnalyticsPanel fixedEmployeeId={employeeId} /> : null}
      </WorkSection>

      <section className="rounded border border-border bg-background p-5 shadow-card">
        <Meta>Feedback</Meta>
        <ul className="mt-3 space-y-3">
          {feedback.length === 0 ? <li className="text-sm text-muted">None this week.</li> : null}
          {feedback.map((item) => (
            <li key={item.id} className="text-sm">
              <span className="uppercase tracking-[0.12em] text-muted">{item.type}</span>
              {' · '}
              {item.actorName}: {item.comment}
            </li>
          ))}
        </ul>
        {canFeedback ? (
          <form onSubmit={onFeedback} className="mt-4 space-y-3">
            <Label htmlFor="fb-type">Type</Label>
            <select id="fb-type" className={selectClass} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="POSITIVE">Positive</option>
              <option value="IMPROVEMENT">Improvement</option>
              <option value="SUPPORT">Support</option>
            </select>
            <Label htmlFor="fb-comment">Note</Label>
            <Input id="fb-comment" value={comment} onChange={(e) => setComment(e.target.value)} required />
            <Button type="submit" disabled={isLoading}>
              Save feedback
            </Button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
