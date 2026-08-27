'use client';

import { useMemo, useState } from 'react';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  IMPORTANCE_OPTIONS,
  REGULAR_SUBTYPE_OPTIONS,
  isPendingSubmit,
  isWorkGoal,
  priorityTypeLine,
} from '@/features/work/priority-helpers';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useCreateWorkPriorityMutation,
  useSubmitAllWorkPrioritiesMutation,
  useSubmitWorkPriorityMutation,
  useUpdateWorkPriorityMutation,
} from '@/store/api/api';
import type { WeeklyWorkBoard, WorkPriority, WorkRegularSubtype } from '@/types/api';

const selectClass =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none focus:border-foreground';

const STEPS = [
  { id: 1 as const, label: 'Work' },
  { id: 2 as const, label: 'Skill' },
  { id: 3 as const, label: 'Submit' },
];

type Step = 1 | 2 | 3;

export function MyPrioritiesWizard({ board }: { board: WeeklyWorkBoard }) {
  const toast = useToast();
  const [createPriority, createState] = useCreateWorkPriorityMutation();
  const [updatePriority, updateState] = useUpdateWorkPriorityMutation();
  const [submitAll, submitAllState] = useSubmitAllWorkPrioritiesMutation();
  const [submitOne, submitOneState] = useSubmitWorkPriorityMutation();

  const [step, setStep] = useState<Step>(1);
  const [workKind, setWorkKind] = useState<'PROJECT' | 'REGULAR'>('PROJECT');
  const [projectId, setProjectId] = useState('');
  const [regularSubtype, setRegularSubtype] = useState<WorkRegularSubtype>('TESTING');
  const [regularSubtypeLabel, setRegularSubtypeLabel] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [workLevel, setWorkLevel] = useState<WorkPriority['level']>('MEDIUM');
  const [skillTitle, setSkillTitle] = useState('');
  const [skillLevel, setSkillLevel] = useState<WorkPriority['level']>('MEDIUM');
  const [editTitleById, setEditTitleById] = useState<Record<string, string>>({});
  const [forcePlan, setForcePlan] = useState(false);

  const priorities = board.priorities;
  const workDrafts = useMemo(
    () => priorities.filter((item) => isWorkGoal(item) && isPendingSubmit(item)),
    [priorities],
  );
  const skillDrafts = useMemo(
    () => priorities.filter((item) => item.type === 'SKILL' && isPendingSubmit(item)),
    [priorities],
  );
  const allDrafts = useMemo(() => [...workDrafts, ...skillDrafts], [workDrafts, skillDrafts]);
  const needsResubmit = useMemo(
    () => priorities.filter((item) => item.approvalStatus === 'RESUBMIT_REQUESTED'),
    [priorities],
  );
  const awaiting = useMemo(
    () =>
      priorities.filter(
        (item) =>
          item.status !== 'CANCELLED' &&
          item.status !== 'CARRIED_FORWARD' &&
          item.approvalStatus === 'SUBMITTED',
      ),
    [priorities],
  );
  const approved = useMemo(
    () =>
      priorities.filter(
        (item) =>
          item.status !== 'CANCELLED' &&
          item.status !== 'CARRIED_FORWARD' &&
          item.approvalStatus === 'APPROVED',
      ),
    [priorities],
  );
  const active = priorities.filter(
    (item) => item.status !== 'CANCELLED' && item.status !== 'CARRIED_FORWARD',
  );
  const planningDone =
    active.length > 0 && allDrafts.length === 0 && needsResubmit.length === 0 && !forcePlan;

  async function persistWorkGoal(): Promise<boolean> {
    const title = workTitle.trim();
    if (!title) {
      toast.error('Write what you plan to get done.');
      return false;
    }
    if (workKind === 'PROJECT' && !projectId) {
      toast.error('Pick a project.');
      return false;
    }
    if (workKind === 'REGULAR' && regularSubtype === 'OTHER' && !regularSubtypeLabel.trim()) {
      toast.error('Describe the regular work type.');
      return false;
    }
    try {
      const result = await createPriority({
        type: workKind,
        projectId: workKind === 'PROJECT' ? projectId || null : null,
        regularSubtype: workKind === 'REGULAR' ? regularSubtype : null,
        regularSubtypeLabel:
          workKind === 'REGULAR' && regularSubtype === 'OTHER' ? regularSubtypeLabel.trim() : null,
        title,
        level: workLevel,
      }).unwrap();
      setWorkTitle('');
      setRegularSubtypeLabel('');
      if (result.data.warning) toast.warning(result.data.warning);
      else toast.success('Work goal saved.');
      setForcePlan(false);
      return true;
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not save this work goal.'));
      return false;
    }
  }

  async function persistSkillPlan(): Promise<boolean> {
    const title = skillTitle.trim();
    if (!title) {
      toast.error('Write a short skill plan, or skip this step.');
      return false;
    }
    try {
      const result = await createPriority({
        type: 'SKILL',
        title,
        level: skillLevel,
      }).unwrap();
      setSkillTitle('');
      if (result.data.warning) toast.warning(result.data.warning);
      else toast.success('Skill plan saved.');
      return true;
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not save this skill plan.'));
      return false;
    }
  }

  async function addWorkGoal(event: React.FormEvent) {
    event.preventDefault();
    await persistWorkGoal();
  }

  async function addSkillPlan(event: React.FormEvent) {
    event.preventDefault();
    const saved = await persistSkillPlan();
    if (saved) setStep(3);
  }

  /** Save the in-progress work form (if any), then move to Skill. */
  async function goToSkill() {
    if (workTitle.trim()) {
      const saved = await persistWorkGoal();
      if (!saved) return;
      setStep(2);
      return;
    }
    if (workDrafts.length === 0) {
      toast.error('Add at least one work goal before continuing.');
      return;
    }
    setStep(2);
  }

  /** Save the in-progress skill form (if any), then move to Submit. */
  async function goToSubmit() {
    if (skillTitle.trim()) {
      const saved = await persistSkillPlan();
      if (!saved) return;
    }
    setStep(3);
  }

  async function onSubmitAll() {
    if (workDrafts.length === 0) {
      toast.error('Add at least one work goal before submitting.');
      return;
    }
    try {
      const result = await submitAll().unwrap();
      const count = result.data.submitted.length;
      toast.success(count === 1 ? 'Sent 1 priority to CSO.' : `Sent ${count} priorities to CSO.`);
      setForcePlan(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not submit priorities.'));
    }
  }

  async function onResubmitOne(item: WorkPriority) {
    const nextTitle = (editTitleById[item.id] ?? item.title).trim();
    if (!nextTitle) {
      toast.error('Title cannot be empty.');
      return;
    }
    try {
      if (nextTitle !== item.title) {
        await updatePriority({ id: item.id, body: { title: nextTitle } }).unwrap();
      }
      await submitOne(item.id).unwrap();
      toast.success('Resubmitted to CSO.');
      setEditTitleById((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not resubmit this priority.'));
    }
  }

  return (
    <div className="space-y-8">
      <section className="border border-border bg-background p-5 shadow-card">
        <Meta>This week</Meta>
        <p className="mt-2 text-sm">
          {board.week.start} → {board.week.end}
        </p>
        <p className="mt-2 text-sm text-muted">
          Add work goals first, then an optional skill plan, then submit everything once for CSO approval. A
          reminder goes out Monday at 4:00 pm IST — please submit before end of Monday. If you are on leave
          Monday, submit when you are back. Daily updates unlock after every line is approved.
        </p>
        {board.overCap ? (
          <p className="mt-3 text-sm">You have {active.length} items. Aim for a focused week (about 3–5).</p>
        ) : null}
      </section>

      {needsResubmit.length > 0 ? (
        <section className="space-y-4 border border-border bg-background p-5 shadow-card">
          <Meta>Needs your update</Meta>
          <p className="text-sm text-muted">
            CSO asked for a change on these lines. Edit and resubmit only the lines below — you do not need to
            redo the whole week.
          </p>
          <div className="space-y-4">
            {needsResubmit.map((item) => (
              <article key={item.id} className="border border-border p-4">
                <p className="text-sm text-muted">{priorityTypeLine(item)}</p>
                {item.csoComment ? (
                  <p className="mt-2 rounded border border-border bg-surface px-3 py-2 text-sm">
                    <span className="text-muted">CSO comment: </span>
                    {item.csoComment}
                  </p>
                ) : null}
                <div className="mt-3">
                  <Label htmlFor={`resubmit-title-${item.id}`}>Updated goal</Label>
                  <Input
                    id={`resubmit-title-${item.id}`}
                    className="mt-1"
                    value={editTitleById[item.id] ?? item.title}
                    onChange={(event) =>
                      setEditTitleById((prev) => ({ ...prev, [item.id]: event.target.value }))
                    }
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3"
                  disabled={submitOneState.isLoading || updateState.isLoading}
                  onClick={() => void onResubmitOne(item)}
                >
                  Resubmit this line
                </Button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {planningDone ? (
        <section className="border border-border bg-background p-5 shadow-card">
          <Meta>Status</Meta>
          {awaiting.length > 0 ? (
            <p className="mt-2 text-sm">
              Waiting for CSO on {awaiting.length} {awaiting.length === 1 ? 'line' : 'lines'}. You can edit again
              only if they ask for a resubmit.
            </p>
          ) : null}
          {approved.length > 0 && awaiting.length === 0 ? (
            <p className="mt-2 text-sm">
              All priorities for this week are approved. Use Today&apos;s update to log daily progress.
            </p>
          ) : null}
          <ul className="mt-4 space-y-2">
            {active.map((item) => (
              <li key={item.id} className="border border-border px-4 py-3 text-sm">
                <span className="font-medium">{item.title}</span>
                <span className="mt-1 block text-muted">
                  {priorityTypeLine(item)} ·{' '}
                  {item.approvalStatus === 'SUBMITTED'
                    ? 'Awaiting CSO'
                    : item.approvalStatus === 'APPROVED'
                      ? 'Approved'
                      : item.approvalStatus}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setForcePlan(true);
                setStep(1);
              }}
            >
              Add another goal
            </Button>
          </div>
        </section>
      ) : (
        <>
          <nav aria-label="Priority steps" className="flex flex-wrap items-center gap-2">
            {STEPS.map((row, index) => {
              const activeStep = step === row.id;
              const done = step > row.id;
              return (
                <div key={row.id} className="flex items-center gap-2">
                  {index > 0 ? <span className="text-muted">→</span> : null}
                  <button
                    type="button"
                    className={
                      activeStep
                        ? 'rounded border border-foreground bg-foreground px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-background'
                        : done
                          ? 'rounded border border-border bg-surface px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-foreground'
                          : 'rounded border border-border px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-muted'
                    }
                    onClick={() => {
                      if (row.id === 1) setStep(1);
                      else if (row.id === 2) void goToSkill();
                      else void goToSubmit();
                    }}
                  >
                    {row.id}. {row.label}
                  </button>
                </div>
              );
            })}
          </nav>

          {step === 1 ? (
            <section className="space-y-4 border border-border bg-background p-5 shadow-card">
              <Meta>Step 1 — Work</Meta>
              <p className="text-sm text-muted">
                R&amp;D needs a project. Testing, production, general management, and inventory do not.
              </p>
              <form onSubmit={(event) => void addWorkGoal(event)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="work-kind">Type</Label>
                    <select
                      id="work-kind"
                      className={selectClass}
                      value={workKind}
                      onChange={(event) => setWorkKind(event.target.value as 'PROJECT' | 'REGULAR')}
                    >
                      <option value="PROJECT">Project (R&amp;D)</option>
                      <option value="REGULAR">Regular work</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="work-level">Importance</Label>
                    <select
                      id="work-level"
                      className={selectClass}
                      value={workLevel}
                      onChange={(event) => setWorkLevel(event.target.value as WorkPriority['level'])}
                    >
                      {IMPORTANCE_OPTIONS.map((row) => (
                        <option key={row.value} value={row.value}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {workKind === 'PROJECT' ? (
                  <div>
                    <Label htmlFor="work-project">Project</Label>
                    <select
                      id="work-project"
                      className={selectClass}
                      value={projectId}
                      onChange={(event) => setProjectId(event.target.value)}
                      required
                    >
                      <option value="">Pick a project</option>
                      {board.projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.code} · {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="work-subtype">Regular work type</Label>
                      <select
                        id="work-subtype"
                        className={selectClass}
                        value={regularSubtype}
                        onChange={(event) => setRegularSubtype(event.target.value as WorkRegularSubtype)}
                        required
                      >
                        {REGULAR_SUBTYPE_OPTIONS.map((row) => (
                          <option key={row.value} value={row.value}>
                            {row.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {regularSubtype === 'OTHER' ? (
                      <div>
                        <Label htmlFor="work-subtype-label">Describe it</Label>
                        <Input
                          id="work-subtype-label"
                          value={regularSubtypeLabel}
                          onChange={(event) => setRegularSubtypeLabel(event.target.value)}
                          placeholder="e.g. Lab support"
                          required
                        />
                      </div>
                    ) : null}
                  </div>
                )}
                <div>
                  <Label htmlFor="work-title">What should get done?</Label>
                  <Input
                    id="work-title"
                    value={workTitle}
                    onChange={(event) => setWorkTitle(event.target.value)}
                    placeholder="Short and specific"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={createState.isLoading}>
                    {workDrafts.length ? 'Add another goal' : 'Add work goal'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={createState.isLoading}
                    onClick={() => void goToSkill()}
                  >
                    Next: Skill
                  </Button>
                </div>
              </form>
              {workDrafts.length > 0 ? (
                <ul className="space-y-2 border-t border-border pt-4">
                  {workDrafts.map((item) => (
                    <li key={item.id} className="text-sm">
                      <span className="font-medium">{item.title}</span>
                      <span className="mt-0.5 block text-muted">{priorityTypeLine(item)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          {step === 2 ? (
            <section className="space-y-4 border border-border bg-background p-5 shadow-card">
              <Meta>Step 2 — Skill (optional)</Meta>
              <p className="text-sm text-muted">One skill focus is enough. Skip if you do not need one this week.</p>
              <form onSubmit={(event) => void addSkillPlan(event)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="skill-title">Skill plan</Label>
                    <Input
                      id="skill-title"
                      value={skillTitle}
                      onChange={(event) => setSkillTitle(event.target.value)}
                      placeholder="e.g. Practice API design"
                    />
                  </div>
                  <div>
                    <Label htmlFor="skill-level">Importance</Label>
                    <select
                      id="skill-level"
                      className={selectClass}
                      value={skillLevel}
                      onChange={(event) => setSkillLevel(event.target.value as WorkPriority['level'])}
                    >
                      {IMPORTANCE_OPTIONS.map((row) => (
                        <option key={row.value} value={row.value}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={createState.isLoading || !skillTitle.trim()}>
                    Save skill plan
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={createState.isLoading}
                    onClick={() => void goToSubmit()}
                  >
                    {skillTitle.trim() ? 'Next: Review' : 'Skip'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    Back
                  </Button>
                </div>
              </form>
              {skillDrafts.length > 0 ? (
                <ul className="space-y-2 border-t border-border pt-4">
                  {skillDrafts.map((item) => (
                    <li key={item.id} className="text-sm">
                      <span className="font-medium">{item.title}</span>
                      <span className="mt-0.5 block text-muted">Skill</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          {step === 3 ? (
            <section className="space-y-4 border border-border bg-background p-5 shadow-card">
              <Meta>Step 3 — Review &amp; submit</Meta>
              <p className="text-sm text-muted">
                One submit sends all draft work goals and skill plans to CSO together. You need at least one
                work goal; about 3–5 is a focused week.
              </p>
              {allDrafts.length === 0 ? (
                <p className="text-sm text-muted">No drafts yet. Go back and add at least one work goal.</p>
              ) : (
                <ul className="space-y-2">
                  {allDrafts.map((item) => (
                    <li key={item.id} className="border border-border px-4 py-3 text-sm">
                      <span className="font-medium">{item.title}</span>
                      <span className="mt-1 block text-muted">{priorityTypeLine(item)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {workDrafts.length === 0 ? (
                <p className="text-sm text-muted">You need at least one work goal before you can submit.</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={submitAllState.isLoading || workDrafts.length === 0}
                  onClick={() => void onSubmitAll()}
                >
                  {submitAllState.isLoading ? 'Submitting…' : 'Submit for CSO approval'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                  Back
                </Button>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
