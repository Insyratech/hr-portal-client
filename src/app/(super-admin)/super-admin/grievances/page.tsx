'use client';

import { Suspense } from 'react';
import { GrievancesQueuePage } from '@/features/grievances/grievances-queue-page';

export default function SuperAdminGrievancesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading</p>}>
      <GrievancesQueuePage />
    </Suspense>
  );
}
