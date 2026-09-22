import type { InventoryReportPeriod } from '@/types/api';

export type InventoryReportQuery = {
  period?: InventoryReportPeriod;
  from?: string;
  to?: string;
};

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function utcToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function inventoryMonthRange(offsetMonths = 0): { from: string; to: string } {
  const today = utcToday();
  const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offsetMonths, 1));
  const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offsetMonths + 1, 0));
  return { from: toIso(from), to: toIso(to) };
}

export const INVENTORY_PERIOD_OPTIONS: Array<{
  value: InventoryReportPeriod | 'last_month';
  label: string;
}> = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'quarter', label: 'This quarter' },
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

export function queryFromPeriodSelection(
  selection: InventoryReportPeriod | 'last_month',
  customFrom: string,
  customTo: string,
): InventoryReportQuery {
  if (selection === 'last_month') {
    const range = inventoryMonthRange(-1);
    return { from: range.from, to: range.to };
  }
  if (selection === 'custom') {
    return { from: customFrom, to: customTo };
  }
  return { period: selection };
}
