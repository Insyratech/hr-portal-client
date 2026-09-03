'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageLoading } from '@/components/ui/page-loading';
import { ShiftChangeLeadReviewCard } from '@/features/shift-changes/shift-change-lead-review-card';
import { useGetShiftChangeLeadInboxQuery } from '@/store/api/api';

export default function ShiftChangeLeadPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useGetShiftChangeLeadInboxQuery();
  const row = (data?.data ?? []).find((item) => item.id === params.id);

  if (isLoading) {
    return <PageLoading message="Loading request…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader kicker="Shift change" title="Project lead review" />
      {row ? (
        <ShiftChangeLeadReviewCard row={row} />
      ) : (
        <p className="text-sm text-muted">This request is not waiting for your approval, or it was already handled.</p>
      )}
    </div>
  );
}
