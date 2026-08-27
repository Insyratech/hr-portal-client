'use client';

import { Suspense, useMemo, useState } from 'react';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { WorkHistoryMonth } from '@/types/api';

const selectClass =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none focus:border-foreground';

function weekdayIndex(isoDate: string): number {
  const day = new Date(`${isoDate}T00:00:00.000Z`).getUTCDay();
  return day === 0 ? 6 : day - 1;
}

function WorkMonthGrid({ history }: { history: WorkHistoryMonth }) {
  const leading = useMemo(() => (history.days[0] ? weekdayIndex(history.days[0].isoDate) : 0), [history]);
  return (
    <div>
      <p className="mb-3 text-sm text-muted">✓ submitted · L leave · H holiday · M missing</p>
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
    </div>
  );
}

export function EmployeeWorkPanel({ employeeId }: { employeeId: string }) {
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canFeedback = permissions.includes(PERMISSIONS.WORK_FEEDBACK);
  const month = new Date().toISOString().slice(0, 7);
  const { data: overviewData } = useGetWorkOverviewQuery({ employeeId });
  const { data: historyData } = useGetWorkHistoryQuery({ month, employeeId });
  const { data: weekData } = useGetWorkWeekQuery({ employeeId });
  const [createFeedback, { isLoading }] = useCreateWorkFeedbackMutation();
  const [type, setType] = useState('POSITIVE');
  const [comment, setComment] = useState('');
  const overview = overviewData?.data;
  const history = historyData?.data;
  const feedback = weekData?.data.feedback ?? [];

  async function onFeedback(event: React.FormEvent) {
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
    <div className="space-y-8">
      {overview ? (
        <>
          <p className="text-sm">
            Today:{' '}
            {overview.actions.todayUpdate
              ? 'Expected — not submitted'
              : overview.indicators.compliancePct === 100
                ? 'Updates are in'
                : 'See the calendar for leave vs missing vs submitted'}
          </p>
          <WorkIndicators indicators={overview.indicators} />
          {overview.friday ? <FridaySummary friday={overview.friday} /> : null}
          {overview.blockers.length > 0 ? (
            <section className="border border-border bg-background p-5 shadow-card">
              <Meta>Open blockers</Meta>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {overview.blockers.map((item, index) => (
                  <li key={`${item.description}-${index}`}>{item.description}</li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="text-sm text-muted">No open blockers this week.</p>
          )}
        </>
      ) : null}

      {history ? <WorkMonthGrid history={history} /> : null}

      <section className="space-y-3">
        <Meta>This week’s plan</Meta>
        <p className="text-sm text-muted">Employees set their own priorities. This view is read-only.</p>
        <Suspense fallback={<p className="text-sm text-muted">Loading week…</p>}>
          <MyWeekBoard mode="view" fixedEmployeeId={employeeId} showHeader={false} />
        </Suspense>
      </section>

      <WorkAnalyticsPanel fixedEmployeeId={employeeId} />

      <section className="border border-border bg-background p-5 shadow-card">
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
