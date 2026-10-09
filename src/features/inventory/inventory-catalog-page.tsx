'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
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

function matchesCatalogSearch(item: InventoryCatalogItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [item.name, item.brandName ?? '', item.catalogNumber ?? '', item.categoryName]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
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
  const [search, setSearch] = useState('');
  const categories = categoriesData?.data ?? [];
  const allItems = data?.data ?? [];
  const filteredItems = useMemo(
    () => allItems.filter((item) => matchesCatalogSearch(item, search)),
    [allItems, search],
  );

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
        brandName: String(form.get('brandName') ?? '').trim(),
        catalogNumber: String(form.get('catalogNumber') ?? '').trim(),
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
          brandName: String(form.get('brandName') ?? '').trim(),
          catalogNumber: String(form.get('catalogNumber') ?? '').trim(),
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
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Add item
          </Button>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Master list of what you stock. Include the{' '}
        <span className="text-foreground">catalogue number</span> and{' '}
        <span className="text-foreground">brand name</span> — search filters by brand, catalogue number, or
        name. Catalogue number is shown with the name in receive and prep pickers.{' '}
        <span className="text-foreground">Unit</span> is how this item is measured (g, ml, …). Stock amounts
        live on each received lot — not here. Duplicate name (same category) or catalogue number is blocked.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load catalog.</p> : null}

      <div className="mb-4 max-w-md">
        <Label htmlFor="catalog-search">Search catalog</Label>
        <Input
          id="catalog-search"
          className="mt-1"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Brand, catalogue number, or name…"
          autoComplete="off"
        />
        <p className="mt-1 text-xs text-muted">
          Showing {filteredItems.length} of {allItems.length}
          {search.trim() ? ' matching' : ''} item{allItems.length === 1 ? '' : 's'}.
        </p>
      </div>

      <DataTable
        columns={[
          {
            id: 'name',
            header: 'Name',
            cell: (row) =>
              row.catalogNumber?.trim() ? `${row.name} (${row.catalogNumber.trim()})` : row.name,
          },
          {
            id: 'brandName',
            header: 'Brand',
            cell: (row) => row.brandName?.trim() || '—',
          },
          {
            id: 'catalogNumber',
            header: 'Catalogue no.',
            cell: (row) => row.catalogNumber?.trim() || '—',
          },
          { id: 'category', header: 'Category', cell: (row) => row.categoryName },
          { id: 'unit', header: 'Unit', cell: (row) => row.unit },
          {
            id: 'chips',
            header: 'Kiosk chips',
            cell: (row) => (row.defaultQtyChips.length ? formatQtyChips(row.defaultQtyChips) : '—'),
          },
          { id: 'alert', header: 'Alert', cell: (row) => alertLabel(row.alertMode) },
          { id: 'status', header: 'Status', cell: (row) => row.status },
          {
            id: 'actions',
            header: '',
            cell: (row) => (
              <EditIconButton label={`Edit ${row.name}`} onClick={() => setEditing(row)} />
            ),
          },
        ]}
        rows={filteredItems}
        loading={isLoading}
        emptyTitle={search.trim() ? 'No matching catalog items' : 'No catalog items'}
        emptyDescription={
          search.trim()
            ? 'Try another brand, catalogue number, or name.'
            : 'Add Agarose, gloves, Milli-Q, and other named stock.'
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogTitle>Add catalog item</DialogTitle>
          <DialogDescription>
            Define the item and its measuring unit. Receive creates the actual stock bottle.
          </DialogDescription>
          <form className="mt-4 space-y-5" onSubmit={onCreate}>
            <section className="space-y-3">
              <Meta>Identity</Meta>
              <div>
                <Label htmlFor="categoryId">Category</Label>
                <select
                  id="categoryId"
                  name="categoryId"
                  className={SELECT_CLASS}
                  required
                  defaultValue=""
                >
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
                  <Label htmlFor="brandName">Brand name</Label>
                  <Input
                    id="brandName"
                    name="brandName"
                    maxLength={128}
                    placeholder="e.g. Sigma / Thermo"
                  />
                </div>
                <div>
                  <Label htmlFor="catalogNumber">Catalogue number</Label>
                  <Input
                    id="catalogNumber"
                    name="catalogNumber"
                    required
                    maxLength={128}
                    placeholder="e.g. A9539 / CAT-123"
                  />
                  <p className="mt-1 text-xs text-muted">
                    Must be unique. Shown with the name when receiving stock.
                  </p>
                </div>
                <div>
                  <Label htmlFor="unit">Measuring unit</Label>
                  <Input id="unit" name="unit" required placeholder="g / ml / box" />
                  <p className="mt-1 text-xs text-muted">Used for stock, chips, and alerts.</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <Meta>Kiosk quick amounts</Meta>
              <div>
                <Label htmlFor="defaultQtyChips">Default qty chips</Label>
                <Input id="defaultQtyChips" name="defaultQtyChips" placeholder="0.1, 0.5, 1, 1.25" />
                <p className="mt-1 text-xs text-muted">
                  Comma-separated buttons on the scan card (same unit as above). Max 15.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <Meta>Alerts</Meta>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="reorderQty">Reorder qty</Label>
                  <Input id="reorderQty" name="reorderQty" type="number" min={0} step="any" />
                  <p className="mt-1 text-xs text-muted">Alert when remaining ≤ this (same unit).</p>
                </div>
                <div>
                  <Label htmlFor="velocityDays">Velocity days</Label>
                  <Input id="velocityDays" name="velocityDays" type="number" min={1} max={365} />
                  <p className="mt-1 text-xs text-muted">Alert when projected days left ≤ this.</p>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="expiryLeadDays">Expiry lead days</Label>
                  <Input id="expiryLeadDays" name="expiryLeadDays" type="number" min={0} max={365} />
                  <p className="mt-1 text-xs text-muted">Alert this many days before lot expiry.</p>
                </div>
              </div>
            </section>

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
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogTitle>Edit catalog item</DialogTitle>
          <DialogDescription>
            {editing?.categoryName} · category is fixed after create
          </DialogDescription>
          {editing ? (
            <form key={editing.id} className="mt-4 space-y-5" onSubmit={onUpdate}>
              <section className="space-y-3">
                <Meta>Identity</Meta>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-name">Name</Label>
                    <Input id="edit-name" name="name" defaultValue={editing.name} required />
                  </div>
                  <div>
                    <Label htmlFor="edit-brandName">Brand name</Label>
                    <Input
                      id="edit-brandName"
                      name="brandName"
                      defaultValue={editing.brandName ?? ''}
                      maxLength={128}
                      placeholder="e.g. Sigma / Thermo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-catalogNumber">Catalogue number</Label>
                    <Input
                      id="edit-catalogNumber"
                      name="catalogNumber"
                      defaultValue={editing.catalogNumber ?? ''}
                      required
                      maxLength={128}
                      placeholder="e.g. A9539 / CAT-123"
                    />
                    <p className="mt-1 text-xs text-muted">
                      Must be unique. Shown with the name when receiving stock.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="edit-unit">Measuring unit</Label>
                    <Input id="edit-unit" name="unit" defaultValue={editing.unit} required />
                    <p className="mt-1 text-xs text-muted">Used for stock, chips, and alerts.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <Meta>Kiosk quick amounts</Meta>
                <div>
                  <Label htmlFor="edit-chips">Default qty chips</Label>
                  <Input
                    id="edit-chips"
                    name="defaultQtyChips"
                    defaultValue={formatQtyChips(editing.defaultQtyChips)}
                    placeholder="0.1, 0.5, 1, 1.25"
                  />
                  <p className="mt-1 text-xs text-muted">
                    Comma-separated scan-card buttons (same unit). Max 15.
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <Meta>Alerts</Meta>
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
                <div className="grid gap-4 sm:grid-cols-2">
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
                    <p className="mt-1 text-xs text-muted">Alert when remaining ≤ this (same unit).</p>
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
                    <p className="mt-1 text-xs text-muted">Alert when projected days left ≤ this.</p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="edit-expiryLeadDays">Expiry lead days</Label>
                    <Input
                      id="edit-expiryLeadDays"
                      name="expiryLeadDays"
                      type="number"
                      min={0}
                      max={365}
                      defaultValue={editing.expiryLeadDays ?? ''}
                    />
                    <p className="mt-1 text-xs text-muted">Alert this many days before lot expiry.</p>
                  </div>
                </div>
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Input id="edit-notes" name="notes" defaultValue={editing.notes} />
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
