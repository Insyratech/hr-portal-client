'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import {
  SELECT_CLASS,
  formatQtyChips,
  parseQtyChipsInput,
} from '@/features/inventory/inventory-constants';
import { printInventoryLotLabel } from '@/features/inventory/inventory-lot-print';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useGetInventoryCatalogQuery,
  useGetInventoryLocationsQuery,
  useLazyGetInventoryLotPrintQuery,
  useReceiveInventoryLotMutation,
} from '@/store/api/api';

const MEASURED_CODES = new Set(['MATERIALS', 'CHEMICALS', 'SOLVENTS', 'REAGENTS']);

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function InventoryReceivePage() {
  const router = useRouter();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage = permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const { data: catalogData } = useGetInventoryCatalogQuery(undefined, { skip: !canManage });
  const { data: locationsData } = useGetInventoryLocationsQuery(undefined, { skip: !canManage });
  const [receiveLot, { isLoading }] = useReceiveInventoryLotMutation();
  const [fetchPrint] = useLazyGetInventoryLotPrintQuery();
  const [error, setError] = useState<string | null>(null);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');

  const catalogItems = useMemo(
    () =>
      (catalogData?.data ?? []).filter(
        (item) => item.status === 'active' && MEASURED_CODES.has(item.categoryCode),
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
    setError(null);
    const form = new FormData(event.currentTarget);
    const chipsRaw = String(form.get('qtyChips') ?? '').trim();
    const chips = chipsRaw ? parseQtyChipsInput(chipsRaw) : undefined;
    if (chips && chips.length > 15) {
      setError('At most 15 qty chips are allowed.');
      return;
    }
    try {
      const created = await receiveLot({
        catalogItemId: String(form.get('catalogItemId') ?? ''),
        locationId: String(form.get('locationId') ?? ''),
        supplierName: String(form.get('supplierName') ?? '').trim(),
        supplierType: String(form.get('supplierType') ?? 'external') as 'external' | 'internal',
        purchaseDate: String(form.get('purchaseDate') ?? ''),
        qty: Number(form.get('qty') ?? 0),
        unit: String(form.get('unit') ?? '').trim() || undefined,
        totalCost: Number(form.get('totalCost') ?? 0) || 0,
        expiryDate: String(form.get('expiryDate') ?? '').trim() || null,
        qtyChips: chips,
        notes: String(form.get('notes') ?? '').trim(),
      }).unwrap();
      const lot = created.data;

      try {
        const print = await fetchPrint(lot.id).unwrap();
        printInventoryLotLabel(print.data);
      } catch {
        // Receipt succeeded even if print window failed (popup blocked).
      }
      router.push(`/inventory/lots/${lot.id}`);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to receive lot.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Receive lot" />
        <p className="text-sm text-muted">You need lots manage permission.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={isLoading} />
      <PageHeader kicker="Inventory" title="Receive lot" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Materials, Chemicals, Solvents, and bought Reagents. For lab-made reagents use Prep instead
        (component costs only). After save, a QR label print window opens for the bottle.
      </p>
      {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}

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
              Select item
            </option>
            {catalogItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.categoryName} · {item.unit})
              </option>
            ))}
          </select>
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
            <Label htmlFor="supplierName">Supplier</Label>
            <Input id="supplierName" name="supplierName" placeholder="Vendor or Internal" />
          </div>
          <div>
            <Label htmlFor="supplierType">Supplier type</Label>
            <select id="supplierType" name="supplierType" className={SELECT_CLASS} defaultValue="external">
              <option value="external">External</option>
              <option value="internal">Internal</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="qty">Quantity</Label>
            <Input id="qty" name="qty" type="number" min={0.0001} step="any" required />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" name="unit" defaultValue={selectedItem?.unit ?? ''} placeholder="g / ml / kg" />
          </div>
          <div>
            <Label htmlFor="totalCost">Total cost</Label>
            <Input id="totalCost" name="totalCost" type="number" min={0} step="0.01" defaultValue={0} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="expiryDate">Expiry date</Label>
            <Input id="expiryDate" name="expiryDate" type="date" />
          </div>
          <div>
            <Label htmlFor="qtyChips">Qty chips (optional)</Label>
            <Input
              id="qtyChips"
              name="qtyChips"
              placeholder={
                selectedItem?.defaultQtyChips.length
                  ? formatQtyChips(selectedItem.defaultQtyChips)
                  : '1, 2, 5, 10'
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Receiving…' : 'Receive & print QR'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/inventory/lots')}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
