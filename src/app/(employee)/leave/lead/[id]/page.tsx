'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { ProjectLeadReviewCard } from '@/features/leave/project-lead-review-card';
import { useGetLeaveApplicationQuery } from '@/store/api/api';

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const { data, isLoading, isError } = useGetLeaveApplicationQuery(id, { skip: !id });

  return (
    <div className="space-y-6">
      <PageHeader kicker="Leave" title="Project lead review" />
      {isLoading ? <p className="text-sm text-muted">Loading…</p> : null}
      {isError || (!isLoading && !data?.data) ? (
        <p className="text-sm text-muted">This leave request is not available for project-lead review.</p>
      ) : null}
      {data?.data ? <ProjectLeadReviewCard application={data.data} highlight /> : null}
    </div>
  );
}
