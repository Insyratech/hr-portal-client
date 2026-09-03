'use client';

import { useState } from 'react';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { WorkDeskSection } from '@/features/work/work-desk-section';
import type { ProjectStatusUpdate, ProjectUpdateTopic } from '@/types/api';

const textareaClass =
  'min-h-[96px] w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground shadow-card outline-none focus:border-foreground';

const selectClass =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none focus:border-foreground';

const TOPIC_OPTIONS: { value: ProjectUpdateTopic; label: string }[] = [
  { value: 'PROGRESS', label: 'Progress' },
  { value: 'RISK', label: 'Risk' },
  { value: 'BLOCKER', label: 'Blocker' },
  { value: 'NEXT_STEPS', label: 'Next steps' },
  { value: 'OTHER', label: 'Other' },
];

const TOPIC_LABEL: Record<ProjectUpdateTopic, string> = {
  PROGRESS: 'Progress',
  RISK: 'Risk',
  BLOCKER: 'Blocker',
  NEXT_STEPS: 'Next steps',
  OTHER: 'Other',
};

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
  dense = false,
}: {
  updates: ProjectStatusUpdate[];
  emptyLabel?: string;
  dense?: boolean;
}) {
  if (updates.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className={dense ? 'space-y-3' : 'space-y-4'}>
      {updates.map((item) => (
        <li
          key={item.id}
          className="rounded border border-border bg-surface/30 px-4 py-3 shadow-card"
        >
          <div className="flex flex-wrap items-center gap-2">
            {item.topic ? (
              <span className="rounded border border-border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted">
                {TOPIC_LABEL[item.topic] ?? item.topic}
              </span>
            ) : null}
            <p className="text-xs text-muted">
              {item.authorName} · {formatPostedAt(item.createdAt)}
            </p>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{item.body}</p>
        </li>
      ))}
    </ul>
  );
}

export function ProjectStatusUpdatesSection({
  updates,
  canPost,
  draft,
  topic,
  onDraftChange,
  onTopicChange,
  onSubmit,
  submitting,
  className,
}: {
  updates: ProjectStatusUpdate[];
  canPost: boolean;
  draft: string;
  topic: ProjectUpdateTopic | '';
  onDraftChange: (value: string) => void;
  onTopicChange: (value: ProjectUpdateTopic | '') => void;
  onSubmit: () => Promise<boolean>;
  submitting: boolean;
  className?: string;
}) {
  const [formOpen, setFormOpen] = useState(false);

  async function handlePost() {
    const posted = await onSubmit();
    if (posted) setFormOpen(false);
  }

  return (
    <>
      <WorkDeskSection
        title="Status updates"
        className={className}
        bodyClassName="max-h-[28rem]"
        description="Project notes stay with the project when the lead changes. Only the current lead can post; CSO can read."
        action={
          canPost ? (
            <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
              Post update
            </Button>
          ) : null
        }
      >
        <div className="space-y-2">
          <Meta>Recent notes · {updates.length}</Meta>
          <ProjectStatusUpdateList
            updates={updates}
            emptyLabel={
              canPost
                ? 'No updates yet — use Post update when you have a note for CSO.'
                : 'No status updates yet.'
            }
          />
        </div>
      </WorkDeskSection>

      {canPost ? (
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
            <DialogTitle>Post update</DialogTitle>
            <DialogDescription>
              Short project note for CSO. Notes stay with the project when the lead changes.
            </DialogDescription>
            <form
              className="mt-4 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handlePost();
              }}
            >
              <div>
                <Label htmlFor="project-status-topic">Topic (optional)</Label>
                <select
                  id="project-status-topic"
                  className={selectClass}
                  value={topic}
                  onChange={(event) => onTopicChange(event.target.value as ProjectUpdateTopic | '')}
                >
                  <option value="">General note</option>
                  {TOPIC_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="project-status-update">Update</Label>
                <textarea
                  id="project-status-update"
                  className={textareaClass}
                  value={draft}
                  maxLength={2000}
                  placeholder="Short note on progress, risks, blockers, or next steps…"
                  onChange={(event) => onDraftChange(event.target.value)}
                  required
                />
                <p className="mt-1 text-xs text-muted">{draft.trim().length}/2000</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !draft.trim()}>
                  {submitting ? 'Posting…' : 'Post update'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
