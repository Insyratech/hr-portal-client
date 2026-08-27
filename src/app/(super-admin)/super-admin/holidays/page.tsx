'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
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
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import { useCreateHolidayMutation, useGetHolidaysQuery, useUpdateHolidayMutation } from '@/store/api/api';
import type { Holiday } from '@/types/api';

function dateInputValue(value: string) {
  return value.slice(0, 10);
}

export default function HolidaysPage() {
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.SYSTEM_MANAGE),
  );
  const { data, isLoading } = useGetHolidaysQuery();
  const [createHoliday, { isLoading: saving }] = useCreateHolidayMutation();
  const [updateHoliday, { isLoading: updating }] = useUpdateHolidayMutation();
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      await createHoliday({
        name: String(form.get('name') ?? ''),
        date: String(form.get('date') ?? ''),
        type: String(form.get('type') ?? 'public'),
        region: String(form.get('region') ?? '').trim() || 'IN',
        optional: form.get('optional') === 'on',
      }).unwrap();
      formEl.reset();
      setCreateOpen(false);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create holiday.'));
    }
  }

  async function onSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await updateHoliday({
        id: editing.id,
        body: {
          name: String(form.get('name') ?? ''),
          date: String(form.get('date') ?? ''),
          type: String(form.get('type') ?? 'public'),
          region: String(form.get('region') ?? 'IN'),
          optional: form.get('optional') === 'on',
        },
      }).unwrap();
      setEditing(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update holiday.'));
    }
  }

  return (
    <>
      <PageHeader
        kicker="Calendar"
        title="Holidays"
        actions={
          canManage ? (
            <Button type="button" onClick={() => { setError(null); setCreateOpen(true); }}>
              Add holiday
            </Button>
          ) : null
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Public holidays are skipped when counting leave days. Optional holidays do not block leave.
      </p>
      {!canManage ? (
        <p className="mb-6 text-sm text-muted">HR Manager maintains holidays. This list is read-only.</p>
      ) : null}
      {error && !editing && !createOpen ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      <DataTable
        columns={[
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'date', header: 'Date', cell: (row) => dateInputValue(row.date) },
          { id: 'type', header: 'Type', cell: (row) => row.type },
          { id: 'region', header: 'Region', cell: (row) => row.region },
          { id: 'optional', header: 'Optional', cell: (row) => (row.optional ? 'Yes' : 'No') },
          ...(canManage
            ? [
                {
                  id: 'edit',
                  header: 'Edit',
                  cell: (row: Holiday) => (
                    <EditIconButton label={`Edit ${row.name}`} onClick={() => setEditing(row)} />
                  ),
                },
              ]
            : []),
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No holidays"
        emptyDescription="Public holidays are skipped when counting leave days."
      />

      <Dialog
        open={createOpen && canManage}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setError(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Add holiday</DialogTitle>
          <DialogDescription>Public holidays are skipped when counting leave days.</DialogDescription>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" required />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <select id="type" name="type" className="h-10 w-full rounded border border-border bg-background px-3 text-sm" defaultValue="public">
                <option value="public">Public</option>
                <option value="restricted">Restricted</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Input id="region" name="region" placeholder="IN" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="optional" /> Optional
            </label>
            {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Add holiday'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing) && canManage} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogTitle>Edit holiday</DialogTitle>
          <DialogDescription>Change the name, date, type, region, or optional flag.</DialogDescription>
          {editing ? (
            <form key={editing.id} onSubmit={onSaveEdit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="edit-holiday-name">Name</Label>
                <Input id="edit-holiday-name" name="name" defaultValue={editing.name} required />
              </div>
              <div>
                <Label htmlFor="edit-holiday-date">Date</Label>
                <Input id="edit-holiday-date" name="date" type="date" defaultValue={dateInputValue(editing.date)} required />
              </div>
              <div>
                <Label htmlFor="edit-holiday-type">Type</Label>
                <select
                  id="edit-holiday-type"
                  name="type"
                  className="h-10 w-full rounded border border-border bg-background px-3 text-sm"
                  defaultValue={editing.type}
                >
                  <option value="public">Public</option>
                  <option value="restricted">Restricted</option>
                  <option value="company">Company</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-holiday-region">Region</Label>
                <Input id="edit-holiday-region" name="region" defaultValue={editing.region} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="optional" defaultChecked={editing.optional} /> Optional
              </label>
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
