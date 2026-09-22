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
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { humanizeLocationType, SELECT_CLASS } from '@/features/inventory/inventory-constants';
import { InventoryLocationTypeField } from '@/features/inventory/inventory-location-type-field';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateInventoryLocationMutation,
  useGetInventoryLocationsQuery,
  useUpdateInventoryLocationMutation,
} from '@/store/api/api';
import type { InventoryLocation } from '@/types/api';

export function InventoryLocationsPage() {
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage = permissions.includes(PERMISSIONS.INVENTORY_LOCATIONS_MANAGE);
  const { data, isLoading, isError } = useGetInventoryLocationsQuery(undefined, { skip: !canManage });
  const [createLocation, { isLoading: creating }] = useCreateInventoryLocationMutation();
  const [updateLocation, { isLoading: updating }] = useUpdateInventoryLocationMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryLocation | null>(null);

  const knownTypes = useMemo(
    () => (data?.data ?? []).map((row) => row.locationType),
    [data?.data],
  );

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const locationType = String(form.get('locationType') ?? '').trim();
    if (!locationType || locationType.length < 2) {
      toast.error('Enter a location type (or pick one from the list).');
      return;
    }
    try {
      await createLocation({
        code: String(form.get('code') ?? '').trim(),
        name: String(form.get('name') ?? '').trim(),
        description: String(form.get('description') ?? '').trim(),
        locationType,
      }).unwrap();
      setCreateOpen(false);
      toast.success('Location saved.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to create location.'));
    }
  }

  async function onUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const locationType = String(form.get('locationType') ?? '').trim();
    if (!locationType || locationType.length < 2) {
      toast.error('Enter a location type (or pick one from the list).');
      return;
    }
    try {
      await updateLocation({
        id: editing.id,
        body: {
          name: String(form.get('name') ?? '').trim(),
          description: String(form.get('description') ?? '').trim(),
          locationType,
          status: String(form.get('status') ?? 'active') as InventoryLocation['status'],
        },
      }).unwrap();
      setEditing(null);
      toast.success('Location updated.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to update location.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Locations" />
        <p className="text-sm text-muted">You need location manage permission.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || updating} />
      <PageHeader
        kicker="Inventory"
        title="Locations"
        actions={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Add location
          </Button>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Stores, benches, freezers, and the stock room. Receipts pick a location here. Use Add new
        type when the list does not include your room kind.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load locations.</p> : null}

      <DataTable
        columns={[
          { id: 'code', header: 'Code', cell: (row) => row.code },
          { id: 'name', header: 'Name', cell: (row) => row.name },
          {
            id: 'type',
            header: 'Type',
            cell: (row) => humanizeLocationType(row.locationType),
          },
          { id: 'status', header: 'Status', cell: (row) => row.status },
          {
            id: 'actions',
            header: '',
            cell: (row) => (
              <EditIconButton
                label={`Edit ${row.name}`}
                onClick={() => setEditing(row)}
              />
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No locations yet"
        emptyDescription="Add the stock room and any stores or freezers you use."
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogTitle>Add location</DialogTitle>
          <DialogDescription>Code is unique (e.g. SR-01).</DialogDescription>
          <form className="mt-4 space-y-4" onSubmit={onCreate}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" required />
              </div>
              <InventoryLocationTypeField
                id="locationType"
                name="locationType"
                defaultValue="store"
                knownTypes={knownTypes}
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogTitle>Edit location</DialogTitle>
          <DialogDescription>{editing?.code}</DialogDescription>
          {editing ? (
            <form key={editing.id} className="mt-4 space-y-4" onSubmit={onUpdate}>
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" name="name" defaultValue={editing.name} required />
              </div>
              <InventoryLocationTypeField
                id="edit-locationType"
                name="locationType"
                defaultValue={editing.locationType}
                knownTypes={knownTypes}
              />
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  name="description"
                  defaultValue={editing.description}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  name="status"
                  className={SELECT_CLASS}
                  defaultValue={editing.status}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
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
