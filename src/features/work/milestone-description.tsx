'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { MilestoneStatusChip, formatMilestoneDates } from '@/features/work/project-goals-milestones-shared';
import { isRichTextEmpty, richTextPreview, sanitizeRichText } from '@/lib/rich-text';
import { cn } from '@/lib/utils';
import type { ProjectMilestone } from '@/types/api';

export function RichTextHtml({ html, className }: { html: string; className?: string }) {
  const safe = sanitizeRichText(html);
  if (!safe) return null;
  return (
    <div
      className={cn('prose-milestone text-sm text-foreground', className)}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

export function MilestoneDescriptionSnippet({
  milestone,
  className,
}: {
  milestone: Pick<ProjectMilestone, 'id' | 'name' | 'description' | 'status' | 'startDate' | 'targetDate'>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const description = milestone.description?.trim() ?? '';
  if (isRichTextEmpty(description)) return null;

  return (
    <>
      <p className={cn('mt-1 text-sm text-muted', className)}>
        <span>{richTextPreview(description, 100)}</span>{' '}
        <button
          type="button"
          className="font-medium text-foreground underline-offset-2 hover:underline"
          onClick={() => setOpen(true)}
        >
          more
        </button>
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle>{milestone.name}</DialogTitle>
          <DialogDescription>{formatMilestoneDates(milestone)}</DialogDescription>
          <div className="mt-3">
            <MilestoneStatusChip status={milestone.status} />
          </div>
          <div className="mt-4 rounded border border-border bg-surface/40 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-meta">Description</p>
            <RichTextHtml html={description} className="mt-3" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
