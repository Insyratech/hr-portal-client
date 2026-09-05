'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  formatJcWhen,
  jcStatusLabel,
  jcStatusTone,
} from '@/features/work/jc-helpers';
import type { JcPptItem } from '@/types/api';
import {
  useGetJcPptCsoBoardQuery,
  useLazyGetJcPptPreviewQuery,
  useTransferJcPptToGmMutation,
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
            ? ` · ${item.status === 'emailed' ? 'Emailed' : 'Downloaded'} ${formatJcWhen(item.consumedAt)}`
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

export function CsoJcPage() {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useGetJcPptCsoBoardQuery();
  const [transfer, transferState] = useTransferJcPptToGmMutation();
  const [fetchPreview] = useLazyGetJcPptPreviewQuery();
  const [busyId, setBusyId] = useState<string | null>(null);
  const board = data?.data;

  const onPreview = useCallback(
    async (id: string) => {
      try {
        const result = await fetchPreview(id).unwrap();
        window.open(result.data.url, '_blank', 'noopener,noreferrer');
      } catch (error) {
        toast.error(apiErrorMessage(error, 'Could not open download.'));
      }
    },
    [fetchPreview, toast],
  );

  async function onTransfer(id: string) {
    setBusyId(id);
    try {
      const result = await transfer(id).unwrap();
      toast.success(
        `Transferred to General Manager${result.data.recipients ? ` (${result.data.recipients} notified)` : ''}.`,
      );
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not transfer JC PPT.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader kicker="Work" title="Team JC" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Review employee JC PowerPoints, then transfer each file to General Manager. After GM downloads or emails a
        file, it leaves portal storage — audit history stays here.
      </p>

      {isLoading ? <PageLoading compact message="Loading…" /> : null}
      {isError ? <p className="text-sm">Unable to load Team JC.</p> : null}

      {board ? (
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-border bg-background p-4 shadow-card">
              <Meta>Pending</Meta>
              <p className="mt-2 text-2xl font-medium">{board.counts.pending}</p>
            </div>
            <div className="border border-border bg-background p-4 shadow-card">
              <Meta>With GM</Meta>
              <p className="mt-2 text-2xl font-medium">{board.counts.withGm}</p>
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
            <Meta>Pending with CSO</Meta>
            {board.pending.length === 0 ? (
              <p className="text-sm text-muted">No JC PPTs waiting for transfer.</p>
            ) : (
              <ul className="space-y-3">
                {board.pending.map((item) => (
                  <JcRow
                    key={item.id}
                    item={item}
                    actions={
                      <>
                        <Button type="button" size="sm" variant="ghost" onClick={() => void onPreview(item.id)}>
                          Preview
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={transferState.isLoading && busyId === item.id}
                          onClick={() => void onTransfer(item.id)}
                        >
                          {busyId === item.id ? 'Transferring…' : 'Transfer to GM'}
                        </Button>
                      </>
                    }
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <Meta>With General Manager</Meta>
            {board.withGm.length === 0 ? (
              <p className="text-sm text-muted">Nothing waiting with General Manager.</p>
            ) : (
              <ul className="space-y-3">
                {board.withGm.map((item) => (
                  <JcRow
                    key={item.id}
                    item={item}
                    actions={
                      <Button type="button" size="sm" variant="ghost" onClick={() => void onPreview(item.id)}>
                        Preview
                      </Button>
                    }
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <Meta>Completed / audit</Meta>
            {board.history.length === 0 ? (
              <p className="text-sm text-muted">No completed JC transfers yet.</p>
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
