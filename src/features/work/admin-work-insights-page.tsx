'use client';

import { PageHeader } from '@/components/layout/page-header';
import { WorkAnalyticsPanel } from '@/features/work/work-analytics-panel';

export function AdminWorkInsightsPage({ employeeBasePath }: { employeeBasePath?: string }) {
  return (
    <>
      <PageHeader kicker="Work" title="Insights" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Reliability, execution, adaptability, and development over time. Indicators only — not a score or leaderboard.
      </p>
      <WorkAnalyticsPanel employeeBasePath={employeeBasePath} />
    </>
  );
}
