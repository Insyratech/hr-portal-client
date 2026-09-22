export const SELECT_CLASS =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm';

export const LOCATION_TYPES: readonly { value: string; label: string }[] = [
  { value: 'stock_room', label: 'Stock room' },
  { value: 'store', label: 'Store' },
  { value: 'bench', label: 'Bench' },
  { value: 'freezer', label: 'Freezer' },
  { value: 'other', label: 'Other' },
];

export const ALERT_MODES: readonly { value: string; label: string }[] = [
  { value: 'reorder', label: 'Reorder qty' },
  { value: 'velocity', label: 'Usage velocity (days left)' },
  { value: 'both', label: 'Both' },
];

export function slugifyLocationType(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

export function humanizeLocationType(value: string): string {
  const preset = LOCATION_TYPES.find((item) => item.value === value);
  if (preset) return preset.label;
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function parseQtyChipsInput(raw: string): number[] {
  return raw
    .split(/[,;\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part))
    .filter((value) => Number.isFinite(value) && value > 0);
}

export function formatQtyChips(chips: number[]): string {
  return chips.join(', ');
}
