'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import {
  SELECT_CLASS,
  formatCatalogItemLabel,
  formatQtyChips,
  parseQtyChipsInput,
} from '@/features/inventory/inventory-constants';
import {
  clearReceiveJourneyDraft,
  emptyReceiveJourneyDraft,
  loadReceiveJourneyDraft,
  saveReceiveJourneyDraft,
  type ReceiveJourneyDraft,
  type ReceiveJourneyStep,
} from '@/features/inventory/inventory-receive-draft';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useGetInventoryCatalogQuery,
  useGetInventoryCategoriesQuery,
  useGetInventoryCentralQrsQuery,
  useGetInventoryLocationsQuery,
  useReceiveInventoryLotMutation,
  useReceiveInventoryPlasticStockMutation,
} from '@/store/api/api';
import type { InventoryCategory, InventoryCatalogItem } from '@/types/api';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Reject non-numeric tokens; parseQtyChipsInput only filters them out. */
function validateQtyChipsField(raw: string, opts: { integers: boolean }): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/[,;\s]+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length > 15) return 'At most 15 qty chips are allowed.';
  const nums = parts.map((part) => Number(part));
  if (nums.some((n) => !Number.isFinite(n) || n <= 0)) {
    return opts.integers
      ? 'Box chips must be a comma-separated list of whole numbers.'
      : 'Qty chips must be a comma-separated list of positive numbers.';
  }
  if (opts.integers && nums.some((n) => !Number.isInteger(n))) {
    return 'Box qty chips must be whole numbers.';
  }
  return null;
}

const STEPS: Array<{ step: ReceiveJourneyStep; title: string; subtitle: string }> = [
  { step: 1, title: 'Usage area', subtitle: 'Area QR and category' },
  { step: 2, title: 'Item details', subtitle: 'Fields for this category' },
  { step: 3, title: 'Confirm', subtitle: 'Review and receive' },
];

