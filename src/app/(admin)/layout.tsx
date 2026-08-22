import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { RouteGuard } from '@/features/auth/route-guard';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard>
      <AppShell variant="admin">{children}</AppShell>
    </RouteGuard>
  );
}
