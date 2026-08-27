import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { RouteGuard } from '@/features/auth/route-guard';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard>
      <AppShell variant="cso">{children}</AppShell>
    </RouteGuard>
  );
}
