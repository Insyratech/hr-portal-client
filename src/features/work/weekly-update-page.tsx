'use client';

import { useCallback, useState } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { skipsWorkApprovalLoop } from '@/features/work/work-loop';
import { WorkLoopExcludedNotice } from '@/features/work/work-loop-excluded';
import { uploadWeeklyWorkUpdate } from '@/features/work/upload-weekly-update';
import {
  useCreateWeeklyWorkUpdateUploadMutation,
  useGetWeeklyWorkUpdateBoardQuery,
  useLazyGetWeeklyWorkUpdateDownloadQuery,
} from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';

const ACCEPT = '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';

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

export function WeeklyUpdatePage() {
  const toast = useToast();
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  const excluded = skipsWorkApprovalLoop(roles);
  const { data, isLoading, isError, refetch } = useGetWeeklyWorkUpdateBoardQuery(undefined, {
    skip: excluded,
  });
  const [createUpload, uploadState] = useCreateWeeklyWorkUpdateUploadMutation();
  const [fetchDownload] = useLazyGetWeeklyWorkUpdateDownloadQuery();
  const [dragging, setDragging] = useState(false);
  const board = data?.data;

  const onFile = useCallback(
    async (file: File | null) => {
      if (excluded || !file || !board) return;
      const lower = file.name.toLowerCase();
      if (!lower.endsWith('.ppt') && !lower.endsWith('.pptx')) {
        toast.error('Upload a .ppt or .pptx file only.');
        return;
      }
      if (file.size > board.maxBytes) {
        toast.error('File must be 15 MB or smaller.');
        return;
      }
      if (board.uploadsRemaining <= 0) {
        toast.error('You already used both uploads for this week.');
        return;
      }
      try {
        const result = await uploadWeeklyWorkUpdate(createUpload, file);
        toast.success(
          result.update.late
            ? 'Uploaded (marked late — after Sunday 6:00 pm IST).'
            : 'Weekly update uploaded.',
        );
        await refetch();
      } catch (error) {
        toast.error(apiErrorMessage(error, 'Could not upload the weekly PPT.'));
      }
    },
    [board, createUpload, excluded, refetch, toast],
  );

  if (excluded) {
    return <WorkLoopExcludedNotice title="My weekly update" />;
  }

  async function onDownload(id: string) {
    try {
      const result = await fetchDownload(id).unwrap();
      window.open(result.data.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not open download.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Work" title="My weekly update" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Upload one PowerPoint that explains what you did this week. Deadline{' '}
        <span className="font-medium text-foreground">Sunday 23:59 IST</span>. After Sunday 6:00 pm IST the
        upload is flagged late. You can replace once (2 uploads max; the second deletes the first).
      </p>

      {isLoading ? <PageLoading compact message="Loading…" /> : null}
      {isError ? <p className="text-sm">Unable to load weekly updates.</p> : null}

      {board ? (
        <div className="space-y-8">
          <section className="border border-border bg-background p-5 shadow-card">
            <Meta>This week</Meta>
            <p className="mt-2 text-sm">
              {board.week.start} → {board.week.end}
            </p>
            <p className="mt-2 text-sm text-muted">
              Deadline {board.week.deadlineLabel}. Late after {board.week.lateAfterLabel}. Uploads left:{' '}
              {board.uploadsRemaining} of {board.maxUploads}.
            </p>
            {board.current ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <StatusBadge
                  status={board.current.late ? 'rejected' : 'approved'}
                  label={board.current.late ? 'Late' : 'On time'}
                />
                <span className="font-medium">{board.current.systemFileName}</span>
                {board.current.fileAvailable !== false ? (
                  <button type="button" className="underline text-muted hover:text-foreground" onClick={() => onDownload(board.current!.id)}>
                    Download
                  </button>
                ) : (
                  <span className="text-xs text-muted">File removed from storage (audit kept)</span>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">No PPT uploaded for this week yet.</p>
            )}
          </section>

          <section
            className={cn(
              'rounded border border-dashed border-border bg-surface p-8 text-center transition-colors',
              dragging && 'border-foreground bg-background',
              board.uploadsRemaining <= 0 && 'opacity-60',
            )}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void onFile(event.dataTransfer.files?.[0] ?? null);
            }}
          >
            <Meta>Upload</Meta>
            <p className="mt-3 text-sm text-muted">Drag and drop a .ppt / .pptx here (max 15 MB), or choose a file.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <label className="inline-flex cursor-pointer">
                <input
                  type="file"
                  className="sr-only"
                  accept={ACCEPT}
                  disabled={uploadState.isLoading || board.uploadsRemaining <= 0}
                  onChange={(event) => {
                    void onFile(event.target.files?.[0] ?? null);
                    event.target.value = '';
                  }}
                />
                <span className="inline-flex h-10 items-center rounded border border-border bg-background px-4 text-sm font-medium shadow-card transition-colors hover:bg-surface">
                  {uploadState.isLoading ? 'Uploading…' : board.current ? 'Replace PPT' : 'Choose PPT'}
                </span>
              </label>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <div className="border border-border bg-background p-5 shadow-card">
              <Meta>On time</Meta>
              <p className="mt-2 text-2xl font-medium">{board.stats.onTime}</p>
            </div>
            <div className="border border-border bg-background p-5 shadow-card">
              <Meta>Late</Meta>
              <p className="mt-2 text-2xl font-medium">{board.stats.late}</p>
            </div>
            <div className="border border-border bg-background p-5 shadow-card">
              <Meta>Missing</Meta>
              <p className="mt-2 text-2xl font-medium">{board.stats.missing}</p>
            </div>
          </section>

          <section className="space-y-3">
            <Meta>Recent weeks</Meta>
            <ul className="space-y-3">
              {board.weeks.map((week) => (
                <li key={week.weekStart} className="flex flex-wrap items-center justify-between gap-3 border border-border bg-background px-4 py-3 shadow-card">
                  <div>
                    <p className="text-sm font-medium">
                      {week.weekStart} → {week.weekEnd}
                    </p>
                    {week.update ? (
                      <p className="mt-1 text-xs text-muted">{week.update.systemFileName}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={statusTone(week.status)} label={statusLabel(week.status)} />
                    {week.update && week.update.fileAvailable !== false ? (
                      <Button type="button" size="sm" variant="ghost" onClick={() => onDownload(week.update!.id)}>
                        Download
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </>
  );
}
