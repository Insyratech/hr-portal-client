/** Mirrors Backend skipsWorkApprovalLoop — SA / HR / GM / Finance skip personal work loop. CSO still participates. */
export function skipsWorkApprovalLoop(roles: readonly string[]): boolean {
  if (roles.includes('SUPER_ADMIN')) return true;
  if (roles.includes('HR_MANAGER')) return true;
  if (roles.includes('GENERAL_MANAGER') || roles.includes('ADMIN')) return true;
  if (roles.includes('FINANCE_MANAGER')) return true;
  return false;
}

const WORK_LOOP_HREFS = new Set([
  '/work',
  '/work/priorities',
  '/work/weekly-update',
  '/work/trends',
  '/work/history',
]);

export function isWorkLoopNavHref(href: string): boolean {
  return WORK_LOOP_HREFS.has(href);
}
