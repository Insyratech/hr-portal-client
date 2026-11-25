import type { NavItem } from '@/constants/nav';

/**
 * Soft client gate for showing the Sandip-only payslip playground entry points.
 * Backend still enforces employee_code ID2025009 + name on every API call.
 */
export const PAYSLIP_PLAYGROUND_PATH = '/payslips/playground';

export const PAYSLIP_PLAYGROUND_FULL_NAME = 'Sandip Kumar Yadav';

export const PAYSLIP_PLAYGROUND_NAV_ITEM: NavItem = {
  href: PAYSLIP_PLAYGROUND_PATH,
  label: 'Payslip playground',
  icon: 'file',
};

export function isPayslipPlaygroundViewer(fullName: string | null | undefined): boolean {
  return (fullName ?? '').trim() === PAYSLIP_PLAYGROUND_FULL_NAME;
}

/** Pay & docs nav with playground inserted after Payslips for Sandip only. */
export function payDocsNavForViewer(
  base: readonly NavItem[],
  fullName: string | null | undefined,
): readonly NavItem[] {
  if (!isPayslipPlaygroundViewer(fullName)) return base;
  const out: NavItem[] = [];
  for (const item of base) {
    out.push(item);
    if (item.href === '/payslips') out.push(PAYSLIP_PLAYGROUND_NAV_ITEM);
  }
  return out;
}
