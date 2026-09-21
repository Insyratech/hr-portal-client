'use client';

import { useCallback, useState } from 'react';
import { ActionConfirmDialog } from '@/components/dashboard/action-confirm-dialog';
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
import { openPptView } from '@/features/work/jc-helpers';
import {
  weeklyPptStatusLabel,
  weeklyPptStatusTone,
  weeklyPptTimingLabel,
  weeklyPptTimingTone,
} from '@/features/work/weekly-ppt-status';
import {
  WEEKLY_UPDATE_TEMPLATE_FILENAME,
  WEEKLY_UPDATE_TEMPLATE_HREF,
} from '@/features/work/weekly-update-template';
import {
  useCreateWeeklyWorkUpdateUploadMutation,
  useGetWeeklyWorkUpdateBoardQuery,
  useLazyGetWeeklyWorkUpdateDownloadQuery,
} from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';

const ACCEPT = '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';

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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const board = data?.data;

  const requestUpload = useCallback(
    (file: File | null) => {
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
      setPendingFile(file);
    },
    [board, excluded, toast],
  );

  const confirmUpload = useCallback(async () => {
    if (!pendingFile || !board) return;
    try {
      const result = await uploadWeeklyWorkUpdate(createUpload, pendingFile);
      setPendingFile(null);
      if (result.update.timing === 'late') {
        toast.success('Uploaded (marked late — after Sunday 11:59 pm IST).');
      } else if (result.update.timing === 'last_hour') {
        toast.success('Uploaded (last hour submission — still within Sunday).');
      } else {
        toast.success('Weekly update uploaded.');
      }
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not upload the weekly PPT.'));
    }
  }, [board, createUpload, pendingFile, refetch, toast]);

  if (excluded) {
    return <WorkLoopExcludedNotice title="My weekly update" />;
  }

  async function onView(id: string) {
    try {
      const result = await fetchDownload(id).unwrap();
      openPptView(result.data.url);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not open the PPT for viewing.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Work" title="My weekly update" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Upload one PowerPoint that explains what you did this week. Use View to check it in the browser. Deadline{' '}
        <span className="font-medium text-foreground">Sunday 23:59 IST</span>. After CSO shares the week with General
        Manager, the file leaves this page (history remains). You can replace once before share (2 uploads max).
      </p>

      <section className="mb-8 border border-border bg-background p-5 shadow-card">
        <Meta>Weekly update template</Meta>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Download the standard format, fill in your week, then upload below. New and existing employees use the
          same template.
        </p>
        <div className="mt-4">
          <Button asChild type="button" size="sm" variant="outline">
            <a href={WEEKLY_UPDATE_TEMPLATE_HREF} download={WEEKLY_UPDATE_TEMPLATE_FILENAME}>
              Download template
            </a>
          </Button>
        </div>
      </section>

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
              Deadline {board.week.deadlineLabel}. Last hour submission from {board.week.lastHourAfterLabel}.
              Uploads left: {board.uploadsRemaining} of {board.maxUploads}.
            </p>
            {board.current ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <StatusBadge
                  status={weeklyPptTimingTone(board.current.timing)}
                  label={weeklyPptTimingLabel(board.current.timing)}
                />
                <span className="font-medium">{board.current.systemFileName}</span>
                {board.current.fileAvailable !== false ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => void onView(board.current!.id)}>
                    View
                  </Button>
                ) : board.current.sharedToGm ? (
                  <span className="text-xs text-muted">Shared with GM — view closed</span>
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
              requestUpload(event.dataTransfer.files?.[0] ?? null);
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
                    requestUpload(event.target.files?.[0] ?? null);
                    event.target.value = '';
                  }}
                />
                <span className="inline-flex h-10 items-center rounded border border-border bg-background px-4 text-sm font-medium shadow-card transition-colors hover:bg-surface">
                  {uploadState.isLoading ? 'Uploading…' : board.current ? 'Replace PPT' : 'Choose PPT'}
                </span>
              </label>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-border bg-background p-5 shadow-card">
              <Meta>On time</Meta>
              <p className="mt-2 text-2xl font-medium">{board.stats.onTime}</p>
            </div>
            <div className="border border-border bg-background p-5 shadow-card">
              <Meta>Last hour</Meta>
              <p className="mt-2 text-2xl font-medium">{board.stats.lastHour}</p>
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
                    <StatusBadge
                      status={weeklyPptStatusTone(week.status)}
                      label={weeklyPptStatusLabel(week.status)}
                    />
                    {week.update && week.update.fileAvailable !== false ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => void onView(week.update!.id)}>
                        View
                      </Button>
                    ) : week.update?.sharedToGm ? (
                      <span className="text-xs text-muted">Shared with GM</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      <ActionConfirmDialog
        open={Boolean(pendingFile)}
        title={board?.current ? 'Replace weekly PPT?' : 'Upload weekly PPT?'}
        description={
          pendingFile
            ? board?.current
              ? `Upload “${pendingFile.name}”? This uses one of your two weekly uploads and replaces the current file.`
              : `Upload “${pendingFile.name}” as this week’s update?`
            : 'Confirm upload.'
        }
        confirmLabel={board?.current ? 'OK, replace' : 'OK, upload'}
        pending={uploadState.isLoading}
        onCancel={() => {
          if (!uploadState.isLoading) setPendingFile(null);
        }}
        onConfirm={() => void confirmUpload()}
      />
    </>
  );
}
