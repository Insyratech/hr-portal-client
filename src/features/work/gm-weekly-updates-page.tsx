'use client';

import { PageLoading } from '@/components/ui/page-loading';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { downloadBase64File } from '@/features/work/jc-helpers';
import {
  useGetWeeklyPptGmSharesQuery,
  useGmDeleteAllWeeklyPptsInShareMutation,
  useGmDeleteWeeklyPptMutation,
  useGmDownloadWeeklyPptMutation,
  useGmEmailWeeklyPptMutation,
} from '@/store/api/api';

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

function removedLabel(reason: string | null): string {
  if (reason === 'emailed') return 'Emailed';
  if (reason === 'deleted') return 'Deleted';
  if (reason === 'downloaded') return 'Downloaded';
  return 'Removed';
}

function GmWeeklyUpdatesInner() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const highlightShareId = searchParams.get('shareId');
  const { data, isLoading, isError, refetch } = useGetWeeklyPptGmSharesQuery();
  const [downloadPpt, downloadState] = useGmDownloadWeeklyPptMutation();
  const [emailPpt, emailState] = useGmEmailWeeklyPptMutation();
  const [deletePpt, deleteState] = useGmDeleteWeeklyPptMutation();
  const [deleteAll, deleteAllState] = useGmDeleteAllWeeklyPptsInShareMutation();
  const [emailById, setEmailById] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const board = data?.data;

  const ordered = useMemo(() => board?.shares ?? [], [board?.shares]);

  useEffect(() => {
    if (!highlightShareId) return;
    const el = document.getElementById(`share-${highlightShareId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [highlightShareId, ordered.length]);

  async function onDownload(updateId: string, shareId: string) {
    const key = `${shareId}:${updateId}`;
    setBusyKey(key);
    try {
      const result = await downloadPpt({ id: updateId, shareId }).unwrap();
      const payload = result.data.download;
      if (payload) {
        downloadBase64File(payload.fileName, payload.contentType, payload.contentBase64);
      }
      toast.success('Downloaded. File removed from portal storage.');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not download weekly PPT.'));
    } finally {
      setBusyKey(null);
    }
  }

  async function onDownloadAll(shareId: string, updateIds: string[]) {
    try {
      for (const updateId of updateIds) {
        const result = await downloadPpt({ id: updateId, shareId }).unwrap();
        const payload = result.data.download;
        if (payload) {
          downloadBase64File(payload.fileName, payload.contentType, payload.contentBase64);
        }
      }
      toast.success('Downloaded available files. Removed from portal storage.');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not download all weekly PPTs.'));
      await refetch();
    }
  }

  async function onEmail(updateId: string, shareId: string) {
    const key = `${shareId}:${updateId}`;
    const recipientEmail = (emailById[key] ?? '').trim();
    if (!recipientEmail.includes('@')) {
      toast.error('Enter a valid recipient email address.');
      return;
    }
    setBusyKey(key);
    try {
      await emailPpt({ id: updateId, shareId, recipientEmail }).unwrap();
      toast.success(`Emailed to ${recipientEmail}. File removed from portal storage.`);
      setEmailById((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not email weekly PPT.'));
    } finally {
      setBusyKey(null);
    }
  }

  async function onDelete(updateId: string, shareId: string) {
    if (!window.confirm('Delete this weekly PPT from portal storage? Audit history will remain.')) return;
    const key = `${shareId}:${updateId}`;
    setBusyKey(key);
    try {
      await deletePpt({ id: updateId, shareId }).unwrap();
      toast.success('Deleted from portal storage. Audit history kept.');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete weekly PPT.'));
    } finally {
      setBusyKey(null);
    }
  }

  async function onDeleteAll(shareId: string, count: number) {
    if (
      !window.confirm(
        `Delete all ${count} available weekly PPT(s) in this package from portal storage? Audit history will remain.`,
      )
    ) {
      return;
    }
    try {
      const result = await deleteAll(shareId).unwrap();
      toast.success(`Deleted ${result.data.removed} file(s). Audit history kept.`);
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete weekly PPTs.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Work" title="Shared weekly updates" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Packages CSO shared with you (max 15 MB per file). Download, email, or delete — each removes the file from
        portal storage and keeps the share history for audit.
      </p>

      {isLoading ? <PageLoading compact message="Loading…" /> : null}
      {isError ? <p className="text-sm">Unable to load shared weekly updates.</p> : null}

      {board ? (
        <div className="space-y-6">
          {board.count === 0 ? (
            <p className="text-sm text-muted">
              No packages shared yet. When CSO shares a week’s PPTs, they appear here.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted">
                {board.count} shared package{board.count === 1 ? '' : 's'}.
              </p>
              <ul className="space-y-4">
                {ordered.map((share) => {
                  const highlighted = highlightShareId === share.id;
                  const available = share.files.filter((file) => file.fileAvailable);
                  return (
                    <li
                      key={share.id}
                      id={`share-${share.id}`}
                      className={cn(
                        'border border-border bg-background p-5 shadow-card',
                        highlighted && 'ring-1 ring-foreground',
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Meta>Week</Meta>
                          <p className="mt-1 text-sm font-medium">
                            {share.weekStart} → {share.weekEnd}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            Shared by {share.sharedByName} · {formatSharedAt(share.sharedAt)} IST ·{' '}
                            {share.fileCount} file{share.fileCount === 1 ? '' : 's'} · {share.availableCount} still in
                            storage
                          </p>
                        </div>
                        {available.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={downloadState.isLoading}
                              onClick={() =>
                                void onDownloadAll(
                                  share.id,
                                  available.map((file) => file.updateId),
                                )
                              }
                            >
                              Download all
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={deleteAllState.isLoading}
                              onClick={() => void onDeleteAll(share.id, available.length)}
                            >
                              Delete all
                            </Button>
                          </div>
                        ) : null}
                      </div>

                      {share.files.length === 0 ? (
                        <p className="mt-4 text-sm text-muted">No files in this package.</p>
                      ) : (
                        <ul className="mt-4 space-y-3">
                          {share.files.map((file) => {
                            const key = `${share.id}:${file.updateId}`;
                            const busy = busyKey === key;
                            return (
                              <li
                                key={file.updateId}
                                className="space-y-3 border border-border bg-surface px-3 py-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium">{file.employeeName}</p>
                                    <p className="text-xs text-muted">{file.systemFileName}</p>
                                    {!file.fileAvailable ? (
                                      <p className="mt-1 text-xs text-muted">
                                        {removedLabel(file.fileRemovedReason)}
                                        {file.fileRemovedAt ? ` · ${formatSharedAt(file.fileRemovedAt)}` : ''}
                                        {file.emailRecipient ? ` · ${file.emailRecipient}` : ''}
                                      </p>
                                    ) : null}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {file.late ? <StatusBadge status="rejected" label="Late" /> : null}
                                    {file.fileAvailable ? (
                                      <StatusBadge status="pending" label="In storage" />
                                    ) : (
                                      <StatusBadge
                                        status="approved"
                                        label={removedLabel(file.fileRemovedReason)}
                                      />
                                    )}
                                  </div>
                                </div>
                                {file.fileAvailable ? (
                                  <div className="flex flex-wrap items-end gap-3">
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={busy || downloadState.isLoading}
                                      onClick={() => void onDownload(file.updateId, share.id)}
                                    >
                                      Download
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      disabled={busy || deleteState.isLoading}
                                      onClick={() => void onDelete(file.updateId, share.id)}
                                    >
                                      Delete
                                    </Button>
                                    <div className="min-w-[14rem] flex-1">
                                      <label
                                        className="mb-1 block text-xs text-muted"
                                        htmlFor={`weekly-email-${key}`}
                                      >
                                        Email recipient
                                      </label>
                                      <Input
                                        id={`weekly-email-${key}`}
                                        type="email"
                                        placeholder="name@example.com"
                                        value={emailById[key] ?? ''}
                                        onChange={(event) =>
                                          setEmailById((prev) => ({
                                            ...prev,
                                            [key]: event.target.value,
                                          }))
                                        }
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      disabled={busy || emailState.isLoading}
                                      onClick={() => void onEmail(file.updateId, share.id)}
                                    >
                                      Email PPT
                                    </Button>
                                  </div>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}

export function GmWeeklyUpdatesPage() {
  return (
    <Suspense fallback={<PageLoading compact message="Loading…" />}>
      <GmWeeklyUpdatesInner />
    </Suspense>
  );
}