export function InventoryReceiveJourneyPage() {
  const router = useRouter();
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canLots = permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);
  const canPlastic =
    permissions.includes(PERMISSIONS.INVENTORY_PLASTIC_MANAGE) || canLots;
  const canManage = canLots || canPlastic;

  const { data: catalogData } = useGetInventoryCatalogQuery(undefined, { skip: !canManage });
  const { data: categoriesData } = useGetInventoryCategoriesQuery(undefined, { skip: !canManage });
  const { data: locationsData } = useGetInventoryLocationsQuery(undefined, { skip: !canManage });
  const { data: centralData } = useGetInventoryCentralQrsQuery(undefined, { skip: !canManage });

  const [receiveLot, { isLoading: receivingLot }] = useReceiveInventoryLotMutation();
  const [receivePlastic, { isLoading: receivingPlastic }] = useReceiveInventoryPlasticStockMutation();

  const [draft, setDraft] = useState<ReceiveJourneyDraft>(() => emptyReceiveJourneyDraft(todayIso()));
  const [hydrated, setHydrated] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadReceiveJourneyDraft();
    if (saved) setDraft(saved);
    else setDraft(emptyReceiveJourneyDraft(todayIso()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveReceiveJourneyDraft(draft);
  }, [draft, hydrated]);

  const categories = useMemo(
    () => (categoriesData?.data ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [categoriesData?.data],
  );
  const locations = useMemo(
    () => (locationsData?.data ?? []).filter((item) => item.status === 'active'),
    [locationsData?.data],
  );
  const centralQrs = useMemo(
    () => (centralData?.data ?? []).filter((item) => item.status === 'active'),
    [centralData?.data],
  );

  const selectedCategory = categories.find((c) => c.id === draft.categoryId) ?? null;
  const isBox = selectedCategory?.deductionMode === 'box';
  const isMeasured = selectedCategory?.deductionMode === 'measured';

  const catalogItems = useMemo(() => {
    const items = (catalogData?.data ?? []).filter((item) => item.status === 'active');
    if (!draft.categoryId) return items;
    return items.filter((item) => item.categoryId === draft.categoryId);
  }, [catalogData?.data, draft.categoryId]);

  const selectedItem = catalogItems.find((item) => item.id === draft.catalogItemId) ?? null;
  const selectedRoom = centralQrs.find((room) => room.id === draft.centralQrId) ?? null;
  const selectedLocation = locations.find((loc) => loc.id === draft.locationId) ?? null;

  const isLoading = receivingLot || receivingPlastic;

  function patch(partial: Partial<ReceiveJourneyDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
    setStepError(null);
  }

  function validateStep1(): string | null {
    if (!draft.centralQrId) return 'Select a usage area.';
    if (!draft.categoryId) return 'Select a category.';
    if (!draft.locationId) return 'Select a shelf / location.';
    if (isBox && !canPlastic) return 'You cannot receive box categories.';
    if (isMeasured && !canLots) return 'You cannot receive measured categories.';
    return null;
  }

  function validateStep2(): string | null {
    if (!selectedCategory) return 'Select a category in step 1.';
    if (!draft.catalogItemId || !selectedItem) return 'Select a catalog item.';
    if (!draft.purchaseDate) return 'Purchase date is required.';
    if (isMeasured) {
      const qty = Number(draft.qty);
      if (!Number.isFinite(qty) || qty <= 0) return 'Amount received must be a positive number.';
      const chipsError = validateQtyChipsField(draft.qtyChips, { integers: false });
      if (chipsError) return chipsError;
    } else if (isBox) {
      const boxes = Math.trunc(Number(draft.boxes));
      if (!Number.isFinite(boxes) || boxes <= 0) return 'Boxes must be a positive whole number.';
      if (!draft.sizeLabel.trim()) return 'Size / attribute is required (e.g. L).';
      const chipsError = validateQtyChipsField(draft.qtyChips, { integers: true });
      if (chipsError) return chipsError;
    } else {
      return 'Unknown category type.';
    }
    return null;
  }

  function goNext() {
    if (draft.step === 1) {
      const error = validateStep1();
      if (error) {
        setStepError(error);
        return;
      }
      // Reset item when category changes path — keep catalog if still valid.
      if (selectedItem && selectedItem.categoryId !== draft.categoryId) {
        patch({ step: 2, catalogItemId: '', qtyChips: '' });
      } else {
        patch({
          step: 2,
          qtyChips:
            draft.qtyChips ||
            (selectedItem?.defaultQtyChips.length
              ? formatQtyChips(selectedItem.defaultQtyChips)
              : isBox
                ? '1, 2, 5'
                : ''),
        });
      }
      return;
    }
    if (draft.step === 2) {
      const error = validateStep2();
      if (error) {
        setStepError(error);
        return;
      }
      patch({ step: 3 });
    }
  }

  function goBack() {
    setStepError(null);
    if (draft.step === 2) patch({ step: 1 });
    if (draft.step === 3) patch({ step: 2 });
  }

  function onDismissConfirmed() {
    clearReceiveJourneyDraft();
    setCloseOpen(false);
    router.push('/inventory');
  }

  async function onSubmit() {
    const error = validateStep1() || validateStep2();
    if (error) {
      setStepError(error);
      return;
    }
    if (!selectedCategory || !selectedItem) return;

    try {
      if (isMeasured) {
        const chips = draft.qtyChips.trim() ? parseQtyChipsInput(draft.qtyChips) : undefined;
        const created = await receiveLot({
          catalogItemId: selectedItem.id,
          locationId: draft.locationId,
          centralQrId: draft.centralQrId,
          supplierName: draft.supplierName.trim(),
          supplierType: draft.supplierType,
          purchaseDate: draft.purchaseDate,
          qty: Number(draft.qty),
          unit: selectedItem.unit,
          totalCost: Number(draft.totalCost) || 0,
          expiryDate: draft.expiryDate.trim() || null,
          openedOn: draft.openedOn.trim() || null,
          qtyChips: chips,
          notes: draft.notes.trim(),
        }).unwrap();
        clearReceiveJourneyDraft();
        toast.success(`Received and attached to ${selectedRoom?.name ?? 'usage area'}.`);
        router.push(`/inventory/lots/${created.data.id}`);
        return;
      }

      const chipsRaw = draft.qtyChips.trim();
      let chips: number[] | undefined;
      if (chipsRaw) {
        chips = parseQtyChipsInput(chipsRaw).map((n) => Math.trunc(n));
      }
      const created = await receivePlastic({
        catalogItemId: selectedItem.id,
        locationId: draft.locationId,
        centralQrId: draft.centralQrId,
        manufacturer: draft.manufacturer.trim(),
        sizeLabel: draft.sizeLabel.trim(),
        boxes: Math.trunc(Number(draft.boxes)),
        totalCost: Number(draft.totalCost) || 0,
        supplierName: draft.supplierName.trim(),
        supplierType: draft.supplierType,
        purchaseDate: draft.purchaseDate,
        qtyChips: chips,
        notes: draft.notes.trim(),
      }).unwrap();
      clearReceiveJourneyDraft();
      toast.success(`Boxes received and attached to ${selectedRoom?.name ?? 'usage area'}.`);
      router.push(`/inventory/plastic/${created.data.id}`);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to receive stock.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Receive" />
        <p className="text-sm text-muted">You need lots or plastic manage permission.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={isLoading || !hydrated} />
      <div className="mb-4 flex items-start justify-between gap-3">
        <PageHeader kicker="Inventory" title="Receive" />
        <button
          type="button"
          aria-label="Close receive form"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-lg leading-none text-muted transition-colors hover:bg-surface hover:text-foreground"
          onClick={() => setCloseOpen(true)}
        >
          ×
        </button>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        One receive journey for every category. Choose the usage area first — stock attaches there for
        scanning. Shelf placement is set separately. No per-bottle QR is printed.
      </p>

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="rounded border border-border bg-surface/40 p-4">
          <Meta>Journey</Meta>
          <ol className="mt-4 space-y-4">
            {STEPS.map((item) => {
              const done = draft.step > item.step;
              const active = draft.step === item.step;
              return (
                <li key={item.step} className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      active
                        ? 'bg-foreground text-background'
                        : done
                          ? 'border border-foreground text-foreground'
                          : 'border border-border text-muted'
                    }`}
                  >
                    {done ? '✓' : item.step}
                  </span>
                  <div>
                    <p className={`text-sm font-medium ${active ? 'text-foreground' : 'text-muted'}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-muted">{item.subtitle}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="rounded border border-border p-5 sm:p-6">
          {draft.step === 1 ? (
            <StepDestination
              draft={draft}
              categories={categories}
              locations={locations}
              centralQrs={centralQrs}
              onChange={patch}
            />
          ) : null}

          {draft.step === 2 && selectedCategory ? (
            <StepDetails
              draft={draft}
              category={selectedCategory}
              catalogItems={catalogItems}
              selectedItem={selectedItem}
              onChange={patch}
              onSelectCatalog={(item) =>
                patch({
                  catalogItemId: item.id,
                  qtyChips: item.defaultQtyChips.length
                    ? formatQtyChips(item.defaultQtyChips)
                    : selectedCategory.deductionMode === 'box'
                      ? '1, 2, 5'
                      : '',
                })
              }
            />
          ) : null}

          {draft.step === 2 && !selectedCategory ? (
            <p className="text-sm text-danger">
              Category is missing or inactive. Go back and choose a category again.
            </p>
          ) : null}

          {draft.step === 3 ? (
            <StepReview
              draft={draft}
              category={selectedCategory}
              item={selectedItem}
              roomName={selectedRoom?.name ?? '—'}
              locationLabel={
                selectedLocation ? `${selectedLocation.name} (${selectedLocation.code})` : '—'
              }
            />
          ) : null}

          {stepError ? <p className="mt-4 text-sm text-danger">{stepError}</p> : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              {draft.step > 1 ? (
                <Button type="button" variant="outline" onClick={goBack} disabled={isLoading}>
                  Back
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => setCloseOpen(true)}>
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {draft.step < 3 ? (
                <Button type="button" onClick={goNext}>
                  Continue
                </Button>
              ) : (
                <Button type="button" disabled={isLoading} onClick={() => void onSubmit()}>
                  {isLoading ? 'Receiving…' : 'Receive & attach to usage area'}
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent showClose={false}>
          <DialogTitle>Discard receive draft?</DialogTitle>
          <DialogDescription>
            Closing clears the saved draft. Refresh keeps your progress; confirming close erases it.
          </DialogDescription>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCloseOpen(false)}>
              Keep editing
            </Button>
            <Button type="button" onClick={onDismissConfirmed}>
              Discard & close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StepDestination({
  draft,
  categories,
  locations,
  centralQrs,
  onChange,
}: {
  draft: ReceiveJourneyDraft;
  categories: InventoryCategory[];
  locations: Array<{ id: string; name: string; code: string }>;
  centralQrs: Array<{ id: string; name: string }>;
  onChange: (partial: Partial<ReceiveJourneyDraft>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-medium">Usage area</h2>
        <p className="mt-1 text-sm text-muted">
          Pick which usage area this stock attaches to for scanning, then the category. Shelf /
          location is where it sits physically.
        </p>
      </div>
      <div>
        <Label htmlFor="centralQrId">Usage area</Label>
        <select
          id="centralQrId"
          className={SELECT_CLASS}
          value={draft.centralQrId}
          onChange={(event) => onChange({ centralQrId: event.target.value })}
        >
          <option value="">Select usage area</option>
          {centralQrs.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          className={SELECT_CLASS}
          value={draft.categoryId}
          onChange={(event) =>
            onChange({
              categoryId: event.target.value,
              catalogItemId: '',
              qtyChips: '',
              qty: '',
              boxes: '',
              sizeLabel: '',
              manufacturer: '',
            })
          }
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} ({category.deductionMode})
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="locationId">Shelf / location</Label>
        <select
          id="locationId"
          className={SELECT_CLASS}
          value={draft.locationId}
          onChange={(event) => onChange({ locationId: event.target.value })}
        >
          <option value="">Select location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name} ({location.code})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function StepDetails({
  draft,
  category,
  catalogItems,
  selectedItem,
  onChange,
  onSelectCatalog,
}: {
  draft: ReceiveJourneyDraft;
  category: InventoryCategory;
  catalogItems: InventoryCatalogItem[];
  selectedItem: InventoryCatalogItem | null;
  onChange: (partial: Partial<ReceiveJourneyDraft>) => void;
  onSelectCatalog: (item: InventoryCatalogItem) => void;
}) {
  const isBox = category.deductionMode === 'box';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-medium">{category.name}</h2>
        <p className="mt-1 text-sm text-muted">
          {isBox
            ? 'Box stock — enter boxes, size, and manufacturer. Attaches to the usage area from step 1.'
            : 'Measured stock — enter amount in the catalog unit. Attaches to the usage area from step 1.'}
        </p>
      </div>

      <div>
        <Label htmlFor="catalogItemId">Catalog item</Label>
        <select
          id="catalogItemId"
          className={SELECT_CLASS}
          value={draft.catalogItemId}
          onChange={(event) => {
            const item = catalogItems.find((row) => row.id === event.target.value);
            if (item) onSelectCatalog(item);
            else onChange({ catalogItemId: '' });
          }}
        >
          <option value="">Select item</option>
          {catalogItems.map((item) => (
            <option key={item.id} value={item.id}>
              {formatCatalogItemLabel(item, { withUnit: true })}
            </option>
          ))}
        </select>
        {catalogItems.length === 0 ? (
          <p className="mt-1 text-xs text-muted">No active catalog items in this category yet.</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="purchaseDate">Purchase date</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={draft.purchaseDate}
            onChange={(event) => onChange({ purchaseDate: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="totalCost">Total cost</Label>
          <Input
            id="totalCost"
            type="number"
            min={0}
            step="0.01"
            value={draft.totalCost}
            onChange={(event) => onChange({ totalCost: event.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="supplierName">Supplier</Label>
          <Input
            id="supplierName"
            value={draft.supplierName}
            onChange={(event) => onChange({ supplierName: event.target.value })}
            placeholder="Vendor or Internal"
          />
        </div>
        <div>
          <Label htmlFor="supplierType">Supplier type</Label>
          <select
            id="supplierType"
            className={SELECT_CLASS}
            value={draft.supplierType}
            onChange={(event) =>
              onChange({
                supplierType: event.target.value === 'internal' ? 'internal' : 'external',
              })
            }
          >
            <option value="external">External</option>
            <option value="internal">Internal</option>
          </select>
        </div>
      </div>

      {isBox ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={draft.manufacturer}
                onChange={(event) => onChange({ manufacturer: event.target.value })}
                placeholder="Brand"
              />
            </div>
            <div>
              <Label htmlFor="sizeLabel">Size / attr</Label>
              <Input
                id="sizeLabel"
                value={draft.sizeLabel}
                onChange={(event) => onChange({ sizeLabel: event.target.value })}
                placeholder="L / M / 10µl"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="boxes">Boxes</Label>
              <Input
                id="boxes"
                type="number"
                min={1}
                step={1}
                value={draft.boxes}
                onChange={(event) => onChange({ boxes: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="qtyChips">Box chips</Label>
              <Input
                id="qtyChips"
                value={draft.qtyChips}
                onChange={(event) => onChange({ qtyChips: event.target.value })}
                placeholder="1, 2, 5"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="qty">Amount received</Label>
              <Input
                id="qty"
                type="number"
                min={0.0001}
                step="any"
                value={draft.qty}
                onChange={(event) => onChange({ qty: event.target.value })}
              />
              <p className="mt-1 text-xs text-muted">
                Starting stock on hand in {selectedItem?.unit || 'catalog unit'}.
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
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="expiryDate">Expiry date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={draft.expiryDate}
                onChange={(event) => onChange({ expiryDate: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="openedOn">Opened date</Label>
              <Input
                id="openedOn"
                type="date"
                value={draft.openedOn}
                onChange={(event) => onChange({ openedOn: event.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="qtyChips">Kiosk qty chips (optional)</Label>
            <Input
              id="qtyChips"
              value={draft.qtyChips}
              onChange={(event) => onChange({ qtyChips: event.target.value })}
              placeholder={
                selectedItem?.defaultQtyChips.length
                  ? formatQtyChips(selectedItem.defaultQtyChips)
                  : '0.1, 0.5, 1'
              }
            />
          </div>
        </>
      )}

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={draft.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </div>
    </div>
  );
}

function StepReview({
  draft,
  category,
  item,
  roomName,
  locationLabel,
}: {
  draft: ReceiveJourneyDraft;
  category: InventoryCategory | null;
  item: InventoryCatalogItem | null;
  roomName: string;
  locationLabel: string;
}) {
  const isBox = category?.deductionMode === 'box';
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Confirm receive</h2>
        <p className="mt-1 text-sm text-muted">
          Stock will attach to <span className="text-foreground">{roomName}</span>. Usage is recorded
          by scanning that usage area QR.
        </p>
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Usage area</dt>
          <dd>{roomName}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Shelf</dt>
          <dd>{locationLabel}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Category</dt>
          <dd>{category?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Item</dt>
          <dd>{item ? formatCatalogItemLabel(item, { withUnit: true }) : '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Purchase date</dt>
          <dd>{draft.purchaseDate || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Supplier</dt>
          <dd>
            {draft.supplierName || '—'} ({draft.supplierType})
          </dd>
        </div>
        {isBox ? (
          <>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Boxes</dt>
              <dd>{draft.boxes || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Size</dt>
              <dd>
                {draft.sizeLabel || '—'}
                {draft.manufacturer ? ` · ${draft.manufacturer}` : ''}
              </dd>
            </div>
          </>
        ) : (
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Amount</dt>
            <dd>
              {draft.qty || '—'} {item?.unit ?? ''}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Total cost</dt>
          <dd>{draft.totalCost || '0'}</dd>
        </div>
      </dl>
    </div>
  );
}
