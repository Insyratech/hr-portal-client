'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLoading } from '@/components/ui/page-loading';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { useGetWorkDayQuery, useSubmitWorkDayMutation } from '@/store/api/api';
import type { WorkDayBoard } from '@/types/api';

const selectClass =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none focus:border-foreground';

const BLOCKERS = [
  { value: 'DEPENDENCY', label: 'Waiting on someone else' },
  { value: 'APPROVAL', label: 'Waiting on approval' },
  { value: 'TECHNICAL', label: 'Technical blocker' },
  { value: 'PRIORITY_CHANGE', label: 'Priorities changed' },
  { value: 'TIME', label: 'Not enough time' },
  { value: 'URGENT_ASSIGNMENT', label: 'Urgent work came in' },
  { value: 'OTHER', label: 'Other' },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function blockerLabel(category: string): string {
  return BLOCKERS.find((row) => row.value === category)?.label ?? category;
}

function DailyUpdateForm({
  board,
  date,
  saving,
  onSubmit,
}: {
  board: WorkDayBoard;
  date: string;
  saving: boolean;
  onSubmit: (payload: {
    planned: { priorityId: string; description: string }[];
    unplanned: { description: string }[];
    blocker: { category: string; description: string } | null;
    tomorrow: string;
  }) => Promise<void>;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [unplanned, setUnplanned] = useState<string[]>(['']);
  const [blockerOn, setBlockerOn] = useState(false);
  const [blockerCategory, setBlockerCategory] = useState('DEPENDENCY');
  const [blockerText, setBlockerText] = useState('');
  const [tomorrow, setTomorrow] = useState('');

  useEffect(() => {
    if (!board.submitted) {
      setChecked({});
      setNotes({});
      setUnplanned(['']);
      setBlockerOn(false);
      setBlockerCategory('DEPENDENCY');
      setBlockerText('');
      setTomorrow('');
      return;
    }
    const nextChecked: Record<string, boolean> = {};
    const nextNotes: Record<string, string> = {};
    const extra: string[] = [];
    for (const entry of board.submitted.entries) {
      if (entry.category === 'UNPLANNED') {
        extra.push(entry.description);
      } else if (entry.priorityId) {
        nextChecked[entry.priorityId] = true;
        nextNotes[entry.priorityId] = entry.description;
      }
    }
    setChecked(nextChecked);
    setNotes(nextNotes);
    setUnplanned(extra.length ? extra : ['']);
    setTomorrow(board.submitted.tomorrow);
    if (board.submitted.blocker) {
      setBlockerOn(true);
      setBlockerCategory(board.submitted.blocker.category);
      setBlockerText(board.submitted.blocker.description);
    } else {
      setBlockerOn(false);
      setBlockerText('');
    }
  }, [board.submitted]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const planned = (board.priorities ?? [])
      .filter((item) => checked[item.id])
      .map((item) => ({ priorityId: item.id, description: (notes[item.id] ?? '').trim() }))
      .filter((item) => item.description);
    const extra = unplanned.map((text) => ({ description: text.trim() })).filter((item) => item.description);
    await onSubmit({
      planned,
      unplanned: extra,
      blocker: blockerOn && blockerText.trim() ? { category: blockerCategory, description: blockerText } : null,
      tomorrow,
    });
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <p className="text-sm text-muted">
        Tick what you worked on and add a short note. One line is enough. Reminders go out at 8:00 pm and 10:00 pm
        IST on working days if today is still missing.
      </p>

      {board.priorities.length === 0 ? (
        <p className="text-sm text-muted">No weekly priorities yet. You can still log unplanned work below.</p>
      ) : (
        <ul className="space-y-3">
          {board.priorities.map((item) => (
            <li key={item.id}>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={Boolean(checked[item.id])}
                  onChange={(event) => setChecked((prev) => ({ ...prev, [item.id]: event.target.checked }))}
                />
                <span>
                  <span className="font-medium">{item.title}</span>
                  {item.projectName ? <span className="text-muted"> · {item.projectName}</span> : null}
                  {item.milestoneName ? <span className="text-muted"> · {item.milestoneName}</span> : null}
                  {item.isAdditional ? <span className="text-muted"> · Added mid-week</span> : null}
                </span>
              </label>
              {checked[item.id] ? (
                <Input
                  className="mt-2"
                  value={notes[item.id] ?? ''}
                  onChange={(event) => setNotes((prev) => ({ ...prev, [item.id]: event.target.value }))}
                  placeholder="What did you do?"
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <Label>Unplanned</Label>
        {unplanned.map((text, index) => (
          <Input
            key={`u-${index}`}
            value={text}
            onChange={(event) =>
              setUnplanned((prev) => prev.map((item, i) => (i === index ? event.target.value : item)))
            }
            placeholder="Something that was not on the weekly plan"
          />
        ))}
        <button
          type="button"
          className="text-sm text-muted hover:text-foreground"
          onClick={() => setUnplanned((prev) => [...prev, ''])}
        >
          + Another unplanned item
        </button>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" checked={blockerOn} onChange={(event) => setBlockerOn(event.target.checked)} />
        Stuck on something
      </label>
      {blockerOn ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className={selectClass}
            value={blockerCategory}
            onChange={(event) => setBlockerCategory(event.target.value)}
          >
            {BLOCKERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <Input
            value={blockerText}
            onChange={(event) => setBlockerText(event.target.value)}
            placeholder="Short blocker note"
          />
        </div>
      ) : null}

      <div>
        <Label htmlFor="tomorrow">Tomorrow (optional)</Label>
        <Input
          id="tomorrow"
          value={tomorrow}
          onChange={(event) => setTomorrow(event.target.value)}
          placeholder="First thing tomorrow"
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : board.submitted ? 'Save changes' : 'Save today’s update'}
      </Button>
      <p className="text-xs text-muted">{date}</p>
    </form>
  );
}

function SubmittedSummary({ board }: { board: NonNullable<WorkDayBoard['submitted']> }) {
  const planned = board.entries.filter((entry) => entry.category !== 'UNPLANNED');
  const unplanned = board.entries.filter((entry) => entry.category === 'UNPLANNED');

  return (
    <div className="mt-4 space-y-3 text-sm">
      {planned.length > 0 ? (
        <ul className="space-y-2">
          {planned.map((entry) => (
            <li key={entry.id} className="border border-border px-3 py-2">
              <span className="font-medium">{entry.description}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">No planned items logged.</p>
      )}
      {unplanned.length > 0 ? (
        <div>
          <Meta>Unplanned</Meta>
          <ul className="mt-2 space-y-1 text-muted">
            {unplanned.map((entry) => (
              <li key={entry.id}>{entry.description}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {board.blocker ? (
        <p className="text-muted">
          Blocker · {blockerLabel(board.blocker.category)}: {board.blocker.description}
        </p>
      ) : null}
      {board.tomorrow.trim() ? <p className="text-muted">Tomorrow · {board.tomorrow}</p> : null}
    </div>
  );
}

export function TodayUpdate() {
  const date = useMemo(() => todayIso(), []);
  const toast = useToast();
  const { data, isLoading } = useGetWorkDayQuery(date);
  const [submitDay, { isLoading: saving }] = useSubmitWorkDayMutation();
  const board = data?.data;
  const [open, setOpen] = useState(false);

  async function onSubmit(body: {
    planned: { priorityId: string; description: string }[];
    unplanned: { description: string }[];
    blocker: { category: string; description: string } | null;
    tomorrow: string;
  }) {
    try {
      await submitDay({ date, body }).unwrap();
      toast.success(board?.submitted ? 'Today’s update was changed.' : 'Today’s update is saved.');
      setOpen(false);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not save today’s update.'));
    }
  }

  if (isLoading) {
    return (
      <section className="border border-border bg-background p-5 shadow-card">
        <PageLoading compact message="Checking today’s update…" />
      </section>
    );
  }

  if (!board) return null;

  if (!board.formOpen) {
    return (
      <section id="today" className="border border-border bg-background p-5 shadow-card">
        <Meta>Today</Meta>
        <p className="mt-2 text-sm">
          {board.approvalBlockReason ?? board.skipReason ?? 'No update needed today.'}
        </p>
        {board.approvalBlockReason ? (
          <p className="mt-3 text-sm text-muted">
            Open{' '}
            <Link className="underline" href="/work/priorities">
              My priorities
            </Link>{' '}
            to submit or check approval status.
          </p>
        ) : null}
      </section>
    );
  }

  const alreadySubmitted = Boolean(board.submitted);

  return (
    <>
      <section id="today" className="border border-border bg-background p-5 shadow-card">
        <Meta>Today · {date}</Meta>
        {alreadySubmitted ? (
          <>
            <p className="mt-2 text-sm font-medium">Today’s update is already submitted</p>
            <p className="mt-2 text-sm text-muted">
              You logged progress for this day. Open the card if you need to change anything. Tomorrow a fresh
              update will appear again.
            </p>
            <SubmittedSummary board={board.submitted!} />
            <div className="mt-5">
              <Button type="button" onClick={() => setOpen(true)}>
                Update already submitted daily work
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm font-medium">Daily work update</p>
            <p className="mt-2 text-sm text-muted">
              Log what you did against this week’s plan. Open the card when you are ready — it only takes a
              minute.
            </p>
            <div className="mt-5">
              <Button type="button" onClick={() => setOpen(true)}>
                Log today’s update
              </Button>
            </div>
          </>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto pr-12" showClose>
          <DialogTitle>
            {alreadySubmitted ? 'Update today’s log' : 'Log today’s update'}
          </DialogTitle>
          <div className="mt-4">
            <DailyUpdateForm board={board} date={date} saving={saving} onSubmit={onSubmit} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
