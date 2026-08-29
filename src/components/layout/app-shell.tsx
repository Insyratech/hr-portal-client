'use client';

import type { ReactNode } from 'react';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { EntityDrawer } from '@/components/dashboard/entity-drawer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CommandPalette } from '@/components/layout/command-palette';
import { ManagerBottomNav } from '@/components/layout/manager-bottom-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import type { ShellVariant } from '@/features/auth/role-access';

export function AppShell({
  variant,
  children,
}: {
  variant: ShellVariant;
  children: ReactNode;
}) {
  if (variant === 'employee') {
    return (
      <div className="min-h-screen bg-background">
        <Topbar variant="employee" />
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 md:px-8 lg:pb-16">{children}</main>
        <BottomNav />
        <ConfirmDialog />
        <EntityDrawer />
        <CommandPalette />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar variant={variant} />
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <Topbar variant={variant} />
        <main className="flex-1 px-4 py-8 pb-28 md:px-8 md:py-10 lg:pb-10">{children}</main>
        <ManagerBottomNav variant={variant} />
      </div>
      <ConfirmDialog />
      <EntityDrawer />
      <CommandPalette />
    </div>
  );
}
