'use client';

import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { shellVariantForRoles } from '@/features/auth/role-access';
import { useAppSelector } from '@/store/hooks';

export function RoleAwareAppShell({ children }: { children: ReactNode }) {
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  return <AppShell variant={shellVariantForRoles(roles)}>{children}</AppShell>;
}
