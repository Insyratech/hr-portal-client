'use client';

import { LeaveReviewPage } from '@/features/leave/leave-review-page';

export default function AdminLeaveReviewRoute() {
  return <LeaveReviewPage listHref="/admin/leaves" />;
}
