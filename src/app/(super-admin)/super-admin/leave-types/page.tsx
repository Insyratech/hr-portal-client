'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditIconButton } from '@/components/ui/edit-icon-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { LeaveRuleFields } from '@/features/leave/leave-rule-fields';
import { latestPolicyRules, leaveRuleDefaults, rulesFromForm } from '@/features/leave/leave-rule-form';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useAddLeavePolicyVersionMutation,
  useCreateLeavePolicyMutation,
  useCreateLeaveTypeMutation,
  useGetLeavePoliciesQuery,
  useGetLeaveTypesQuery,
  usePublishLeavePolicyMutation,
  useUpdateLeaveTypeMutation,
} from '@/store/api/api';
import type { LeavePolicy, LeaveType } from '@/types/api';

type CatalogRow = LeaveType & { policy: LeavePolicy | null };

export default function LeaveTypesPage() {
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.LEAVE_TYPES_MANAGE),
  );
  const { data: types, isLoading } = useGetLeaveTypesQuery();
  const { data: policies } = useGetLeavePoliciesQuery();
  const [createLeaveType, { isLoading: creating }] = useCreateLeaveTypeMutation();
  const [updateLeaveType, { isLoading: updatingType }] = useUpdateLeaveTypeMutation();
  const [createPolicy, { isLoading: creatingPolicy }] = useCreateLeavePolicyMutation();
  const [addVersion, { isLoading: addingVersion }] = useAddLeavePolicyVersionMutation();
  const [publish, { isLoading: publishing }] = usePublishLeavePolicyMutation();
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const saving = creating || updatingType || creatingPolicy || addingVersion || publishing;

  const rows = useMemo<CatalogRow[]>(() => {
    const policyByType = new Map((policies?.data ?? []).map((item) => [item.leaveTypeId, item]));
    return (types?.data ?? []).map((item) => ({ ...item, policy: policyByType.get(item.id) ?? null }));
  }, [types, policies]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      await createLeaveType({
        name: String(form.get('name') ?? ''),
        code: String(form.get('code') ?? ''),
        description: String(form.get('description') ?? ''),
        requiresApproval: form.get('requiresApproval') === 'on',
        requiresHandover: form.get('requiresHandover') === 'on',
        requiresAttachment: form.get('requiresAttachment') === 'on',
        allowHalfDay: form.get('allowHalfDay') === 'on',
        allowMultipleDays: form.get('allowMultipleDays') === 'on',
        paid: form.get('paid') === 'on',
        rules: rulesFromForm(form),
      }).unwrap();
      formEl.reset();
      setCreateOpen(false);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create leave.'));
    }
  }

  async function onSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    const rules = rulesFromForm(form);
    const name = String(form.get('name') ?? '');
    try {
      await updateLeaveType({
        id: editing.id,
        body: {
          name,
          description: String(form.get('description') ?? ''),
          requiresApproval: form.get('requiresApproval') === 'on',
          requiresHandover: form.get('requiresHandover') === 'on',
          requiresAttachment: form.get('requiresAttachment') === 'on',
          allowHalfDay: form.get('allowHalfDay') === 'on',
          allowMultipleDays: form.get('allowMultipleDays') === 'on',
          paid: form.get('paid') === 'on',
          active: form.get('active') === 'on',
        },
      }).unwrap();
      if (editing.policy) {
        await addVersion({ id: editing.policy.id, rules }).unwrap();
        await publish(editing.policy.id).unwrap();
      } else {
        const created = await createPolicy({
          name: `${name} Policy`,
          leaveTypeId: editing.id,
          rules,
        }).unwrap();
        if (created.data?.id) {
          await publish(created.data.id).unwrap();
        }
      }
      setEditing(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update leave.'));
    }
  }

  return (
    <>
      <PageHeader
        kicker="Leave"
        title="Leave"
        actions={
          canManage ? (
            <Button type="button" onClick={() => { setError(null); setCreateOpen(true); }}>
              Add leave
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Days, notice, and approval rules are part of the leave. Saving publishes a new policy version; existing
        applications keep the version they were approved against.
      </p>
      {!canManage ? (
        <p className="mb-6 text-sm text-muted">HR Manager maintains leave types. This list is read-only.</p>
      ) : null}
      <DataTable
        columns={[
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'code', header: 'Code', cell: (row) => row.code },
          { id: 'paid', header: 'Paid', cell: (row) => (row.paid ? 'Yes' : 'No') },
          {
            id: 'days',
            header: 'Days / year',
            cell: (row) => latestPolicyRules(row.policy)?.annualAllocation ?? '—',
          },
          {
            id: 'carry',
            header: 'Carry forward',
            cell: (row) => latestPolicyRules(row.policy)?.carryForward ?? '—',
          },
          {
            id: 'notice',
            header: 'Notice',
            cell: (row) => {
              const rules = latestPolicyRules(row.policy);
              return rules ? `${rules.noticePeriod.value} ${rules.noticePeriod.unit}` : '—';
            },
          },
          { id: 'active', header: 'Active', cell: (row) => (row.active ? 'Yes' : 'No') },
          ...(canManage
            ? [
                {
                  id: 'edit',
                  header: 'Edit',
                  cell: (row: CatalogRow) => (
                    <EditIconButton label={`Edit ${row.name}`} onClick={() => setEditing(row)} />
                  ),
                },
              ]
            : []),
        ]}
        rows={rows}
        loading={isLoading}
        emptyTitle="No leave types"
        emptyDescription="Add a leave with days and rules in one form."
      />

      <Dialog
        open={createOpen && canManage}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogTitle>Add leave</DialogTitle>
          <DialogDescription>Days, notice, and approval rules publish with this leave type.</DialogDescription>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" required />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Who can use it, notice expectation, and any other employee-facing rules"
                />
                <p className="mt-1 text-xs text-muted">
                  Shown when employees apply. Notice is also enforced by the Notice field below.
                </p>
              </div>
            </div>
            <LeaveRuleFields defaults={leaveRuleDefaults(undefined)} />
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add leave'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing) && canManage} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogTitle>Edit leave</DialogTitle>
          <DialogDescription>
            Code stays fixed. Days and other rules publish as a new version so past applications are unchanged.
          </DialogDescription>
          {editing ? (
            <form key={editing.id} onSubmit={onSaveEdit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" name="name" defaultValue={editing.name} required />
              </div>
              <div>
                <Label htmlFor="edit-code">Code</Label>
                <Input id="edit-code" value={editing.code} disabled readOnly />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input id="edit-description" name="description" defaultValue={editing.description ?? ''} />
                <p className="mt-1 text-xs text-muted">
                  Employee-facing: who can avail this leave and how to apply. System rules (notice, max days, approval) still come from the fields below.
                </p>
              </div>
              <LeaveRuleFields
                idPrefix="edit-"
                defaults={leaveRuleDefaults(latestPolicyRules(editing.policy), editing)}
              />
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
