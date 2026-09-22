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
  useGetInventoryCatalogQuery,
  useGetInventoryLocationsQuery,
  useReceiveInventoryPlasticStockMutation,
} from '@/store/api/api';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function InventoryPlasticReceivePage() {
  const router = useRouter();
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage =
    permissions.includes(PERMISSIONS.INVENTORY_PLASTIC_MANAGE) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const { data: catalogData } = useGetInventoryCatalogQuery(undefined, { skip: !canManage });
  const { data: locationsData } = useGetInventoryLocationsQuery(undefined, { skip: !canManage });
  const [receiveStock, { isLoading }] = useReceiveInventoryPlasticStockMutation();
  const [selectedCatalogId, setSelectedCatalogId] = useState('');

  const catalogItems = useMemo(
    () =>
      (catalogData?.data ?? []).filter(
        (item) => item.status === 'active' && item.categoryCode === 'PLASTIC_WARES',
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
    let chips: number[] | undefined;
    if (chipsRaw) {
      const parsed = parseQtyChipsInput(chipsRaw);
      if (parsed.some((n) => !Number.isInteger(n))) {
        toast.error('Box qty chips must be whole numbers.');
        return;
      }
      chips = parsed.map((n) => Math.trunc(n));
    }
    try {
      const created = await receiveStock({
        catalogItemId: String(form.get('catalogItemId') ?? ''),
        locationId: String(form.get('locationId') ?? ''),
        manufacturer: String(form.get('manufacturer') ?? '').trim(),
        sizeLabel: String(form.get('sizeLabel') ?? '').trim(),
        boxes: Number(form.get('boxes') ?? 0),
        totalCost: Number(form.get('totalCost') ?? 0) || 0,
        supplierName: String(form.get('supplierName') ?? '').trim(),
        supplierType: String(form.get('supplierType') ?? 'external') as 'external' | 'internal',
        purchaseDate: String(form.get('purchaseDate') ?? ''),
        qtyChips: chips,
        notes: String(form.get('notes') ?? '').trim(),
      }).unwrap();
      toast.success('Plastic stock received.');
      router.push(`/inventory/plastic/${created.data.id}`);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to receive plastic stock.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Receive plastic" />
        <p className="text-sm text-muted">You need plastic manage permission.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={isLoading} />
      <PageHeader kicker="Inventory" title="Receive plastic boxes" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Enter boxes (not individual gloves/tips). Matching item + location + manufacturer + size
        adds to the same stock line. Issue happens from the station QR at that location.
      </p>
      <form className="mt-4 max-w-2xl space-y-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="catalogItemId">Catalog item</Label>
          <select
            id="catalogItemId"
            name="catalogItemId"
            className={SELECT_CLASS}
            required
            value={selectedCatalogId}
            onChange={(event) => setSelectedCatalogId(event.target.value)}
          >
            <option value="" disabled>
              Select plastic item
            </option>
            {catalogItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.unit})
              </option>
            ))}
          </select>
          {catalogItems.length === 0 ? (
            <p className="mt-1 text-xs text-muted">
              Add an active Plastic wares catalog item first (e.g. Gloves).
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
            <Label htmlFor="purchaseDate">Purchase date</Label>
            <Input id="purchaseDate" name="purchaseDate" type="date" required defaultValue={todayIso()} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Input id="manufacturer" name="manufacturer" placeholder="Brand" />
          </div>
          <div>
            <Label htmlFor="sizeLabel">Size / attr</Label>
            <Input id="sizeLabel" name="sizeLabel" required placeholder="L / M / 10µl" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="boxes">Boxes</Label>
            <Input id="boxes" name="boxes" type="number" min={1} step={1} required />
          </div>
          <div>
            <Label htmlFor="totalCost">Total cost</Label>
            <Input id="totalCost" name="totalCost" type="number" min={0} step="0.01" defaultValue={0} />
          </div>
          <div>
            <Label htmlFor="qtyChips">Box chips</Label>
            <Input
              id="qtyChips"
              name="qtyChips"
              placeholder={
                selectedItem?.defaultQtyChips.length
                  ? formatQtyChips(selectedItem.defaultQtyChips)
                  : '1, 2, 5'
              }
              defaultValue={
                selectedItem?.defaultQtyChips.length
                  ? formatQtyChips(selectedItem.defaultQtyChips)
                  : '1, 2, 5'
              }
              key={selectedItem?.id ?? 'chips'}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="supplierName">Supplier</Label>
            <Input id="supplierName" name="supplierName" />
          </div>
          <div>
            <Label htmlFor="supplierType">Supplier type</Label>
            <select id="supplierType" name="supplierType" className={SELECT_CLASS} defaultValue="external">
              <option value="external">External</option>
              <option value="internal">Internal</option>
            </select>
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isLoading || catalogItems.length === 0}>
            {isLoading ? 'Receiving…' : 'Receive boxes'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/inventory/plastic')}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
