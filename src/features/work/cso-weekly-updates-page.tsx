'use client';

import { PageLoading } from '@/components/ui/page-loading';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useGetWeeklyPptAdminBoardQuery,
  useLazyGetWeeklyWorkUpdateDownloadQuery,
  useShareWeeklyPptToGmMutation,
} from '@/store/api/api';

function statusTone(status: string): 'approved' | 'pending' | 'rejected' {
  if (status === 'on_time') return 'approved';
  if (status === 'late' || status === 'missing') return 'rejected';
  return 'pending';
}

function statusLabel(status: string): string {
  if (status === 'on_time') return 'On time';
  if (status === 'late') return 'Late';
  if (status === 'missing') return 'Missing';
  return 'Pending';
}

function shiftWeekStart(weekStart: string, deltaWeeks: number): string {
  const date = new Date(`${weekStart}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + deltaWeeks * 7);
  return date.toISOString().slice(0, 10);
}

function formatSharedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function CsoWeeklyUpdatesInner() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const weekFromUrl = searchParams.get('weekStart');
  const initialWeek =
    weekFromUrl && /^\d{4}-\d{2}-\d{2}$/.test(weekFromUrl) ? weekFromUrl : undefined;
  const [weekStart, setWeekStart] = useState<string | undefined>(initialWeek);
  const queryArg = useMemo(() => (weekStart ? { weekStart } : undefined), [weekStart]);
  const { data, isLoading, isError, refetch } = useGetWeeklyPptAdminBoardQuery(queryArg);
  const [shareToGm, shareState] = useShareWeeklyPptToGmMutation();
  const [fetchDownload] = useLazyGetWeeklyWorkUpdateDownloadQuery();
  const board = data?.data;

  const onDownload = useCallback(
    async (id: string) => {
      try {
        const result = await fetchDownload(id).unwrap();
        window.open(result.data.url, '_blank', 'noopener,noreferrer');
      } catch (error) {
        toast.error(apiErrorMessage(error, 'Could not open download.'));
      }
    },
    [fetchDownload, toast],
  );

  async function onShare() {
    if (!board) return;
    try {
      const result = await shareToGm({ weekStart: board.week.start }).unwrap();
      toast.success(
        `Shared ${result.data.share.fileCount} PPT${result.data.share.fileCount === 1 ? '' : 's'} with General Manager.`,
      );
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not share this week’s PPTs.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Work" title="Weekly work updates" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Master archive for this week’s employee PPTs. Download any file, then share the whole package with
        General Manager in one click. Re-share anytime — each share is kept on the timeline.
      </p>

      {isLoading ? <PageLoading compact message="Loading…" /> : null}
      {isError ? <p className="text-sm">Unable to load the weekly PPT desk.</p> : null}

      {board ? (
        <div className="space-y-8">
          <section className="flex flex-wrap items-end justify-between gap-4 border border-border bg-background p-5 shadow-card">
            <div>
              <Meta>Week</Meta>
              <p className="mt-2 text-sm font-medium">
                {board.week.start} → {board.week.end}
              </p>
              <p className="mt-1 text-xs text-muted">
                Deadline {board.week.deadlineLabel}. Late after {board.week.lateAfterLabel}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setWeekStart(shiftWeekStart(board.week.start, -1))}
              >
                Previous week
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setWeekStart(undefined)}>
                This week
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setWeekStart(shiftWeekStart(board.week.start, 1))}
              >
                Next week
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={shareState.isLoading || board.counts.submitted === 0}
                onClick={() => void onShare()}
              >
                {shareState.isLoading ? 'Sharing…' : 'Share all to General Manager'}
              </Button>
            </div>
          </section>

          {board.counts.expected === 0 ? (
            <p className="text-sm text-muted">
              No employees in the work loop this week. SA, HR, GM, and Finance are excluded; only people who
              submit priorities and daily updates appear here.
            </p>
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="border border-border bg-background p-4 shadow-card">
                  <Meta>Expected</Meta>
                  <p className="mt-2 text-2xl font-medium">{board.counts.expected}</p>
                </div>
                <div className="border border-border bg-background p-4 shadow-card">
                  <Meta>On time</Meta>
                  <p className="mt-2 text-2xl font-medium">{board.counts.onTime}</p>
                </div>
                <div className="border border-border bg-background p-4 shadow-card">
                  <Meta>Late</Meta>
                  <p className="mt-2 text-2xl font-medium">{board.counts.late}</p>
                </div>
                <div className="border border-border bg-background p-4 shadow-card">
                  <Meta>Missing</Meta>
                  <p className="mt-2 text-2xl font-medium">{board.counts.missing}</p>
                </div>
                <div className="border border-border bg-background p-4 shadow-card">
                  <Meta>Pending</Meta>
                  <p className="mt-2 text-2xl font-medium">{board.counts.pending}</p>
                </div>
              </section>

              <section className="space-y-3">
                <Meta>People</Meta>
                <ul className="space-y-3">
                  {board.people.map((person) => (
                    <li
                      key={person.employeeId}
                      className="flex flex-wrap items-center justify-between gap-3 border border-border bg-background px-4 py-3 shadow-card"
                    >
                      <div>
                        <p className="text-sm font-medium">{person.fullName}</p>
                        {person.update ? (
                          <p className="mt-1 text-xs text-muted">{person.update.systemFileName}</p>
                        ) : (
                          <p className="mt-1 text-xs text-muted">No PPT yet</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={statusTone(person.status)} label={statusLabel(person.status)} />
                        {person.update ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => void onDownload(person.update!.id)}
                          >
                            Download
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          <section className="space-y-3">
            <Meta>Share timeline (this week)</Meta>
            {board.shares.length === 0 ? (
              <p className="text-sm text-muted">Not shared with General Manager yet.</p>
            ) : (
              <ul className="space-y-3">
                {board.shares.map((share) => (
                  <li
                    key={share.id}
                    className="flex flex-wrap items-center justify-between gap-3 border border-border bg-background px-4 py-3 shadow-card"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {share.fileCount} file{share.fileCount === 1 ? '' : 's'} · {share.sharedByName}
                      </p>
                      <p className="mt-1 text-xs text-muted">{formatSharedAt(share.sharedAt)} IST</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}

export function CsoWeeklyUpdatesPage() {
  return (
    <Suspense fallback={<PageLoading compact message="Loading…" />}>
      <CsoWeeklyUpdatesInner />
    </Suspense>
  );
}
