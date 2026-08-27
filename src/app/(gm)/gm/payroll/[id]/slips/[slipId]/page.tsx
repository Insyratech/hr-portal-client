'use client';

import { useParams } from 'next/navigation';
import { PayslipPage } from '@/features/payroll/payslip-page';

export default function Page() {
  const params = useParams<{ id: string; slipId: string }>();
  return (
    <PayslipPage
      slipId={params.slipId}
      backHref={`/gm/payroll/${params.id}`}
      backLabel="Back to run"
    />
  );
}
