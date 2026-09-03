'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage, type StatusTone } from '@/components/ui/status-message';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  earliestShiftChangeStartDate,
  latestShiftChangeEndDate,
  shiftChangeBookingHint,
  shiftChangeWindowError,
} from '@/lib/shift-change-window';
import {
  useApplyShiftChangeMutation,
  useGetShiftChangeProjectsQuery,
  useGetShiftsQuery,
} from '@/store/api/api';

export function ApplyShiftChangeForm({ onApplied }: { onApplied?: () => void }) {
  const { data: shifts } = useGetShiftsQuery();
  const { data: projects } = useGetShiftChangeProjectsQuery();
  const [apply, { isLoading }] = useApplyShiftChangeMutation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [requestedShiftId, setRequestedShiftId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [message, setMessage] = useState<{ tone: StatusTone; text: string } | null>(null);
  const toast = useToast();

  const minDate = earliestShiftChangeStartDate();
  const maxDate = latestShiftChangeEndDate();
  const activeShifts = (shifts?.data ?? []).filter((item) => item.active);
  const projectOptions = projects?.data ?? [];
  const needsProject = projectOptions.length > 0;

  useEffect(() => {
    if (!requestedShiftId && activeShifts[0]) {
      setRequestedShiftId(activeShifts[0].id);
    }
  }, [activeShifts, requestedShiftId]);

  useEffect(() => {
    if (!needsProject) {
      setProjectId('');
      return;
    }
    setProjectId((current) => {
      if (current && projectOptions.some((item) => item.id === current)) return current;
      if (projectOptions.length === 1) return projectOptions[0].id;
      return '';
    });
  }, [needsProject, projects?.data]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const start = String(form.get('startDate') ?? startDate);
    const end = String(form.get('endDate') ?? (endDate || start));
    const reason = String(form.get('reason') ?? '').trim();
    const windowError = shiftChangeWindowError(start, end);
    if (windowError) {
      toast.warning(windowError);
      setMessage({ tone: 'warning', text: windowError });
      return;
    }
    if (!requestedShiftId) {
      toast.warning('Select the shift you want for those day(s).');
      return;
    }
    if (!reason) {
      toast.warning('Add a short reason for the shift change.');
      return;
    }
    if (needsProject && !projectId) {
      toast.warning('Select which project this shift change relates to.');
      return;
    }

    try {
      await apply({
        startDate: start,
        endDate: end,
        requestedShiftId,
        reason,
        projectId: needsProject ? projectId : undefined,
      }).unwrap();
      toast.success('Shift change request submitted.');
      event.currentTarget.reset();
      setStartDate('');
      setEndDate('');
      onApplied?.();
    } catch (error) {
      const text = apiErrorMessage(error, 'Unable to submit shift change.');
      toast.error(text);
      setMessage({ tone: 'danger', text });
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-6">
      <p className="text-sm text-muted">{shiftChangeBookingHint()}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            min={minDate}
            max={maxDate}
            value={startDate}
            onChange={(event) => {
              const value = event.target.value;
              setStartDate(value);
              if (!endDate || endDate < value) setEndDate(value);
            }}
          />
        </div>
        <div>
          <Label htmlFor="endDate">End date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            required
            min={startDate || minDate}
            max={maxDate}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
          <p className="mt-1 text-xs text-muted">Same as start for a single day.</p>
        </div>
      </div>
      <div>
        <Label htmlFor="requestedShiftId">Requested shift</Label>
        <select
          id="requestedShiftId"
          name="requestedShiftId"
          className="h-10 w-full rounded border border-border bg-background px-3 text-sm shadow-card outline-none"
          required
          value={requestedShiftId}
          onChange={(event) => setRequestedShiftId(event.target.value)}
        >
          {activeShifts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.startTime}–{item.endTime})
            </option>
          ))}
        </select>
      </div>
      {needsProject ? (
        <div>
          <Label htmlFor="projectId">Project</Label>
          <select
            id="projectId"
            name="projectId"
            className="h-10 w-full rounded border border-border bg-background px-3 text-sm shadow-card outline-none"
            required
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="" disabled>
              Select project
            </option>
            {projectOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.code}) · lead {item.leadName}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-muted">
            Your project lead reviews first when required; then HR decides.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted">No project lead on your projects — this goes straight to HR.</p>
      )}
      <div>
        <Label htmlFor="reason">Reason</Label>
        <Input id="reason" name="reason" required maxLength={500} />
      </div>
      {message ? <StatusMessage tone={message.tone}>{message.text}</StatusMessage> : null}
      <Button type="submit" className="w-full" disabled={isLoading || activeShifts.length === 0}>
        {isLoading ? 'Submitting…' : 'Request shift change'}
      </Button>
    </form>
  );
}
