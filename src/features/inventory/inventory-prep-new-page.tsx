'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import {
  SELECT_CLASS,
  formatQtyChips,
  parseQtyChipsInput,
} from '@/features/inventory/inventory-constants';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateInventoryPrepSessionMutation,
  useGetInventoryCatalogQuery,
  useGetInventoryLocationsQuery,
} from '@/store/api/api';

export function InventoryPrepNewPage() {
  const router = useRouter();
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage =
    permissions.includes(PERMISSIONS.INVENTORY_PREP_MANAGE) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const { data: catalogData } = useGetInventoryCatalogQuery(undefined, { skip: !canManage });
  const { data: locationsData } = useGetInventoryLocationsQuery(undefined, { skip: !canManage });
  const [createSession, { isLoading }] = useCreateInventoryPrepSessionMutation();
  const [selectedCatalogId, setSelectedCatalogId] = useState('');

  const catalogItems = useMemo(
    () =>
      (catalogData?.data ?? []).filter(
        (item) => item.status === 'active' && item.categoryCode === 'REAGENTS',
      ),
    [catalogData?.data],
  );
  const locations = useMemo(
    () => (locationsData?.data ?? []).filter((item) => item.status === 'active'),
    [locationsData?.data],
  );
  const selectedItem = catalogItems.find((item) => item.id === selectedCatalogId);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const chipsRaw = String(form.get('qtyChips') ?? '').trim();
    const chips = chipsRaw ? parseQtyChipsInput(chipsRaw) : undefined;
    if (chips && chips.length > 15) {
      toast.error('At most 15 qty chips are allowed.');
      return;
    }
    try {
      const created = await createSession({
        catalogItemId: String(form.get('catalogItemId') ?? ''),
        locationId: String(form.get('locationId') ?? ''),
        targetQty: Number(form.get('targetQty') ?? 0),
        unit: String(form.get('unit') ?? '').trim() || undefined,
        qtyChips: chips,
        notes: String(form.get('notes') ?? '').trim(),
      }).unwrap();
      toast.success('Prep session opened.');
      router.push(`/inventory/prep/${created.data.id}`);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to open prep session.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Open prep" />
        <p className="text-sm text-muted">You need prep or lots manage permission.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={isLoading} />
      <PageHeader kicker="Inventory" title="Open prep session" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Choose the reagent catalog item and how much you will make (for example 1000 ml). Next you
        will issue chemicals/solvents into this session.
      </p>
      <form className="mt-4 max-w-2xl space-y-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="catalogItemId">Reagent catalog item</Label>
          <select
            id="catalogItemId"
            name="catalogItemId"
            className={SELECT_CLASS}
            required
            value={selectedCatalogId}
            onChange={(event) => setSelectedCatalogId(event.target.value)}
          >
            <option value="" disabled>
              Select reagent
            </option>
            {catalogItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.unit})
              </option>
            ))}
          </select>
          {catalogItems.length === 0 ? (
            <p className="mt-1 text-xs text-muted">
              Add an active Reagents item under Catalog first.
            </p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="locationId">Location</Label>
            <select id="locationId" name="locationId" className={SELECT_CLASS} required defaultValue="">
              <option value="" disabled>
                Select location
              </option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="targetQty">Target quantity</Label>
            <Input id="targetQty" name="targetQty" type="number" min={0.0001} step="any" required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" name="unit" defaultValue={selectedItem?.unit ?? ''} placeholder="ml" />
          </div>
          <div>
            <Label htmlFor="qtyChips">Qty chips (optional)</Label>
            <Input
              id="qtyChips"
              name="qtyChips"
              placeholder={
                selectedItem?.defaultQtyChips.length
                  ? formatQtyChips(selectedItem.defaultQtyChips)
                  : '5, 10, 25'
              }
              defaultValue={
                selectedItem?.defaultQtyChips.length ? formatQtyChips(selectedItem.defaultQtyChips) : ''
              }
              key={selectedItem?.id ?? 'chips'}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isLoading || catalogItems.length === 0}>
            {isLoading ? 'Opening…' : 'Open session'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/inventory/prep')}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
