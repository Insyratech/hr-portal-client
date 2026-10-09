'use client';

import { useCallback, useState } from 'react';
import { ActionConfirmDialog } from '@/components/dashboard/action-confirm-dialog';
import { PageLoading } from '@/components/ui/page-loading';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { skipsWorkApprovalLoop } from '@/features/work/work-loop';
import { WorkLoopExcludedNotice } from '@/features/work/work-loop-excluded';
import {
  formatJcWhen,
  jcStatusLabel,
  jcStatusTone,
  openPptView,
  uploadJcPpt,
} from '@/features/work/jc-helpers';
import { PptRaiseConcernPanel } from '@/features/work/ppt-concerns-panel';
import { weeklyPptTimingLabel, weeklyPptTimingTone } from '@/features/work/weekly-ppt-status';
import {
  useCreateJcPptUploadMutation,
  useGetJcPptBoardQuery,
  useLazyGetJcPptDownloadQuery,
} from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';

const ACCEPT =
  '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';

export function JcPage() {
  const toast = useToast();
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  const excluded = skipsWorkApprovalLoop(roles);
  const { data, isLoading, isError, refetch } = useGetJcPptBoardQuery(undefined, { skip: excluded });
  const [createUpload, uploadState] = useCreateJcPptUploadMutation();
  const [fetchDownload] = useLazyGetJcPptDownloadQuery();
  const [dragging, setDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [paperTitle, setPaperTitle] = useState('');
  const [doiUrl, setDoiUrl] = useState('');
  const board = data?.data;
  const maxUploads = board?.maxUploads ?? 10;
  const uploadsRemaining = board?.uploadsRemaining ?? maxUploads;

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
      if (uploadsRemaining <= 0) {
        toast.error(`You already used all ${maxUploads} JC uploads for this week.`);
        return;
      }
      const title = paperTitle.trim();
      const doi = doiUrl.trim();
      if (title.length < 3) {
        toast.error('Enter the research paper name (at least 3 characters).');
        return;
      }
      if (doi.length < 5) {
        toast.error('Enter the DOI or paper link.');
        return;
      }
      setPendingFile(file);
    },
    [board, excluded, doiUrl, maxUploads, paperTitle, toast, uploadsRemaining],
  );

  const confirmUpload = useCallback(async () => {
    if (!pendingFile || !board) return;
    try {
      const result = await uploadJcPpt(createUpload, pendingFile, {
        paperTitle: paperTitle.trim(),
        doiUrl: doiUrl.trim(),
      });
      setPendingFile(null);
      if (result.item.timing === 'late' || result.item.late) {
        toast.success('JC PPT uploaded (marked late).');
      } else {
        toast.success(board.pending ? 'JC PPT replaced.' : 'JC PPT uploaded.');
      }
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not upload the JC PPT.'));
    }
  }, [board, createUpload, doiUrl, paperTitle, pendingFile, refetch, toast]);

  if (excluded) {
    return <WorkLoopExcludedNotice title="JC" />;
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
      <PageHeader kicker="Work" title="JC" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Upload a JC PowerPoint for CSO review (Tuesday → Monday week). Include the research paper name and DOI/link.
        Upload window <span className="font-medium text-foreground">Saturday 2:00 pm → Sunday 23:59 IST</span>; up to{' '}
        {maxUploads} replaces. After the deadline, raise a concern for CSO approval to reopen one late upload.
        Unapproved concerns are a RED FLAG on the GM monthly report. Use View before CSO transfers the file to General
        Manager.
      </p>

      {isLoading ? <PageLoading compact message="Loading…" /> : null}
      {isError ? <p className="text-sm">Unable to load JC PPTs.</p> : null}

      {board ? (
        <div className="space-y-8">
          {board.week ? (
            <section className="border border-border bg-background p-5 shadow-card">
              <Meta>This week</Meta>
              <p className="mt-2 text-sm">
                {board.week.start} → {board.week.end}
              </p>
              <p className="mt-2 text-sm text-muted">
                Window opens {board.week.windowOpenLabel ?? 'Saturday 14:00 IST'}. Deadline {board.week.deadlineLabel}.
                Uploads left: {uploadsRemaining} of {maxUploads}.
              </p>
            </section>
          ) : null}

          <section className="border border-border bg-background p-5 shadow-card">
            <Meta>Pending with CSO</Meta>
            {board.pending ? (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={jcStatusTone(board.pending.status)} label={jcStatusLabel(board.pending.status)} />
                  {board.pending.timing ? (
                    <StatusBadge
                      status={weeklyPptTimingTone(board.pending.timing)}
                      label={weeklyPptTimingLabel(board.pending.timing)}
                    />
                  ) : null}
                  <span className="font-medium">{board.pending.systemFileName}</span>
                  <span className="text-muted">{formatJcWhen(board.pending.uploadedAt)}</span>
                  {board.pending.fileAvailable ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => void onView(board.pending!.id)}>
                      View
                    </Button>
                  ) : null}
                </div>
                {board.pending.paperTitle ? (
                  <p className="text-muted">
                    Paper: <span className="text-foreground">{board.pending.paperTitle}</span>
                    {board.pending.doiUrl ? (
                      <>
                        {' · '}
                        <a
                          href={board.pending.doiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-foreground"
                        >
                          DOI / link
                        </a>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">No JC PPT waiting with CSO for this week.</p>
            )}
          </section>

          <PptRaiseConcernPanel kind="jc" weekStart={board.week?.start} />

          <section className="border border-border bg-background p-5 shadow-card">
            <Meta>Paper details</Meta>
            <p className="mt-2 text-sm text-muted">Required for every JC upload from now on (kept for CSO / future reference).</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="jc-paper-title">Research paper name</Label>
                <Input
                  id="jc-paper-title"
                  className="mt-1"
                  value={paperTitle}
                  onChange={(event) => setPaperTitle(event.target.value)}
                  placeholder="Title as on the paper"
                  maxLength={500}
                />
              </div>
              <div>
                <Label htmlFor="jc-doi">DOI or paper link</Label>
                <Input
                  id="jc-doi"
                  className="mt-1"
                  value={doiUrl}
                  onChange={(event) => setDoiUrl(event.target.value)}
                  placeholder="https://doi.org/10.… or 10.1234/…"
                  maxLength={500}
                />
              </div>
            </div>
          </section>

          <section
            className={cn(
              'rounded border border-dashed border-border bg-surface p-8 text-center transition-colors',
              dragging && 'border-foreground bg-background',
              uploadsRemaining <= 0 && 'opacity-60',
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
            <p className="mt-3 text-sm text-muted">
              Drag and drop a .ppt / .pptx here (max 15 MB), or choose a file.
              {board.pending ? ' Replacing removes the previous pending file for this week.' : null}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <label className="inline-flex cursor-pointer">
                <input
                  type="file"
                  className="sr-only"
                  accept={ACCEPT}
                  disabled={uploadState.isLoading || uploadsRemaining <= 0}
                  onChange={(event) => {
                    requestUpload(event.target.files?.[0] ?? null);
                    event.target.value = '';
                  }}
                />
                <span className="inline-flex h-10 items-center rounded border border-border bg-background px-4 text-sm font-medium shadow-card transition-colors hover:bg-surface">
                  {uploadState.isLoading ? 'Uploading…' : board.pending ? 'Replace JC PPT' : 'Choose JC PPT'}
                </span>
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <Meta>History</Meta>
            {board.items.length === 0 ? (
              <p className="text-sm text-muted">No JC uploads yet.</p>
            ) : (
              <ul className="space-y-3">
                {board.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 border border-border bg-background px-4 py-3 shadow-card"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.systemFileName}</p>
                      {item.paperTitle ? (
                        <p className="mt-1 text-xs text-foreground">
                          {item.paperTitle}
                          {item.doiUrl ? (
                            <>
                              {' · '}
                              <a
                                href={item.doiUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted underline hover:text-foreground"
                              >
                                DOI / link
                              </a>
                            </>
                          ) : null}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted">
                        {item.weekStart && item.weekEnd ? `${item.weekStart} → ${item.weekEnd} · ` : ''}
                        Uploaded {formatJcWhen(item.uploadedAt)}
                        {item.transferredAt ? ` · Transferred ${formatJcWhen(item.transferredAt)}` : ''}
                        {item.consumedAt
                          ? ` · ${item.status === 'emailed' ? 'Emailed' : 'Downloaded'} ${formatJcWhen(item.consumedAt)}`
                          : ''}
                        {item.emailRecipient ? ` · ${item.emailRecipient}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={jcStatusTone(item.status)} label={jcStatusLabel(item.status)} />
                      {item.fileAvailable ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => void onView(item.id)}>
                          View
                        </Button>
                      ) : item.status === 'with_gm' ? (
                        <span className="text-xs text-muted">With GM — view closed</span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {board.events.length > 0 ? (
            <section className="space-y-3">
              <Meta>Audit log</Meta>
              <ul className="space-y-2">
                {board.events.slice(0, 40).map((event) => (
                  <li key={event.id} className="border border-border bg-background px-4 py-3 text-sm shadow-card">
                    <p className="font-medium">
                      {event.eventType.replaceAll('_', ' ')}
                      {event.actorName ? ` · ${event.actorName}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {formatJcWhen(event.createdAt)}
                      {event.note ? ` — ${event.note}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      <ActionConfirmDialog
        open={Boolean(pendingFile)}
        title={board?.pending ? 'Replace JC PPT?' : 'Upload JC PPT?'}
        description={
          pendingFile
            ? board?.pending
              ? `Upload “${pendingFile.name}” for “${paperTitle.trim()}”? This replaces the JC file currently pending with CSO.`
              : `Upload “${pendingFile.name}” for “${paperTitle.trim()}” for CSO review?`
            : 'Confirm upload.'
        }
        confirmLabel={board?.pending ? 'OK, replace' : 'OK, upload'}
        pending={uploadState.isLoading}
        onCancel={() => {
          if (!uploadState.isLoading) setPendingFile(null);
        }}
        onConfirm={() => void confirmUpload()}
      />
    </>
  );
}
