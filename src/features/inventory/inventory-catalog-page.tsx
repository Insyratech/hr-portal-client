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
import {
  ALERT_MODES,
  SELECT_CLASS,
  formatQtyChips,
  parseQtyChipsInput,
} from '@/features/inventory/inventory-constants';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateInventoryCatalogItemMutation,
  useGetInventoryCatalogQuery,
  useGetInventoryCategoriesQuery,
  useUpdateInventoryCatalogItemMutation,
} from '@/store/api/api';
import type { InventoryCatalogItem } from '@/types/api';

function alertLabel(value: string): string {
  return ALERT_MODES.find((item) => item.value === value)?.label ?? value;
}

export function InventoryCatalogPage() {
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage = permissions.includes(PERMISSIONS.INVENTORY_CATALOG_MANAGE);
  const { data, isLoading, isError } = useGetInventoryCatalogQuery(undefined, { skip: !canManage });
  const { data: categoriesData } = useGetInventoryCategoriesQuery(undefined, { skip: !canManage });
  const [createItem, { isLoading: creating }] = useCreateInventoryCatalogItemMutation();
  const [updateItem, { isLoading: updating }] = useUpdateInventoryCatalogItemMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryCatalogItem | null>(null);
  const categories = categoriesData?.data ?? [];

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const chips = parseQtyChipsInput(String(form.get('defaultQtyChips') ?? ''));
    if (chips.length > 15) {
      toast.error('At most 15 default qty chips are allowed.');
      return;
    }
    const reorderRaw = String(form.get('reorderQty') ?? '').trim();
    const velocityRaw = String(form.get('velocityDays') ?? '').trim();
    const expiryRaw = String(form.get('expiryLeadDays') ?? '').trim();
    try {
      await createItem({
        categoryId: String(form.get('categoryId') ?? ''),
        name: String(form.get('name') ?? '').trim(),
        unit: String(form.get('unit') ?? '').trim(),
        defaultQtyChips: chips,
        alertMode: String(form.get('alertMode') ?? 'both') as InventoryCatalogItem['alertMode'],
        reorderQty: reorderRaw === '' ? null : Number(reorderRaw),
        velocityDays: velocityRaw === '' ? null : Number(velocityRaw),
        expiryLeadDays: expiryRaw === '' ? null : Number(expiryRaw),
        notes: String(form.get('notes') ?? '').trim(),
      }).unwrap();
      setCreateOpen(false);
      toast.success('Catalog item saved.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to create catalog item.'));
    }
  }

  async function onUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    const chips = parseQtyChipsInput(String(form.get('defaultQtyChips') ?? ''));
    if (chips.length > 15) {
      toast.error('At most 15 default qty chips are allowed.');
      return;
    }
    const reorderRaw = String(form.get('reorderQty') ?? '').trim();
    const velocityRaw = String(form.get('velocityDays') ?? '').trim();
    const expiryRaw = String(form.get('expiryLeadDays') ?? '').trim();
    try {
      await updateItem({
        id: editing.id,
        body: {
          name: String(form.get('name') ?? '').trim(),
          unit: String(form.get('unit') ?? '').trim(),
          defaultQtyChips: chips,
          alertMode: String(form.get('alertMode') ?? 'both') as InventoryCatalogItem['alertMode'],
          reorderQty: reorderRaw === '' ? null : Number(reorderRaw),
          velocityDays: velocityRaw === '' ? null : Number(velocityRaw),
          expiryLeadDays: expiryRaw === '' ? null : Number(expiryRaw),
          notes: String(form.get('notes') ?? '').trim(),
          status: String(form.get('status') ?? 'active') as InventoryCatalogItem['status'],
        },
      }).unwrap();
      setEditing(null);
      toast.success('Catalog item updated.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to update catalog item.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Catalog" />
        <p className="text-sm text-muted">You need catalog manage permission.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={creating || updating} />
      <PageHeader
        kicker="Inventory"
        title="Catalog"
        actions={
          <Button
            type="button"
            onClick={() => {
              setCreateOpen(true);
            }}
          >
            Add item
          </Button>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Named lab materials with unit, up to 15 quick-qty chips for the future kiosk card, and alert
        mode.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load catalog.</p> : null}

      <DataTable
        columns={[
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'category', header: 'Category', cell: (row) => row.categoryName },
          { id: 'unit', header: 'Unit', cell: (row) => row.unit },
          {
            id: 'chips',
            header: 'Qty chips',
            cell: (row) => (row.defaultQtyChips.length ? formatQtyChips(row.defaultQtyChips) : '—'),
          },
          { id: 'alert', header: 'Alert', cell: (row) => alertLabel(row.alertMode) },
          { id: 'status', header: 'Status', cell: (row) => row.status },
          {
            id: 'actions',
            header: '',
            cell: (row) => (
              <EditIconButton
                label={`Edit ${row.name}`}
                onClick={() => {
                  setEditing(row);
                }}
              />
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No catalog items"
        emptyDescription="Add Agarose, gloves, Milli-Q, and other named stock."
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogTitle>Add catalog item</DialogTitle>
          <DialogDescription>Qty chips are comma-separated (max 15).</DialogDescription>
          <form className="mt-4 space-y-4" onSubmit={onCreate}>
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <select id="categoryId" name="categoryId" className={SELECT_CLASS} required defaultValue="">
                <option value="" disabled>
                  Select category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="Agarose" />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input id="unit" name="unit" required placeholder="g / ml / box" />
              </div>
            </div>
            <div>
              <Label htmlFor="defaultQtyChips">Default qty chips</Label>
              <Input id="defaultQtyChips" name="defaultQtyChips" placeholder="1, 2, 5, 10" />
            </div>
            <div>
              <Label htmlFor="alertMode">Alert mode</Label>
              <select id="alertMode" name="alertMode" className={SELECT_CLASS} defaultValue="both">
                {ALERT_MODES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="reorderQty">Reorder qty</Label>
                <Input id="reorderQty" name="reorderQty" type="number" min={0} step="any" />
              </div>
              <div>
                <Label htmlFor="velocityDays">Velocity days</Label>
                <Input id="velocityDays" name="velocityDays" type="number" min={1} max={365} />
              </div>
              <div>
                <Label htmlFor="expiryLeadDays">Expiry lead days</Label>
                <Input id="expiryLeadDays" name="expiryLeadDays" type="number" min={0} max={365} />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogTitle>Edit catalog item</DialogTitle>
          <DialogDescription>
            {editing?.categoryName} · category is fixed after create
          </DialogDescription>
          {editing ? (
            <form className="mt-4 space-y-4" onSubmit={onUpdate}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input id="edit-name" name="name" defaultValue={editing.name} required />
                </div>
                <div>
                  <Label htmlFor="edit-unit">Unit</Label>
                  <Input id="edit-unit" name="unit" defaultValue={editing.unit} required />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-chips">Default qty chips</Label>
                <Input
                  id="edit-chips"
                  name="defaultQtyChips"
                  defaultValue={formatQtyChips(editing.defaultQtyChips)}
                />
              </div>
              <div>
                <Label htmlFor="edit-alertMode">Alert mode</Label>
                <select
                  id="edit-alertMode"
                  name="alertMode"
                  className={SELECT_CLASS}
                  defaultValue={editing.alertMode}
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
                  <Label htmlFor="edit-reorderQty">Reorder qty</Label>
                  <Input
                    id="edit-reorderQty"
                    name="reorderQty"
                    type="number"
                    min={0}
                    step="any"
                    defaultValue={editing.reorderQty ?? ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-velocityDays">Velocity days</Label>
                  <Input
                    id="edit-velocityDays"
                    name="velocityDays"
                    type="number"
                    min={1}
                    max={365}
                    defaultValue={editing.velocityDays ?? ''}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-expiryLeadDays">Expiry lead days</Label>
                  <Input
                    id="edit-expiryLeadDays"
                    name="expiryLeadDays"
                    type="number"
                    min={0}
                    max={365}
                    defaultValue={editing.expiryLeadDays ?? ''}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Input id="edit-notes" name="notes" defaultValue={editing.notes} />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select id="edit-status" name="status" className={SELECT_CLASS} defaultValue={editing.status}>
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
