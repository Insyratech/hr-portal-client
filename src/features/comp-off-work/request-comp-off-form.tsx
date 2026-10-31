'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { useApplyCompOffWorkMutation, useGetCompOffProjectsQuery } from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RequestCompOffForm({ onApplied }: { onApplied?: () => void }) {
  const canApply = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.COMP_OFF_APPLY),
  );
  const [workDate, setWorkDate] = useState(todayIso);
  const { data: projectsData } = useGetCompOffProjectsQuery(undefined, { skip: !canApply });
  const [apply, { isLoading }] = useApplyCompOffWorkMutation();
  const toast = useToast();
  const projects = projectsData?.data ?? [];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const projectId = String(form.get('projectId') ?? '').trim();
    try {
      await apply({
        workDate,
        projectId: projectId || undefined,
        reason: String(form.get('reason') ?? '').trim() || undefined,
      }).unwrap();
      toast.success('Compensatory work requested. Waiting for project lead and HR approval.');
      onApplied?.();
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to request compensatory work.'));
    }
  }

  if (!canApply) {
    return null;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-muted">
        Request permission to work on a holiday or week-off. After the project lead and HR approve, and the work is
        confirmed, one COMP leave day is credited. Use Apply leave to take COMP, or adjust a leave day already taken
        this month.
      </p>
      <div>
        <Label htmlFor="compOffWorkDate">Work date (week-off / holiday)</Label>
        <Input
          id="compOffWorkDate"
          type="date"
          required
          value={workDate}
          onChange={(event) => setWorkDate(event.target.value)}
        />
      </div>
      {projects.length > 0 ? (
        <div>
          <Label htmlFor="compOffProject">Project</Label>
          <select
            id="compOffProject"
            name="projectId"
            required
            className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
                {project.leadName ? ` · lead ${project.leadName}` : ''}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <Label htmlFor="compOffReason">Reason (optional)</Label>
        <Input id="compOffReason" name="reason" />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending…' : 'Request compensatory work'}
      </Button>
    </form>
  );
}
