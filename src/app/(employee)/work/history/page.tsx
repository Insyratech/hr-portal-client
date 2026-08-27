'use client';

import { PageLoading } from '@/components/ui/page-loading';
import { Suspense } from 'react';
import { WorkHistoryPage } from '@/features/work/work-history-page';

export default function Page() {
  return (
    <Suspense fallback={<PageLoading compact message="Loading…" />}>
      <WorkHistoryPage />
    </Suspense>
  );
}
