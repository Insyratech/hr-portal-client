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
  useGetLeaveTypesQuery,
  useUpdateLeaveMutation,
} from '@/store/api/api';
import type { LeaveApplication } from '@/types/api';

function dateValue(value: string): string {
  return value.slice(0, 10);
}

export function ApplyLeaveForm({
  editing,
  onCancelEdit,
}: {
  editing?: LeaveApplication | null;
  onCancelEdit?: () => void;
}) {
  const { data: types } = useGetLeaveTypesQuery();
  const { data: balances } = useGetLeaveBalancesQuery();
  const { data: policies } = useGetLeavePoliciesQuery();
  const { data: colleagues } = useGetLeaveColleaguesQuery();
  const [applyLeave, { isLoading: applying }] = useApplyLeaveMutation();
  const [updateLeave, { isLoading: saving }] = useUpdateLeaveMutation();
  const [leaveTypeId, setLeaveTypeId] = useState(editing?.leaveTypeId ?? '');
  const [duration, setDuration] = useState<'full' | 'half'>(editing?.duration ?? 'full');
  const [message, setMessage] = useState<{ tone: StatusTone; text: string } | null>(null);
  const toast = useToast();
  const isLoading = applying || saving;

  useEffect(() => {
    if (!editing) return;
    setLeaveTypeId(editing.leaveTypeId);
    setDuration(editing.duration);
  }, [editing]);

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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const startDate = String(form.get('startDate') ?? '');
    const endDate = duration === 'half' ? startDate : String(form.get('endDate') ?? startDate);
    const body = {
      leaveTypeId: selectedType?.id ?? '',
      startDate,
      endDate,
      duration,
      reason: String(form.get('reason') ?? '') || undefined,
      handoverEmployeeId: needsHandover ? String(form.get('handoverEmployeeId') ?? '') : undefined,
      handover: needsHandover
        ? (colleagues?.data ?? []).find((item) => item.id === String(form.get('handoverEmployeeId') ?? ''))?.fullName
        : undefined,
      attachmentUrl: String(form.get('attachmentUrl') ?? '') || undefined,
    };
    if (!selectedType?.id) {
      toast.warning('Select a leave type first.');
      return;
    }
    try {
      if (editing) {
        await updateLeave({ id: editing.id, body }).unwrap();
        toast.success('Leave request updated.');
        onCancelEdit?.();
      } else {
        await applyLeave(body).unwrap();
        toast.success('Leave request submitted.');
        formEl.reset();
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
      className="max-w-md space-y-6 border border-border bg-background p-6 shadow-card"
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
      </div>
      <div>
        <Label htmlFor="startDate">Start date</Label>
        <Input id="startDate" name="startDate" type="date" required defaultValue={editing ? dateValue(editing.startDate) : ''} />
      </div>
      {duration === 'full' ? (
        <div>
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" name="endDate" type="date" required defaultValue={editing ? dateValue(editing.endDate) : ''} />
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
      {needsHandover ? (
        <div>
          <Label htmlFor="handoverEmployeeId">Handover colleague</Label>
          <select
            id="handoverEmployeeId"
            name="handoverEmployeeId"
            className="h-10 w-full rounded border border-border bg-background px-3 text-sm shadow-card outline-none"
            required
            defaultValue={editing?.handoverEmployeeId ?? ''}
          >
            <option value="" disabled>
              Select colleague
            </option>
            {(colleagues?.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.fullName}
              </option>
            ))}
          </select>
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
