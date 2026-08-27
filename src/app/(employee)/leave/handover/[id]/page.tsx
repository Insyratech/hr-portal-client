'use client';

import { useParams } from 'next/navigation';
import { PageLoading } from '@/components/ui/page-loading';
import { PageHeader } from '@/components/layout/page-header';
import { HandoverReviewCard } from '@/features/leave/handover-review-card';
import { StatusMessage } from '@/components/ui/status-message';
import { apiErrorMessage } from '@/lib/api-error';
import { useGetLeaveApplicationQuery } from '@/store/api/api';

export default function LeaveHandoverPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, isError, error } = useGetLeaveApplicationQuery(id);

  return (
    <>
      <PageHeader kicker="Leave" title="Review and accept" />
      {isLoading ? <PageLoading compact message="Loading handover request…" /> : null}
      {isError ? <StatusMessage tone="danger">{apiErrorMessage(error, 'Unable to load this leave request.')}</StatusMessage> : null}
      {data?.data ? <HandoverReviewCard application={data.data} highlight /> : null}
    </>
  );
}
