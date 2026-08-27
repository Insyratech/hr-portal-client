'use client';

import { Suspense } from 'react';
import { WorkHistoryPage } from '@/features/work/work-history-page';

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <WorkHistoryPage />
    </Suspense>
  );
}
