'use client';

import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { ProjectStatusUpdate } from '@/types/api';

const textareaClass =
  'min-h-[96px] w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground shadow-card outline-none focus:border-foreground';

function formatPostedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function ProjectStatusUpdateList({
  updates,
  emptyLabel = 'No status updates yet.',
}: {
  updates: ProjectStatusUpdate[];
  emptyLabel?: string;
}) {
  if (updates.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {updates.map((item) => (
        <li key={item.id} className="rounded border border-border bg-background px-4 py-3 shadow-card">
          <p className="text-sm whitespace-pre-wrap">{item.body}</p>
          <p className="mt-2 text-xs text-muted">
            {item.authorName} · {formatPostedAt(item.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ProjectStatusUpdatesSection({
  updates,
  canPost,
  draft,
  onDraftChange,
  onSubmit,
  submitting,
}: {
  updates: ProjectStatusUpdate[];
  canPost: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <section className="space-y-3">
      <Meta>Status updates</Meta>
      <p className="text-sm text-muted">
        Project notes stay here when the lead changes. Only the current lead can post; CSO can read.
      </p>
      {canPost ? (
        <div className="space-y-3 rounded border border-border bg-background p-4 shadow-card">
          <div>
            <Label htmlFor="project-status-update">New update</Label>
            <textarea
              id="project-status-update"
              className={textareaClass}
              value={draft}
              maxLength={2000}
              placeholder="Short note on progress, risks, or next steps…"
              onChange={(event) => onDraftChange(event.target.value)}
            />
            <p className="mt-1 text-xs text-muted">{draft.trim().length}/2000</p>
          </div>
          <div className="flex justify-end">
            <Button type="button" disabled={submitting || !draft.trim()} onClick={onSubmit}>
              {submitting ? 'Posting…' : 'Post update'}
            </Button>
          </div>
        </div>
      ) : null}
      <ProjectStatusUpdateList
        updates={updates}
        emptyLabel={canPost ? 'No updates yet — post the first note for this project.' : 'No status updates yet.'}
      />
    </section>
  );
}
