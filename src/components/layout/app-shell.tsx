'use client';

import type { ReactNode } from 'react';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { EntityDrawer } from '@/components/dashboard/entity-drawer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { CommandPalette } from '@/components/layout/command-palette';
import { MobileSectionNav } from '@/components/layout/mobile-section-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export function AppShell({
  variant,
  children,
}: {
  variant: 'employee' | 'admin' | 'super-admin';
  children: ReactNode;
}) {
  if (variant === 'employee') {
    return (
      <div className="min-h-screen bg-background">
        <Topbar variant="employee" />
        <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 md:px-8 md:pb-16">{children}</main>
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
        <MobileSectionNav variant={variant} />
        <main className="flex-1 px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
      <ConfirmDialog />
      <EntityDrawer />
      <CommandPalette />
    </div>
  );
}
