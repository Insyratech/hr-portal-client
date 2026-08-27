'use client';

import { PageHeader } from '@/components/layout/page-header';
import { LeavePresenceBoard } from '@/features/leave/leave-presence-board';
import { useGetLeaveApplicationsQuery } from '@/store/api/api';

export default function Page() {
  const { data } = useGetLeaveApplicationsQuery();
  return (
    <>
      <PageHeader kicker="Leave" title="Who’s out" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        See who is on leave. Approving requests is done by HR Manager.
      </p>
      <LeavePresenceBoard items={data?.data ?? []} reviewBase="/gm/leave-status" linkReviews={false} />
    </>
  );
}
