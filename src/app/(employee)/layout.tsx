import type { ReactNode } from 'react';
import { RoleAwareAppShell } from '@/components/layout/role-aware-app-shell';
import { RouteGuard } from '@/features/auth/route-guard';

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard>
      <RoleAwareAppShell>{children}</RoleAwareAppShell>
    </RouteGuard>
  );
}
