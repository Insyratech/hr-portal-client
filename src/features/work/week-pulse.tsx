'use client';

import { Meta } from '@/components/layout/meta';
import type { WorkOverview } from '@/types/api';

export function WorkIndicators({ indicators }: { indicators: WorkOverview['indicators'] }) {
  const items = [
    { label: 'Done', value: `${indicators.completionPct}%` },
    { label: 'Updates', value: `${indicators.compliancePct}%` },
    { label: 'Planned', value: String(indicators.plannedCount) },
    { label: 'Unplanned', value: String(indicators.unplannedCount) },
    { label: 'Carried', value: String(indicators.carryForwardCount) },
  ];
  return (
    <section className="border border-border bg-background p-5 shadow-card">
      <Meta>This week at a glance</Meta>
      <p className="mt-2 text-sm text-muted">Updates skip leave and holidays. These are indicators, not a score.</p>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-xs uppercase tracking-[0.2em] text-muted">{item.label}</dt>
            <dd className="mt-1 text-lg font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function FridaySummary({ friday }: { friday: NonNullable<WorkOverview['friday']> }) {
  return (
    <section className="border border-border bg-background p-5 shadow-card">
      <Meta>Week wrap-up</Meta>
      <p className="mt-2 text-sm">
        {friday.done} of {friday.total} priorities finished
        {friday.carried ? ` · ${friday.carried} carried forward` : ''}.
      </p>
      {friday.unplanned.length > 0 ? (
        <p className="mt-3 text-sm text-muted">Unplanned: {friday.unplanned.join(' · ')}</p>
      ) : (
        <p className="mt-3 text-sm text-muted">No unplanned work logged.</p>
      )}
      {friday.blockers.length > 0 ? (
        <p className="mt-2 text-sm text-muted">Blockers: {friday.blockers.join(' · ')}</p>
      ) : (
        <p className="mt-2 text-sm text-muted">No open blockers.</p>
      )}
      <p className="mt-3 text-sm text-muted">Built from what you already logged. Nothing else to fill in.</p>
    </section>
  );
}
