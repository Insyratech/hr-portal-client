'use client';

import { useParams } from 'next/navigation';
import { PayrollRunPreview } from '@/features/payroll/payroll-run-preview';

export default function Page() {
  const params = useParams<{ id: string }>();
  return (
    <PayrollRunPreview
      runId={params.id}
      listHref="/hr/salary-slips"
      slipHref={(slipId) => `/hr/salary-slips/${params.id}/slips/${slipId}`}
      canManage={false}
      backLabel="Back to published salary slips"
    />
  );
}
