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
import {
  formatJcWhen,
  jcStatusLabel,
  jcStatusTone,
  uploadJcPpt,
} from '@/features/work/jc-helpers';
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
      try {
        await uploadJcPpt(createUpload, file);
        toast.success(board.pending ? 'JC PPT replaced.' : 'JC PPT uploaded.');
        await refetch();
      } catch (error) {
        toast.error(apiErrorMessage(error, 'Could not upload the JC PPT.'));
      }
    },
    [board, createUpload, excluded, refetch, toast],
  );

  if (excluded) {
    return <WorkLoopExcludedNotice title="JC" />;
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
      <PageHeader kicker="Work" title="JC" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Upload a JC PowerPoint for CSO review. CSO can transfer it to General Manager. After GM downloads or emails
        the file, it is removed from portal storage — this page keeps the audit history.
      </p>

      {isLoading ? <PageLoading compact message="Loading…" /> : null}
      {isError ? <p className="text-sm">Unable to load JC PPTs.</p> : null}

      {board ? (
        <div className="space-y-8">
          <section className="border border-border bg-background p-5 shadow-card">
            <Meta>Pending with CSO</Meta>
            {board.pending ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <StatusBadge status={jcStatusTone(board.pending.status)} label={jcStatusLabel(board.pending.status)} />
                <span className="font-medium">{board.pending.systemFileName}</span>
                <span className="text-muted">{formatJcWhen(board.pending.uploadedAt)}</span>
                {board.pending.fileAvailable ? (
                  <button
                    type="button"
                    className="underline text-muted hover:text-foreground"
                    onClick={() => void onDownload(board.pending!.id)}
                  >
                    Download
                  </button>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">No JC PPT waiting with CSO.</p>
            )}
          </section>

          <section
            className={cn(
              'rounded border border-dashed border-border bg-surface p-8 text-center transition-colors',
              dragging && 'border-foreground bg-background',
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
            <p className="mt-3 text-sm text-muted">
              Drag and drop a .ppt / .pptx here (max 15 MB), or choose a file.
              {board.pending ? ' Replacing removes the previous pending file.' : null}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <label className="inline-flex cursor-pointer">
                <input
                  type="file"
                  className="sr-only"
                  accept={ACCEPT}
                  disabled={uploadState.isLoading}
                  onChange={(event) => {
                    void onFile(event.target.files?.[0] ?? null);
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
                      <p className="mt-1 text-xs text-muted">
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
                        <Button type="button" size="sm" variant="ghost" onClick={() => void onDownload(item.id)}>
                          Download
                        </Button>
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
    </>
  );
}
