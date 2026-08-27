'use client';

import { AdminWorkInsightsPage, attentionHrefForCso } from '@/features/work/admin-work-insights-page';

export default function Page() {
  return <AdminWorkInsightsPage employeeHref={attentionHrefForCso} />;
}
