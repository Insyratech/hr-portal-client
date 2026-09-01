'use client';

import { useMemo, useState } from 'react';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLoading } from '@/components/ui/page-loading';
import {
  formatMilestoneDates,
  MilestoneStatusChip,
} from '@/features/work/project-goals-milestones-shared';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useActivateProjectMilestoneMutation,
  useCancelProjectMilestoneMutation,
  useCompleteProjectMilestoneMutation,
  useCreateProjectGoalMutation,
  useCreateProjectMilestoneMutation,
  useDeleteProjectGoalMutation,
  useDeleteProjectMilestoneMutation,
  useGetMilestoneHistoryQuery,
  useGetProjectPlanQuery,
  useUpdateProjectGoalMutation,
  useUpdateProjectMilestoneMutation,
} from '@/store/api/api';
import type { ProjectActiveMilestone, ProjectMilestone } from '@/types/api';

function MilestoneHistoryDialog({
  milestone,
  open,
  onOpenChange,
}: {
  milestone: ProjectMilestone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useGetMilestoneHistoryQuery(milestone?.id ?? '', {
    skip: !open || !milestone?.id,
  });
  const items = data?.data.items ?? [];
  const grouped = useMemo(() => {
    const map = new Map<number, typeof items>();
    for (const item of items) {
      const list = map.get(item.version) ?? [];
      list.push(item);
      map.set(item.version, list);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [items]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogTitle>History · {milestone?.name ?? 'Milestone'}</DialogTitle>
        <DialogDescription>Versioned changes with reasons from the project lead.</DialogDescription>
        <div className="mt-6 space-y-4">
          {isLoading ? <PageLoading compact message="Loading history…" /> : null}
          {!isLoading && grouped.length === 0 ? (
            <p className="text-sm text-muted">No changes recorded yet.</p>
          ) : null}
          {grouped.map(([version, rows]) => (
            <article key={version} className="rounded border border-border p-3 text-sm">
              <p className="text-xs uppercase tracking-[0.12em] text-muted">Version {version}</p>
              <p className="mt-1 text-xs text-muted">
                {rows[0]?.changedByName} · {new Date(rows[0]?.changedAt ?? '').toLocaleString()}
              </p>
              <p className="mt-2 text-sm">
                <span className="text-muted">Reason: </span>
                {rows[0]?.changeReason}
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {rows.map((row) => (
                  <li key={row.id}>
                    <span className="font-medium">{row.changedField}</span>:{' '}
                    <span className="text-muted">{row.oldValue ?? '—'}</span> →{' '}
                    <span>{row.newValue ?? '—'}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectActiveMilestoneCard({
  activeMilestone,
  nextUpcoming,
  onActivate,
  activating,
}: {
  activeMilestone: ProjectActiveMilestone | null;
  nextUpcoming: ProjectMilestone | null;
  onActivate: (milestoneId: string) => void;
  activating: boolean;
}) {
  if (activeMilestone) {
    return (
      <section className="rounded border border-border bg-background p-5 shadow-card">
        <Meta>Active milestone</Meta>
        <p className="mt-2 text-lg font-medium text-foreground">{activeMilestone.name}</p>
        <p className="mt-1 text-sm text-muted">
          Goal: {activeMilestone.goalName || '—'}
          {activeMilestone.targetDate ? ` · target ${activeMilestone.targetDate}` : ''}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded border border-dashed border-border bg-background p-5 shadow-card">
      <Meta>No active milestone</Meta>
      <p className="mt-2 text-sm text-muted">
        Employees cannot add R&amp;D priorities until you activate a milestone for this project.
      </p>
      {nextUpcoming ? (
        <Button
          type="button"
          size="sm"
          className="mt-4"
          disabled={activating}
          onClick={() => onActivate(nextUpcoming.id)}
        >
          Activate next: {nextUpcoming.name}
        </Button>
      ) : (
        <p className="mt-3 text-sm text-muted">Add a milestone below, then activate it.</p>
      )}
    </section>
  );
}

export function ProjectGoalsMilestonesManage({ projectId }: { projectId: string }) {
  const toast = useToast();
  const { data, isLoading, refetch } = useGetProjectPlanQuery(projectId);
  const [createGoal, createGoalState] = useCreateProjectGoalMutation();
  const [updateGoal] = useUpdateProjectGoalMutation();
  const [deleteGoal] = useDeleteProjectGoalMutation();
  const [createMilestone, createMilestoneState] = useCreateProjectMilestoneMutation();
  const [updateMilestone, updateMilestoneState] = useUpdateProjectMilestoneMutation();
  const [activateMilestone, activateState] = useActivateProjectMilestoneMutation();
  const [completeMilestone, completeState] = useCompleteProjectMilestoneMutation();
  const [cancelMilestone, cancelState] = useCancelProjectMilestoneMutation();
  const [deleteMilestone] = useDeleteProjectMilestoneMutation();

  const goals = data?.data.goals ?? [];
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalPrimary, setGoalPrimary] = useState(false);
  const [milestoneDialog, setMilestoneDialog] = useState<{ goalId: string } | null>(null);
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [milestoneStart, setMilestoneStart] = useState('');
  const [milestoneTarget, setMilestoneTarget] = useState('');
  const [editMilestone, setEditMilestone] = useState<ProjectMilestone | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editReason, setEditReason] = useState('');
  const [historyMilestone, setHistoryMilestone] = useState<ProjectMilestone | null>(null);
  const [completeTarget, setCompleteTarget] = useState<ProjectMilestone | null>(null);
  const [completeReason, setCompleteReason] = useState('');
  const [cancelTarget, setCancelTarget] = useState<ProjectMilestone | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const allMilestones = useMemo(() => goals.flatMap((goal) => goal.milestones), [goals]);
  const activeMilestone = allMilestones.find((row) => row.status === 'ACTIVE') ?? null;
  const nextUpcoming = allMilestones.find((row) => row.status === 'UPCOMING') ?? null;

  const busy =
    createGoalState.isLoading ||
    createMilestoneState.isLoading ||
    updateMilestoneState.isLoading ||
    activateState.isLoading ||
    completeState.isLoading ||
    cancelState.isLoading;

  function toggleGoal(goalId: string) {
    setExpandedGoals((prev) => ({ ...prev, [goalId]: !prev[goalId] }));
  }

  async function onCreateGoal(event: React.FormEvent) {
    event.preventDefault();
    const name = goalName.trim();
    if (!name) return;
    try {
      await createGoal({
        projectId,
        name,
        description: goalDescription.trim(),
        isPrimary: goalPrimary,
      }).unwrap();
      toast.success('Goal added.');
      setGoalDialogOpen(false);
      setGoalName('');
      setGoalDescription('');
      setGoalPrimary(false);
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not add the goal.'));
    }
  }

  async function onCreateMilestone(event: React.FormEvent) {
    event.preventDefault();
    if (!milestoneDialog) return;
    const name = milestoneName.trim();
    if (!name) return;
    try {
      await createMilestone({
        goalId: milestoneDialog.goalId,
        name,
        description: milestoneDescription.trim(),
        startDate: milestoneStart || null,
        targetDate: milestoneTarget || null,
        status: 'UPCOMING',
      }).unwrap();
      toast.success('Milestone added.');
      setMilestoneDialog(null);
      setMilestoneName('');
      setMilestoneDescription('');
      setMilestoneStart('');
      setMilestoneTarget('');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not add the milestone.'));
    }
  }

  function openEdit(milestone: ProjectMilestone) {
    setEditMilestone(milestone);
    setEditName(milestone.name);
    setEditDescription(milestone.description);
    setEditStart(milestone.startDate ?? '');
    setEditTarget(milestone.targetDate ?? '');
    setEditReason('');
  }

  async function onSaveMilestone(event: React.FormEvent) {
    event.preventDefault();
    if (!editMilestone) return;
    const changeReason = editReason.trim();
    if (!changeReason) {
      toast.error('Add a reason for this change.');
      return;
    }
    try {
      await updateMilestone({
        milestoneId: editMilestone.id,
        body: {
          name: editName.trim(),
          description: editDescription.trim(),
          startDate: editStart || null,
          targetDate: editTarget || null,
          changeReason,
        },
      }).unwrap();
      toast.success('Milestone updated.');
      setEditMilestone(null);
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not update the milestone.'));
    }
  }

  async function onActivate(milestoneId: string) {
    try {
      await activateMilestone({
        milestoneId,
        changeReason: 'Milestone activated for the project.',
      }).unwrap();
      toast.success('Milestone activated.');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not activate the milestone.'));
    }
  }

  async function onConfirmComplete(event: React.FormEvent) {
    event.preventDefault();
    if (!completeTarget) return;
    const changeReason = completeReason.trim();
    if (!changeReason) return;
    try {
      await completeMilestone({ milestoneId: completeTarget.id, changeReason }).unwrap();
      toast.success('Milestone marked complete.');
      setCompleteTarget(null);
      setCompleteReason('');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not complete the milestone.'));
    }
  }

  async function onConfirmCancel(event: React.FormEvent) {
    event.preventDefault();
    if (!cancelTarget) return;
    const changeReason = cancelReason.trim();
    if (!changeReason) return;
    try {
      await cancelMilestone({ milestoneId: cancelTarget.id, changeReason }).unwrap();
      toast.success('Milestone cancelled.');
      setCancelTarget(null);
      setCancelReason('');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not cancel the milestone.'));
    }
  }

  async function onDeleteGoal(goalId: string) {
    if (!window.confirm('Delete this goal and its milestones?')) return;
    try {
      await deleteGoal(goalId).unwrap();
      toast.success('Goal removed.');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete the goal.'));
    }
  }

  async function onDeleteMilestone(milestoneId: string) {
    if (!window.confirm('Delete this milestone?')) return;
    try {
      await deleteMilestone(milestoneId).unwrap();
      toast.success('Milestone removed.');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not delete the milestone.'));
    }
  }

  return (
    <>
      <ProjectActiveMilestoneCard
        activeMilestone={
          activeMilestone
            ? {
                id: activeMilestone.id,
                name: activeMilestone.name,
                goalName: goals.find((g) => g.id === activeMilestone.goalId)?.name ?? '',
                targetDate: activeMilestone.targetDate,
              }
            : null
        }
        nextUpcoming={nextUpcoming}
        onActivate={(id) => void onActivate(id)}
        activating={activateState.isLoading}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Meta>Goals &amp; milestones</Meta>
          <Button type="button" size="sm" variant="outline" onClick={() => setGoalDialogOpen(true)}>
            Add goal
          </Button>
        </div>
        {isLoading ? <PageLoading compact message="Loading plan…" /> : null}
        {!isLoading && goals.length === 0 ? (
          <p className="text-sm text-muted">Start with one goal, then add milestones and activate one.</p>
        ) : null}
        <div className="space-y-2">
          {goals.map((goal) => {
            const open = expandedGoals[goal.id] ?? goal.isPrimary;
            return (
              <article key={goal.id} className="rounded border border-border bg-background shadow-card">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                  onClick={() => toggleGoal(goal.id)}
                >
                  <div>
                    <p className="text-sm font-medium">{goal.name}</p>
                    {goal.isPrimary ? (
                      <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-muted">Primary</p>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted">{open ? '−' : '+'}</span>
                </button>
                {open ? (
                  <div className="space-y-3 border-t border-border px-4 py-3">
                    {goal.description ? <p className="text-sm text-muted">{goal.description}</p> : null}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setMilestoneDialog({ goalId: goal.id })}
                      >
                        Add milestone
                      </Button>
                      {!goal.isPrimary ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() =>
                            void updateGoal({ goalId: goal.id, body: { isPrimary: true } })
                              .unwrap()
                              .then(() => refetch())
                          }
                        >
                          Set as primary
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => void onDeleteGoal(goal.id)}
                      >
                        Delete goal
                      </Button>
                    </div>
                    {goal.milestones.length === 0 ? (
                      <p className="text-sm text-muted">No milestones yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {goal.milestones.map((milestone) => (
                          <li key={milestone.id} className="rounded border border-border px-3 py-2 text-sm">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{milestone.name}</p>
                                <p className="mt-0.5 text-xs text-muted">{formatMilestoneDates(milestone)}</p>
                              </div>
                              <MilestoneStatusChip status={milestone.status} />
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Button type="button" size="sm" variant="outline" onClick={() => openEdit(milestone)}>
                                Edit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setHistoryMilestone(milestone)}
                              >
                                View history
                              </Button>
                              {milestone.status === 'UPCOMING' ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={busy}
                                  onClick={() => void onActivate(milestone.id)}
                                >
                                  Activate
                                </Button>
                              ) : null}
                              {milestone.status === 'ACTIVE' ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={busy}
                                  onClick={() => setCompleteTarget(milestone)}
                                >
                                  Complete
                                </Button>
                              ) : null}
                              {milestone.status === 'UPCOMING' ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={busy}
                                  onClick={() => setCancelTarget(milestone)}
                                >
                                  Cancel
                                </Button>
                              ) : null}
                              {milestone.status !== 'ACTIVE' ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={busy}
                                  onClick={() => void onDeleteMilestone(milestone.id)}
                                >
                                  Delete
                                </Button>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Add goal</DialogTitle>
          <form onSubmit={onCreateGoal} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="new-goal-name">Name</Label>
              <Input id="new-goal-name" value={goalName} onChange={(e) => setGoalName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="new-goal-desc">Description</Label>
              <Input id="new-goal-desc" value={goalDescription} onChange={(e) => setGoalDescription(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={goalPrimary} onChange={(e) => setGoalPrimary(e.target.checked)} />
              Primary goal for this project
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setGoalDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createGoalState.isLoading}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(milestoneDialog)} onOpenChange={(open) => !open && setMilestoneDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle>Add milestone</DialogTitle>
          <form onSubmit={onCreateMilestone} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="new-ms-name">Name</Label>
              <Input id="new-ms-name" value={milestoneName} onChange={(e) => setMilestoneName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="new-ms-desc">Description</Label>
              <Input
                id="new-ms-desc"
                value={milestoneDescription}
                onChange={(e) => setMilestoneDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="new-ms-start">Start date</Label>
                <Input id="new-ms-start" type="date" value={milestoneStart} onChange={(e) => setMilestoneStart(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="new-ms-target">Target date</Label>
                <Input id="new-ms-target" type="date" value={milestoneTarget} onChange={(e) => setMilestoneTarget(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMilestoneDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMilestoneState.isLoading}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editMilestone)} onOpenChange={(open) => !open && setEditMilestone(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle>Edit milestone</DialogTitle>
          <form onSubmit={onSaveMilestone} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="edit-ms-name">Name</Label>
              <Input id="edit-ms-name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="edit-ms-desc">Description</Label>
              <Input id="edit-ms-desc" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-ms-start">Start date</Label>
                <Input id="edit-ms-start" type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="edit-ms-target">Target date</Label>
                <Input id="edit-ms-target" type="date" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-ms-reason">Reason for change</Label>
              <Input
                id="edit-ms-reason"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Required — visible in history"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditMilestone(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMilestoneState.isLoading}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(completeTarget)} onOpenChange={(open) => !open && setCompleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle>Complete milestone</DialogTitle>
          <form onSubmit={onConfirmComplete} className="mt-4 space-y-4">
            <p className="text-sm text-muted">{completeTarget?.name}</p>
            <div>
              <Label htmlFor="complete-reason">Reason</Label>
              <Input
                id="complete-reason"
                value={completeReason}
                onChange={(e) => setCompleteReason(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCompleteTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={completeState.isLoading}>
                Mark complete
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogTitle>Cancel milestone</DialogTitle>
          <form onSubmit={onConfirmCancel} className="mt-4 space-y-4">
            <p className="text-sm text-muted">{cancelTarget?.name}</p>
            <div>
              <Label htmlFor="cancel-reason">Reason</Label>
              <Input id="cancel-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCancelTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={cancelState.isLoading}>
                Confirm cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MilestoneHistoryDialog
        milestone={historyMilestone}
        open={Boolean(historyMilestone)}
        onOpenChange={(open) => !open && setHistoryMilestone(null)}
      />
    </>
  );
}
