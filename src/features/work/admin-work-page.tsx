'use client';

import { PageLoading } from '@/components/ui/page-loading';
import { Suspense } from 'react';
import { AdminTeamWeek } from '@/features/work/admin-team-week';

export function AdminWorkPage({
  employeeBasePath,
  employeeHref,
}: {
  employeeBasePath?: string;
  employeeHref?: (employeeId: string) => string;
}) {
  return (
    <Suspense fallback={<PageLoading compact message="Loading…" />}>
      <AdminTeamWeek employeeBasePath={employeeBasePath} employeeHref={employeeHref} />
    </Suspense>
  );
}
