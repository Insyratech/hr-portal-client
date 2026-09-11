'use client';

import { useState, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { WorkProjectMember } from '@/types/api';

export type ProjectMembersCardProject = {
  name: string;
  code?: string;
  leadEmployeeId?: string | null;
  leadName?: string | null;
  members: readonly WorkProjectMember[];
  memberCount?: number;
};

/** Sorted roster with the lead first, then everyone else alphabetically. */
export function orderedProjectMembers(
  members: readonly WorkProjectMember[],
  leadEmployeeId?: string | null,
): WorkProjectMember[] {
  const leadId = leadEmployeeId ?? null;
  return [...members].sort((a, b) => {
    const aLead = leadId !== null && a.employeeId === leadId;
    const bLead = leadId !== null && b.employeeId === leadId;
    if (aLead !== bLead) return aLead ? -1 : 1;
    return a.fullName.localeCompare(b.fullName);
  });
}

export function ProjectMembersList({
  members,
  leadEmployeeId,
  leadName,
  emptyLabel = 'No members assigned yet.',
  compact = false,
}: {
  members: readonly WorkProjectMember[];
  leadEmployeeId?: string | null;
  leadName?: string | null;
  emptyLabel?: string;
  /** Skip the lead summary heading — use inside a section that already titles the roster. */
  compact?: boolean;
}) {
  const leadId = leadEmployeeId ?? null;
  const ordered = orderedProjectMembers(members, leadId);

  const roster =
    ordered.length === 0 ? (
      <p className={compact ? 'text-sm text-muted' : 'mt-2 text-sm text-muted'}>{emptyLabel}</p>
    ) : (
      <ul
        className={
          compact
            ? 'divide-y divide-border text-sm'
            : 'mt-2 max-h-72 space-y-1 overflow-y-auto rounded border border-border bg-background p-3 shadow-card'
        }
      >
        {ordered.map((member) => (
          <li
            key={member.employeeId}
            className={
              compact
                ? 'flex justify-between gap-3 py-2.5 text-foreground'
                : 'flex items-center justify-between gap-3 text-sm text-foreground'
            }
          >
            <span>{member.fullName}</span>
            {leadId && member.employeeId === leadId ? (
              <span className="shrink-0 text-xs uppercase tracking-[0.12em] text-muted">Lead</span>
            ) : null}
          </li>
        ))}
      </ul>
    );

  if (compact) {
    return roster;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-muted">Project lead</p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {leadName?.trim() ||
            (leadId ? ordered.find((member) => member.employeeId === leadId)?.fullName : null) ||
            'Not assigned'}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-muted">Members · {members.length}</p>
        {roster}
      </div>
    </div>
  );
}

export function ProjectMembersDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectMembersCardProject | null;
}) {
  const count = project?.memberCount ?? project?.members.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {project ? (
          <>
            <DialogTitle>Project members</DialogTitle>
            <p className="mt-4 text-base font-medium text-foreground">{project.name}</p>
            <DialogDescription>
              {project.code
                ? `${project.code} · ${count} member${count === 1 ? '' : 's'}`
                : `${count} member${count === 1 ? '' : 's'}`}
            </DialogDescription>
            <div className="mt-5">
              <ProjectMembersList
                members={project.members}
                leadEmployeeId={project.leadEmployeeId}
                leadName={project.leadName}
              />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Clickable member count that opens the shared members card. */
export function ProjectMembersCountButton({
  project,
  className,
  children,
}: {
  project: ProjectMembersCardProject;
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const count = project.memberCount ?? project.members.length;

  return (
    <>
      <button
        type="button"
        className={cn(
          'text-left text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
        onClick={() => setOpen(true)}
        aria-label={`View ${count} member${count === 1 ? '' : 's'} of ${project.name}`}
      >
        {children ?? count}
      </button>
      <ProjectMembersDialog open={open} onOpenChange={setOpen} project={project} />
    </>
  );
}
