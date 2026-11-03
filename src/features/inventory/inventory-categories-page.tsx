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
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { ALERT_MODES, SELECT_CLASS } from '@/features/inventory/inventory-constants';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateInventoryCategoryMutation,
  useGetInventoryCategoriesQuery,
  useUpdateInventoryCategoryMutation,
} from '@/store/api/api';
import type { InventoryCategory } from '@/types/api';

function alertLabel(value: string): string {
  return ALERT_MODES.find((item) => item.value === value)?.label ?? value;
}

export function InventoryCategoriesPage() {
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage = permissions.includes(PERMISSIONS.INVENTORY_CATEGORIES_MANAGE);
  const { data, isLoading, isError } = useGetInventoryCategoriesQuery(undefined, { skip: !canManage });
  const [updateCategory, { isLoading: updating }] = useUpdateInventoryCategoryMutation();
  const [createCategory, { isLoading: creating }] = useCreateInventoryCategoryMutation();
  const [editing, setEditing] = useState<InventoryCategory | null>(null);
  const [creatingOpen, setCreatingOpen] = useState(false);

  async function onUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const reorderRaw = String(form.get('defaultReorderQty') ?? '').trim();
    try {
      await updateCategory({
        id: editing.id,
        body: {
          name: String(form.get('name') ?? '').trim(),
          defaultAlertMode: String(form.get('defaultAlertMode') ?? 'both') as InventoryCategory['defaultAlertMode'],
          defaultReorderQty: reorderRaw === '' ? null : Number(reorderRaw),
          defaultVelocityDays: Number(form.get('defaultVelocityDays') ?? 15),
          defaultExpiryLeadDays: Number(form.get('defaultExpiryLeadDays') ?? 15),
        },
      }).unwrap();
      setEditing(null);
      toast.success('Category saved.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to update category.'));
    }
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reorderRaw = String(form.get('defaultReorderQty') ?? '').trim();
    try {
      await createCategory({
        name: String(form.get('name') ?? '').trim(),
        deductionMode: String(form.get('deductionMode') ?? 'measured') as 'measured' | 'box',
        defaultAlertMode: String(form.get('defaultAlertMode') ?? 'both') as InventoryCategory['defaultAlertMode'],
        defaultReorderQty: reorderRaw === '' ? null : Number(reorderRaw),
        defaultVelocityDays: Number(form.get('defaultVelocityDays') ?? 15),
        defaultExpiryLeadDays: Number(form.get('defaultExpiryLeadDays') ?? 15),
      }).unwrap();
      setCreatingOpen(false);
      toast.success('Category added.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to add category.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Categories" />
        <p className="text-sm text-muted">You need category manage permission.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={updating || creating} />
      <PageHeader
        kicker="Inventory"
        title="Categories"
        actions={
          <Button type="button" onClick={() => setCreatingOpen(true)}>
            Add category
          </Button>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Add a category when the lab needs a new kind of stock. Measured categories are received as lots.
        Box categories, such as Plastic wares and Miscellaneous, use the room QR.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load categories.</p> : null}

      <DataTable
        columns={[
          { id: 'name', header: 'Category', cell: (row) => row.name },
          { id: 'mode', header: 'Deduction', cell: (row) => row.deductionMode },
          { id: 'alert', header: 'Alert mode', cell: (row) => alertLabel(row.defaultAlertMode) },
          {
            id: 'reorder',
            header: 'Reorder qty',
            cell: (row) => (row.defaultReorderQty == null ? '—' : String(row.defaultReorderQty)),
          },
          { id: 'velocity', header: 'Velocity days', cell: (row) => String(row.defaultVelocityDays) },
          { id: 'expiry', header: 'Expiry lead', cell: (row) => String(row.defaultExpiryLeadDays) },
          {
            id: 'actions',
            header: '',
            cell: (row) => (
              <EditIconButton
                label={`Edit ${row.name} defaults`}
                onClick={() => {
                                    setEditing(row);
                }}
              />
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No categories"
        emptyDescription="Apply migration 072 to seed system categories."
      />

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogTitle>Edit {editing?.name}</DialogTitle>
          <DialogDescription>
            {editing?.isSystem
              ? `System code stays ${editing.code}. You can change the name and alert defaults.`
              : `Code ${editing?.code}. Deduction stays ${editing?.deductionMode}.`}
          </DialogDescription>
          {editing ? (
            <form className="mt-4 space-y-4" onSubmit={onUpdate}>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editing.name} required />
              </div>
              <div>
                <Label htmlFor="defaultAlertMode">Alert mode</Label>
                <select
                  id="defaultAlertMode"
                  name="defaultAlertMode"
                  className={SELECT_CLASS}
                  defaultValue={editing.defaultAlertMode}
                >
                  {ALERT_MODES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="defaultReorderQty">Reorder qty</Label>
                  <Input
                    id="defaultReorderQty"
                    name="defaultReorderQty"
                    type="number"
                    min={0}
                    step="any"
                    defaultValue={editing.defaultReorderQty ?? ''}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label htmlFor="defaultVelocityDays">Velocity days</Label>
                  <Input
                    id="defaultVelocityDays"
                    name="defaultVelocityDays"
                    type="number"
                    min={1}
                    max={365}
                    defaultValue={editing.defaultVelocityDays}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="defaultExpiryLeadDays">Expiry lead days</Label>
                  <Input
                    id="defaultExpiryLeadDays"
                    name="defaultExpiryLeadDays"
                    type="number"
                    min={0}
                    max={365}
                    defaultValue={editing.defaultExpiryLeadDays}
                    required
                  />
                </div>
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

      <Dialog open={creatingOpen} onOpenChange={setCreatingOpen}>
        <DialogContent>
          <DialogTitle>Add category</DialogTitle>
          <DialogDescription>
            Measured stock is received as a lot. Box stock uses a room QR and can include several items.
          </DialogDescription>
          <form className="mt-4 space-y-4" onSubmit={onCreate}>
            <div>
              <Label htmlFor="new-name">Name</Label>
              <Input id="new-name" name="name" required placeholder="Miscellaneous" />
            </div>
            <div>
              <Label htmlFor="deductionMode">Deduction</Label>
              <select id="deductionMode" name="deductionMode" className={SELECT_CLASS} defaultValue="box">
                <option value="measured">Measured (one lot QR)</option>
                <option value="box">Box (room QR, several items)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="new-alert">Alert mode</Label>
              <select id="new-alert" name="defaultAlertMode" className={SELECT_CLASS} defaultValue="reorder">
                {ALERT_MODES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="new-reorder">Reorder qty</Label>
                <Input id="new-reorder" name="defaultReorderQty" type="number" min={0} step="any" />
              </div>
              <div>
                <Label htmlFor="new-velocity">Velocity days</Label>
                <Input id="new-velocity" name="defaultVelocityDays" type="number" min={1} max={365} defaultValue={15} required />
              </div>
              <div>
                <Label htmlFor="new-expiry">Expiry lead days</Label>
                <Input id="new-expiry" name="defaultExpiryLeadDays" type="number" min={0} max={365} defaultValue={0} required />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreatingOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Adding…' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
