'use client';

import { PageLoading } from '@/components/ui/page-loading';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { StatusBadge } from '@/components/dashboard/status-badge';
import {
  formatJcWhen,
  jcStatusLabel,
  jcStatusTone,
} from '@/features/work/jc-helpers';
import { PptConcernsReviewDesk } from '@/features/work/ppt-concerns-panel';
import type { JcPptItem } from '@/types/api';
import { useGetJcPptCsoBoardQuery } from '@/store/api/api';

function JcTrackRow({ item }: { item: JcPptItem }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border border-border bg-background px-4 py-3 shadow-card">
      <div>
        <p className="text-sm font-medium">{item.employeeName ?? 'Employee'}</p>
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
          {item.systemFileName}
          {item.weekStart && item.weekEnd ? ` · ${item.weekStart} → ${item.weekEnd}` : ''}
          {item.late ? ' · late' : ''} · Uploaded {formatJcWhen(item.uploadedAt)}
          {item.transferredAt ? ` · Sent to GM ${formatJcWhen(item.transferredAt)}` : ''}
          {item.consumedAt
            ? ` · ${item.status === 'emailed' ? 'Emailed' : item.status === 'deleted' ? 'Deleted' : 'Downloaded'} ${formatJcWhen(item.consumedAt)}`
            : ''}
          {item.consumedByName ? ` · ${item.consumedByName}` : ''}
          {item.emailRecipient ? ` · ${item.emailRecipient}` : ''}
        </p>
      </div>
      <StatusBadge status={jcStatusTone(item.status)} label={jcStatusLabel(item.status)} />
    </li>
  );
}

export function CsoJcPage() {
  const { data, isLoading, isError } = useGetJcPptCsoBoardQuery();
  const board = data?.data;

  return (
    <>
      <PageHeader kicker="Work" title="Team JC" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Track employee JC PowerPoints (paper name + DOI). Uploads go directly to General Manager — this desk shows
        status, history, and the audit log. Same Sat 2:00 pm–Sun 11:59 pm IST window as weekly PPT. Review late-upload
        concerns below for one-time reopens.
      </p>

      <div className="mb-8">
        <PptConcernsReviewDesk kindFilter="jc" />
      </div>

      {isLoading ? <PageLoading compact message="Loading…" /> : null}
      {isError ? <p className="text-sm">Unable to load Team JC.</p> : null}

      {board ? (
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-3">
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
            <Meta>With General Manager</Meta>
            {board.withGm.length === 0 ? (
              <p className="text-sm text-muted">Nothing waiting with General Manager.</p>
            ) : (
              <ul className="space-y-3">
                {board.withGm.map((item) => (
                  <JcTrackRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <Meta>Completed / history</Meta>
            {board.history.length === 0 ? (
              <p className="text-sm text-muted">No completed JC files yet.</p>
            ) : (
              <ul className="space-y-3">
                {board.history.map((item) => (
                  <JcTrackRow key={item.id} item={item} />
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
