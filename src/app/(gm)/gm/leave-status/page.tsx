'use client';

import { PageHeader } from '@/components/layout/page-header';
import { LeavePresenceBoard } from '@/features/leave/leave-presence-board';

export default function Page() {
  return (
    <>
      <PageHeader kicker="Leave" title="Who’s out" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        See who is on leave by person. Pick a date for coverage that day, then upcoming approved and
        recent past leave. Approving requests is done by HR Manager.
      </p>
      <LeavePresenceBoard reviewBase="/gm/leave-status" linkReviews={false} />
    </>
  );
}
