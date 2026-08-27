'use client';

import { Suspense } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { GrievancesQueuePage } from '@/features/grievances/grievances-queue-page';

export default function HrGrievancesPage() {
  return (
    <Suspense fallback={<PageLoading compact message="Loading…" />}>
      <GrievancesQueuePage />
    </Suspense>
  );
}
