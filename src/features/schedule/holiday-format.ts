/** Shared holiday helpers for dashboard schedule cards. */

export type HolidayRow = {
  name: string;
  date: string;
  optional: boolean;
  type?: string;
};

export function upcomingHolidays(rows: HolidayRow[], today: string, limit = 4): HolidayRow[] {
  return [...rows]
    .filter((row) => row.date.slice(0, 10) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

/** Short weekday + day month, e.g. "Mon · 14 Sep". */
export function formatHolidayWhen(isoDate: string): string {
  const date = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate.slice(0, 10);
  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  const dayMonth = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return `${weekday} · ${dayMonth}`;
}

export function daysUntil(isoDate: string, today: string): number {
  const start = new Date(`${today}T12:00:00`).getTime();
  const end = new Date(`${isoDate.slice(0, 10)}T12:00:00`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

export function daysUntilLabel(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}
