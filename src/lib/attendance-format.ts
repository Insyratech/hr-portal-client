export function formatClock(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDuration(minutes: number | null | undefined, sinceIso?: string | null): string | null {
  if (minutes != null) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${String(mins).padStart(2, '0')}m`;
  }
  if (!sinceIso) return null;
  const start = new Date(sinceIso).getTime();
  if (Number.isNaN(start)) return null;
  const elapsed = Math.max(0, Math.floor((Date.now() - start) / 60_000));
  const hours = Math.floor(elapsed / 60);
  const mins = elapsed % 60;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
}
