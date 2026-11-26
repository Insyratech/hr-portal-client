/** Local draft for the unified inventory receive journey. Survives refresh until dismissed. */

export const RECEIVE_JOURNEY_DRAFT_KEY = 'inventory-receive-journey-draft-v1';

export type ReceiveJourneyStep = 1 | 2 | 3;

export type ReceiveJourneyDraft = {
  step: ReceiveJourneyStep;
  centralQrId: string;
  categoryId: string;
  locationId: string;
  catalogItemId: string;
  purchaseDate: string;
  supplierName: string;
  supplierType: 'external' | 'internal';
  qty: string;
  totalCost: string;
  expiryDate: string;
  openedOn: string;
  qtyChips: string;
  notes: string;
  manufacturer: string;
  sizeLabel: string;
  boxes: string;
};

export function emptyReceiveJourneyDraft(purchaseDate = ''): ReceiveJourneyDraft {
  return {
    step: 1,
    centralQrId: '',
    categoryId: '',
    locationId: '',
    catalogItemId: '',
    purchaseDate,
    supplierName: '',
    supplierType: 'external',
    qty: '',
    totalCost: '0',
    expiryDate: '',
    openedOn: '',
    qtyChips: '',
    notes: '',
    manufacturer: '',
    sizeLabel: '',
    boxes: '',
  };
}

export function loadReceiveJourneyDraft(): ReceiveJourneyDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(RECEIVE_JOURNEY_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ReceiveJourneyDraft>;
    if (!parsed || typeof parsed !== 'object') return null;
    const base = emptyReceiveJourneyDraft();
    return {
      ...base,
      ...parsed,
      step: parsed.step === 2 || parsed.step === 3 ? parsed.step : 1,
      supplierType: parsed.supplierType === 'internal' ? 'internal' : 'external',
    };
  } catch {
    return null;
  }
}

export function saveReceiveJourneyDraft(draft: ReceiveJourneyDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RECEIVE_JOURNEY_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Quota / private mode — journey still works in-memory.
  }
}

export function clearReceiveJourneyDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(RECEIVE_JOURNEY_DRAFT_KEY);
  } catch {
    // ignore
  }
}
