'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage, type StatusTone } from '@/components/ui/status-message';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useApplyLeaveMutation,
  useGetLeaveBalancesQuery,
  useGetLeaveColleaguesQuery,
  useGetLeavePoliciesQuery,
  useGetLeaveProjectsQuery,
  useGetLeaveTypesQuery,
  useGetMeQuery,
  useUpdateLeaveMutation,
} from '@/store/api/api';
import type { LeaveApplication } from '@/types/api';

function dateValue(value: string): string {
  return value.slice(0, 10);
}

export function ApplyLeaveForm({
  editing,
  onCancelEdit,
  onApplied,
  variant = 'page',
}: {
  editing?: LeaveApplication | null;
  onCancelEdit?: () => void;
  onApplied?: () => void;
  variant?: 'page' | 'dialog';
}) {
  const { data: types } = useGetLeaveTypesQuery();
  const { data: balances } = useGetLeaveBalancesQuery();
  const { data: policies } = useGetLeavePoliciesQuery();
  const { data: leaveProjects } = useGetLeaveProjectsQuery();
  const { data: me } = useGetMeQuery();
  const meEmployeeId = me?.data.employeeId;
  const [applyLeave, { isLoading: applying }] = useApplyLeaveMutation();
  const [updateLeave, { isLoading: saving }] = useUpdateLeaveMutation();
  const [leaveTypeId, setLeaveTypeId] = useState(editing?.leaveTypeId ?? '');
  const [duration, setDuration] = useState<'full' | 'half'>(editing?.duration ?? 'full');
  const [startDate, setStartDate] = useState(editing ? dateValue(editing.startDate) : '');
  const [endDate, setEndDate] = useState(editing ? dateValue(editing.endDate) : '');
  const [handoverEmployeeId, setHandoverEmployeeId] = useState(editing?.handoverEmployeeId ?? '');
  const [projectId, setProjectId] = useState(editing?.projectId ?? '');
  const [message, setMessage] = useState<{ tone: StatusTone; text: string } | null>(null);
  const toast = useToast();
  const isLoading = applying || saving;
  const rangeEnd = duration === 'half' ? startDate : endDate || startDate;
  const { data: colleagues } = useGetLeaveColleaguesQuery(startDate ? { startDate, endDate: rangeEnd } : undefined);

  useEffect(() => {
    if (!editing) return;
    setLeaveTypeId(editing.leaveTypeId);
    setDuration(editing.duration);
    setStartDate(dateValue(editing.startDate));
    setEndDate(dateValue(editing.endDate));
    setHandoverEmployeeId(editing.handoverEmployeeId ?? '');
    setProjectId(editing.projectId ?? '');
  }, [editing]);

  useEffect(() => {
    const selected = (colleagues?.data ?? []).find((item) => item.id === handoverEmployeeId);
    if (selected && !selected.available) {
      setHandoverEmployeeId('');
    }
  }, [colleagues, handoverEmployeeId]);

  const allocatedTypeIds = new Set((balances?.data ?? []).map((item) => item.leaveTypeId));
  const activeTypes = (types?.data ?? []).filter(
    (item) => item.active && (allocatedTypeIds.has(item.id) || item.id === editing?.leaveTypeId),
  );

  useEffect(() => {
    if (!leaveTypeId && activeTypes[0]) {
      setLeaveTypeId(activeTypes[0].id);
    }
  }, [activeTypes, leaveTypeId]);

  const selectedType = activeTypes.find((item) => item.id === leaveTypeId) ?? activeTypes[0];
  const selectedPolicy = useMemo(
    () => (policies?.data ?? []).find((item) => item.leaveTypeId === selectedType?.id),
    [policies?.data, selectedType?.id],
  );
  const rules = selectedPolicy?.activeVersion?.rules;
  const ruleLine = rules
    ? [
        rules.noticePeriod.value > 0
          ? `${rules.noticePeriod.value}${rules.noticePeriod.unit === 'hours' ? 'h' : 'd'} notice required`
          : null,
        (selectedType?.requiresHandover || rules.requiresHandover) && 'Handover required',
        (selectedType?.requiresApproval || rules.requiresApproval) && 'Approval required',
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Select a leave type';

  const needsHandover = Boolean(selectedType?.requiresHandover || rules?.requiresHandover);
  const needsAttachment = Boolean(selectedType?.requiresAttachment || rules?.requiresAttachment);
  const needsApproval = Boolean(selectedType?.requiresApproval || rules?.requiresApproval);
  const projectOptions = leaveProjects?.data ?? [];
  const projectsLoaded = leaveProjects !== undefined;
  const needsProject = needsApproval && projectsLoaded && projectOptions.length > 0;

  useEffect(() => {
    if (!projectsLoaded) return;
    if (!needsProject) {
      setProjectId((current) => (current ? '' : current));
      return;
    }
    setProjectId((current) => {
      if (current && projectOptions.some((item) => item.id === current)) return current;
      if (projectOptions.length === 1) return projectOptions[0].id;
      return '';
    });
  }, [needsProject, projectsLoaded, leaveProjects?.data]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const start = String(form.get('startDate') ?? startDate);
    const end = duration === 'half' ? start : String(form.get('endDate') ?? (endDate || start));
    const body = {
      leaveTypeId: selectedType?.id ?? '',
      startDate: start,
      endDate: end,
      duration,
      reason: String(form.get('reason') ?? '') || undefined,
      handoverEmployeeId: needsHandover ? handoverEmployeeId || undefined : undefined,
      handover: needsHandover
        ? (colleagues?.data ?? []).find((item) => item.id === handoverEmployeeId)?.fullName
        : undefined,
      attachmentUrl: String(form.get('attachmentUrl') ?? '') || undefined,
      projectId: needsProject ? projectId || undefined : undefined,
    };
    if (!selectedType?.id) {
      toast.warning('Select a leave type first.');
      return;
    }
    if (needsProject && !projectId) {
      toast.warning('Select which project this leave relates to.');
      return;
    }
    if (needsHandover) {
      const colleague = (colleagues?.data ?? []).find((item) => item.id === handoverEmployeeId);
      if (!colleague) {
        toast.warning('Select a colleague to take handover.');
        return;
      }
      if (!colleague.available) {
        toast.warning('That colleague is on leave then. Choose someone who is at work.');
        return;
      }
    }
    try {
      if (editing) {
        await updateLeave({ id: editing.id, body }).unwrap();
        toast.success('Leave request updated.');
        onCancelEdit?.();
        onApplied?.();
      } else {
        await applyLeave(body).unwrap();
        toast.success('Leave request submitted.');
        formEl.reset();
        onApplied?.();
      }
    } catch (error) {
      const text = apiErrorMessage(error, editing ? 'Unable to update leave.' : 'Unable to apply for leave.');
      toast.error(text);
      setMessage({ tone: 'danger', text });
    }
  }

  return (
    <form
      key={editing?.id ?? 'new'}
      onSubmit={onSubmit}
      className={
        variant === 'dialog' ? 'space-y-6' : 'max-w-md space-y-6 border border-border bg-background p-6 shadow-card'
      }
    >
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{editing ? 'Edit leave' : ruleLine}</p>
      {activeTypes.length === 0 ? (
        <StatusMessage tone="warning">No leave types are allocated to you. Ask HR to add an entitlement first.</StatusMessage>
      ) : null}
      <div>
        <Label htmlFor="leaveType">Leave type</Label>
        <select
          id="leaveType"
          name="leaveType"
          className="h-10 w-full rounded border border-border bg-background px-3 text-sm shadow-card outline-none"
          value={selectedType?.id ?? ''}
          onChange={(event) => setLeaveTypeId(event.target.value)}
          disabled={activeTypes.length === 0}
        >
          {activeTypes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {selectedType?.description ? (
          <p className="mt-2 text-sm text-muted">{selectedType.description}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="startDate">Start date</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          required
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
      </div>
      {duration === 'full' ? (
        <div>
          <Label htmlFor="endDate">End date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            required
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
      ) : null}
      <div>
        <Label htmlFor="duration">Duration</Label>
        <select
          id="duration"
          name="duration"
          className="h-10 w-full rounded border border-border bg-background px-3 text-sm shadow-card outline-none"
          value={duration}
          onChange={(event) => setDuration(event.target.value as 'full' | 'half')}
        >
          <option value="full">Full day</option>
          {(selectedType?.allowHalfDay && rules?.allowHalfDay !== false) || !selectedType ? (
            <option value="half">Half day</option>
          ) : null}
        </select>
      </div>
      <div>
        <Label htmlFor="reason">Reason</Label>
        <Input id="reason" name="reason" defaultValue={editing?.reason ?? ''} />
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
              Select project for this leave
            </option>
            {projectOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.code}) · lead {item.leadName}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-muted">
            Your project lead reviews this leave before HR. Pick the project the leave relates to.
          </p>
          {projectId &&
          projectOptions.find((item) => item.id === projectId)?.leadEmployeeId &&
          meEmployeeId &&
          projectOptions.find((item) => item.id === projectId)?.leadEmployeeId === meEmployeeId ? (
            <p className="mt-2 text-sm text-muted">
              You lead this project — the project-lead step is skipped automatically. Handover (if required) and HR
              still apply.
            </p>
          ) : null}
        </div>
      ) : null}
      {needsHandover ? (
        <div>
          <Label htmlFor="handoverEmployeeId">Handover colleague</Label>
          <select
            id="handoverEmployeeId"
            name="handoverEmployeeId"
            className="h-10 w-full rounded border border-border bg-background px-3 text-sm shadow-card outline-none"
            required
            value={handoverEmployeeId}
            onChange={(event) => setHandoverEmployeeId(event.target.value)}
          >
            <option value="" disabled>
              {startDate ? 'Select colleague at work' : 'Pick leave dates first'}
            </option>
            {(colleagues?.data ?? []).map((item) => (
              <option key={item.id} value={item.id} disabled={!item.available}>
                {item.available
                  ? item.fullName
                  : `${item.fullName} · on leave ${item.leaveDates ?? ''}`}
              </option>
            ))}
          </select>
          {startDate ? (
            <p className="mt-2 text-sm text-muted">Colleagues on leave for these dates cannot take handover.</p>
          ) : null}
          {needsProject &&
          projectId &&
          handoverEmployeeId &&
          projectOptions.find((item) => item.id === projectId)?.leadEmployeeId === handoverEmployeeId ? (
            <p className="mt-2 text-sm text-muted">
              This colleague is also the project lead — accepting handover completes both steps.
            </p>
          ) : null}
        </div>
      ) : null}
      {needsAttachment ? (
        <div>
          <Label htmlFor="attachmentUrl">Attachment URL</Label>
          <Input id="attachmentUrl" name="attachmentUrl" required defaultValue={editing?.attachmentUrl ?? ''} />
        </div>
      ) : null}
      {message ? <StatusMessage tone={message.tone}>{message.text}</StatusMessage> : null}
      <div className="flex gap-3">
        <Button type="submit" className="flex-1" disabled={isLoading || !selectedType}>
          {isLoading ? 'Saving' : editing ? 'Save changes' : 'Apply leave'}
        </Button>
        {editing ? (
          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
