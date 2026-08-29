'use client';

import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { EMPLOYEE_NAV } from '@/constants/nav';

export function BottomNav() {
  return <MobileBottomNav items={EMPLOYEE_NAV} />;
}
