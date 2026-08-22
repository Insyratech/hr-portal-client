'use client';

import { LeaveReviewPage } from '@/features/leave/leave-review-page';

export default function SuperAdminLeaveReviewRoute() {
  return <LeaveReviewPage listHref="/super-admin/leaves" />;
}
