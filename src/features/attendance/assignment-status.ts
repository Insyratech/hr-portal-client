/** Label for shift / work-week assignment effective-to column. */
export function formatAssignmentStatus(effectiveTo: string | null | undefined): string {
  if (!effectiveTo) return 'Current';
  return `Until ${effectiveTo}`;
}

export function sortAssignmentsCurrentFirst<T extends { effectiveFrom: string; effectiveTo?: string | null }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const aCurrent = !a.effectiveTo ? 1 : 0;
    const bCurrent = !b.effectiveTo ? 1 : 0;
    if (aCurrent !== bCurrent) return bCurrent - aCurrent;
    return b.effectiveFrom.localeCompare(a.effectiveFrom);
  });
}
