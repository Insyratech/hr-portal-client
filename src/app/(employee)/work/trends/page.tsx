'use client';

import { PageHeader } from '@/components/layout/page-header';
import { WorkAnalyticsPanel } from '@/features/work/work-analytics-panel';
import { useAppSelector } from '@/store/hooks';

export default function WorkTrendsPage() {
  const employeeId = useAppSelector((state) => state.auth.user?.employeeId ?? undefined);
  return (
    <>
      <PageHeader kicker="Work" title="Trends" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Your reliability, execution, adaptability, and development over time. Indicators only — not a score.
      </p>
      {employeeId ? <WorkAnalyticsPanel fixedEmployeeId={employeeId} /> : null}
    </>
  );
}
