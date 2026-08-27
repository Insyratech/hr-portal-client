'use client';

import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 transition-colors duration-300">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
