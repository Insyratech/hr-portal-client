'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import {
  SELECT_CLASS,
  formatQtyChips,
  parseQtyChipsInput,
} from '@/features/inventory/inventory-constants';
import { printInventoryLotLabel } from '@/features/inventory/inventory-lot-print';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
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
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage = permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const { data: catalogData } = useGetInventoryCatalogQuery(undefined, { skip: !canManage });
  const { data: locationsData } = useGetInventoryLocationsQuery(undefined, { skip: !canManage });
  const [receiveLot, { isLoading }] = useReceiveInventoryLotMutation();
  const [fetchPrint] = useLazyGetInventoryLotPrintQuery();
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
    const form = new FormData(event.currentTarget);
    const chipsRaw = String(form.get('qtyChips') ?? '').trim();
    const chips = chipsRaw ? parseQtyChipsInput(chipsRaw) : undefined;
    if (chips && chips.length > 15) {
      toast.error('At most 15 qty chips are allowed.');
      return;
    }
    if (!selectedItem) {
      toast.error('Select a catalog item.');
      return;
    }
    try {
      const created = await receiveLot({
        catalogItemId: selectedItem.id,
        locationId: String(form.get('locationId') ?? ''),
        supplierName: String(form.get('supplierName') ?? '').trim(),
        supplierType: String(form.get('supplierType') ?? 'external') as 'external' | 'internal',
        purchaseDate: String(form.get('purchaseDate') ?? ''),
        qty: Number(form.get('qty') ?? 0),
        unit: selectedItem.unit,
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
      toast.success('Lot received.');
      router.push(`/inventory/lots/${lot.id}`);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to receive lot.'));
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
        Create a bottle (QR lot). <span className="text-foreground">Amount received</span> becomes
        starting stock on hand, in the catalog item&apos;s measuring unit. Lab-made reagents use Prep
        instead.
      </p>

      <form className="mt-4 max-w-2xl space-y-6" onSubmit={onSubmit}>
        <section className="space-y-3">
          <Meta>What & where</Meta>
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
              <select
                id="locationId"
                name="locationId"
                className={SELECT_CLASS}
                required
                defaultValue=""
              >
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
              <Input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                required
                defaultValue={todayIso()}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <Meta>Supplier</Meta>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="supplierName">Supplier</Label>
              <Input id="supplierName" name="supplierName" placeholder="Vendor or Internal" />
            </div>
            <div>
              <Label htmlFor="supplierType">Supplier type</Label>
              <select
                id="supplierType"
                name="supplierType"
                className={SELECT_CLASS}
                defaultValue="external"
              >
                <option value="external">External</option>
                <option value="internal">Internal</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <Meta>Stock for this bottle</Meta>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="qty">Amount received</Label>
              <Input id="qty" name="qty" type="number" min={0.0001} step="any" required />
              <p className="mt-1 text-xs text-muted">
                Starting stock on hand (e.g. 500 if the bottle holds 500{' '}
                {selectedItem?.unit || 'units'}).
              </p>
            </div>
            <div>
              <Label htmlFor="unit-display">Unit (from catalog)</Label>
              <Input
                id="unit-display"
                value={selectedItem?.unit ?? ''}
                readOnly
                placeholder="Select an item first"
                className="bg-surface text-muted"
              />
              <p className="mt-1 text-xs text-muted">
                Fixed by the catalog item so stock stays consistent.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="totalCost">Total cost</Label>
              <Input
                id="totalCost"
                name="totalCost"
                type="number"
                min={0}
                step="0.01"
                defaultValue={0}
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry date</Label>
              <Input id="expiryDate" name="expiryDate" type="date" />
            </div>
          </div>
          <div>
            <Label htmlFor="qtyChips">Kiosk qty chips (optional)</Label>
            <Input
              id="qtyChips"
              name="qtyChips"
              placeholder={
                selectedItem?.defaultQtyChips.length
                  ? formatQtyChips(selectedItem.defaultQtyChips)
                  : '0.1, 0.5, 1'
              }
              defaultValue={
                selectedItem?.defaultQtyChips.length
                  ? formatQtyChips(selectedItem.defaultQtyChips)
                  : ''
              }
              key={selectedItem?.id ?? 'chips'}
            />
            <p className="mt-1 text-xs text-muted">
              Quick-pick amounts on the scan card, in {selectedItem?.unit || 'the catalog unit'}.
              Defaults from the catalog item.
            </p>
          </div>
        </section>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isLoading || !selectedItem}>
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
