'use client';

import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { shellBottomNavItems } from '@/components/layout/shell-nav-items';
import type { ShellVariant } from '@/features/auth/role-access';

export function ManagerBottomNav({ variant }: { variant: Exclude<ShellVariant, 'employee'> }) {
  return <MobileBottomNav items={shellBottomNavItems(variant)} />;
}
