'use client';

import { useParams } from 'next/navigation';
import { PayslipPage } from '@/features/payroll/payslip-page';

export default function Page() {
  const params = useParams<{ id: string; slipId: string }>();
  return (
    <PayslipPage
      slipId={params.slipId}
      backHref={`/hr/salary-slips/${params.id}`}
      backLabel="Back to month slips"
    />
  );
}
