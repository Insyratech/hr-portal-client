'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { homePathForRoles, isPathAllowed } from '@/features/auth/role-access';
import { useAppSelector } from '@/store/hooks';

export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!user) {
      const next = pathname === '/login' ? '' : `?next=${encodeURIComponent(pathname)}`;
      router.replace(`/login${next}`);
      return;
    }

    if (!isPathAllowed(user.roles, pathname)) {
      router.replace(homePathForRoles(user.roles));
    }
  }, [hydrated, pathname, router, user]);

  if (!hydrated || !user || !isPathAllowed(user.roles, pathname)) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingOverlay open message="We are almost there…" />
      </div>
    );
  }

  return children;
}
