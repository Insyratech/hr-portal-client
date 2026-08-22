import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { RouteGuard } from '@/features/auth/route-guard';

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard>
      <AppShell variant="super-admin">{children}</AppShell>
    </RouteGuard>
  );
}
