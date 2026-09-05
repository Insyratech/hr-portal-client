'use client';

import { useState, type ReactNode } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  downloadBase64File,
  formatJcWhen,
  jcStatusLabel,
  jcStatusTone,
} from '@/features/work/jc-helpers';
import type { JcPptItem } from '@/types/api';
import {
  useGetJcPptGmBoardQuery,
  useGmDeleteAllJcPptsMutation,
  useGmDeleteJcPptMutation,
  useGmDownloadJcPptMutation,
  useGmEmailJcPptMutation,
} from '@/store/api/api';

function JcRow({
  item,
  actions,
}: {
  item: JcPptItem;
  actions?: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border border-border bg-background px-4 py-3 shadow-card">
      <div>
        <p className="text-sm font-medium">{item.employeeName ?? 'Employee'}</p>
        <p className="mt-1 text-xs text-muted">
          {item.systemFileName} · Uploaded {formatJcWhen(item.uploadedAt)}
          {item.transferredAt ? ` · Transferred ${formatJcWhen(item.transferredAt)}` : ''}
          {item.consumedAt
            ? ` · ${
                item.status === 'emailed'
                  ? 'Emailed'
                  : item.status === 'deleted'
                    ? 'Deleted'
                    : 'Downloaded'
              } ${formatJcWhen(item.consumedAt)}`
            : ''}
          {item.emailRecipient ? ` · ${item.emailRecipient}` : ''}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={jcStatusTone(item.status)} label={jcStatusLabel(item.status)} />
        {actions}
      </div>
    </li>
  );
}

export function GmJcPage() {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useGetJcPptGmBoardQuery();
  const [downloadJc, downloadState] = useGmDownloadJcPptMutation();
  const [emailJc, emailState] = useGmEmailJcPptMutation();
  const [deleteJc, deleteState] = useGmDeleteJcPptMutation();
  const [deleteAll, deleteAllState] = useGmDeleteAllJcPptsMutation();
  const [emailById, setEmailById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const board = data?.data;

  async function onDownload(id: string) {
    setBusyId(id);
    try {
      const result = await downloadJc(id).unwrap();
      const payload = result.data.download;
      if (payload) {
        downloadBase64File(payload.fileName, payload.contentType, payload.contentBase64);
      }
      toast.success('Downloaded. File removed from portal storage.');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not download JC PPT.'));
    } finally {
      setBusyId(null);
    }
  }

  async function onDownloadAll() {
    if (!board?.inbox.length) return;
    try {
      for (const item of board.inbox) {
        const result = await downloadJc(item.id).unwrap();
        const payload = result.data.download;
        if (payload) {
          downloadBase64File(payload.fileName, payload.contentType, payload.contentBase64);
        }
      }
      toast.success('Downloaded all available JC PPTs. Files removed from portal storage.');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not download all JC PPTs.'));
      await refetch();
    }
  }

  async function onEmail(id: string) {
    const recipientEmail = (emailById[id] ?? '').trim();
    if (!recipientEmail.includes('@')) {
      toast.error('Enter a valid recipient email address.');
      return;
    }
    setBusyId(id);
    try {
      await emailJc({ id, recipientEmail }).unwrap();
      toast.success(`Emailed to ${recipientEmail}. File removed from portal storage.`);
      setEmailById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not email JC PPT.'));
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Delete this JC PPT from portal storage? Audit history will remain.')) return;
    setBusyId(id);
    try {
      await deleteJc(id).unwrap();
      toast.success('Deleted from portal storage. Audit history kept.');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete JC PPT.'));
    } finally {
      setBusyId(null);
    }
  }

  async function onDeleteAll() {
    if (!board?.inbox.length) return;
    if (
      !window.confirm(
        `Delete all ${board.inbox.length} JC PPT(s) from portal storage? Audit history will remain.`,
      )
    ) {
      return;
    }
    try {
      const result = await deleteAll().unwrap();
      toast.success(`Deleted ${result.data.removed} file(s). Audit history kept.`);
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete JC PPTs.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Work" title="Team JC" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        JC PowerPoints transferred by CSO (max 15 MB each). Download, email, or delete — each removes the file from
        portal storage and keeps an audit row here.
      </p>

      {isLoading ? <PageLoading compact message="Loading…" /> : null}
      {isError ? <p className="text-sm">Unable to load Team JC.</p> : null}

      {board ? (
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="border border-border bg-background p-4 shadow-card">
              <Meta>Inbox</Meta>
              <p className="mt-2 text-2xl font-medium">{board.counts.inbox}</p>
            </div>
            <div className="border border-border bg-background p-4 shadow-card">
              <Meta>Completed</Meta>
              <p className="mt-2 text-2xl font-medium">{board.counts.completed}</p>
            </div>
            <div className="border border-border bg-background p-4 shadow-card">
              <Meta>Total</Meta>
              <p className="mt-2 text-2xl font-medium">{board.counts.total}</p>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Meta>Inbox</Meta>
              {board.inbox.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={downloadState.isLoading}
                    onClick={() => void onDownloadAll()}
                  >
                    Download all
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={deleteAllState.isLoading}
                    onClick={() => void onDeleteAll()}
                  >
                    {deleteAllState.isLoading ? 'Deleting…' : 'Delete all'}
                  </Button>
                </div>
              ) : null}
            </div>
            {board.inbox.length === 0 ? (
              <p className="text-sm text-muted">No JC PPTs waiting.</p>
            ) : (
              <ul className="space-y-3">
                {board.inbox.map((item) => {
                  const busy = busyId === item.id;
                  return (
                    <li key={item.id} className="space-y-3 border border-border bg-background px-4 py-3 shadow-card">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{item.employeeName ?? 'Employee'}</p>
                          <p className="mt-1 text-xs text-muted">
                            {item.systemFileName} · Transferred{' '}
                            {item.transferredAt ? formatJcWhen(item.transferredAt) : '—'}
                            {item.transferredByName ? ` by ${item.transferredByName}` : ''}
                          </p>
                        </div>
                        <StatusBadge status={jcStatusTone(item.status)} label={jcStatusLabel(item.status)} />
                      </div>
                      <div className="flex flex-wrap items-end gap-3">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy || downloadState.isLoading}
                          onClick={() => void onDownload(item.id)}
                        >
                          {busy && downloadState.isLoading ? 'Downloading…' : 'Download'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy || deleteState.isLoading}
                          onClick={() => void onDelete(item.id)}
                        >
                          Delete
                        </Button>
                        <div className="min-w-[14rem] flex-1">
                          <label className="mb-1 block text-xs text-muted" htmlFor={`jc-email-${item.id}`}>
                            Email recipient
                          </label>
                          <Input
                            id={`jc-email-${item.id}`}
                            type="email"
                            placeholder="name@example.com"
                            value={emailById[item.id] ?? ''}
                            onChange={(event) =>
                              setEmailById((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy || emailState.isLoading}
                          onClick={() => void onEmail(item.id)}
                        >
                          {busy && emailState.isLoading ? 'Sending…' : 'Email PPT'}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <Meta>Completed / audit</Meta>
            {board.history.length === 0 ? (
              <p className="text-sm text-muted">No completed JC files yet.</p>
            ) : (
              <ul className="space-y-3">
                {board.history.map((item) => (
                  <JcRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </section>

          {board.events.length > 0 ? (
            <section className="space-y-3">
              <Meta>Audit log</Meta>
              <ul className="space-y-2">
                {board.events.slice(0, 60).map((event) => (
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
