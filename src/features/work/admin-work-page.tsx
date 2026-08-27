'use client';

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
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <AdminTeamWeek employeeBasePath={employeeBasePath} employeeHref={employeeHref} />
    </Suspense>
  );
}
