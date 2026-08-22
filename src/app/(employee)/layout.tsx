import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { RouteGuard } from '@/features/auth/route-guard';

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard>
      <AppShell variant="employee">{children}</AppShell>
    </RouteGuard>
  );
}
