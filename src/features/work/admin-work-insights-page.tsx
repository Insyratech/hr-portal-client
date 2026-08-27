'use client';

import { PageHeader } from '@/components/layout/page-header';
import { WorkAnalyticsPanel } from '@/features/work/work-analytics-panel';
import type { WorkAttentionLabel } from '@/types/api';

/** Route Needs attention into the desk that can act on the flag. */
export function attentionHrefForCso(employeeId: string, labels: WorkAttentionLabel[]): string {
  const codes = new Set(labels.map((label) => label.code));
  const id = encodeURIComponent(employeeId);
  if (
    codes.has('LOW_COMPLIANCE') &&
    !codes.has('NO_WEEK_PLAN') &&
    !codes.has('PRIORITIES_BLOCKED') &&
    !codes.has('HEAVY_CARRY')
  ) {
    return `/cso/work?employeeId=${id}&today=pending`;
  }
  if (codes.has('OPEN_BLOCKER') && !codes.has('NO_WEEK_PLAN') && !codes.has('PRIORITIES_BLOCKED')) {
    return `/cso/work?employeeId=${id}&today=blockers`;
  }
  return `/cso/work/priorities?employeeId=${id}`;
}

export function AdminWorkInsightsPage({
  employeeBasePath,
  employeeHref,
}: {
  employeeBasePath?: string;
  employeeHref?: (employeeId: string, labels: WorkAttentionLabel[]) => string;
}) {
  return (
    <>
      <PageHeader kicker="Work" title="Insights" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Reliability, execution, adaptability, and development over time. Indicators only — not a score or leaderboard.
      </p>
      <WorkAnalyticsPanel employeeBasePath={employeeBasePath} employeeHref={employeeHref} />
    </>
  );
}
