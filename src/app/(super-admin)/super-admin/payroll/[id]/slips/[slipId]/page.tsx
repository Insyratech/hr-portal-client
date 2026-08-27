'use client';

import { useParams } from 'next/navigation';
import { PayslipPage } from '@/features/payroll/payslip-page';

export default function SuperAdminPayslipRoute() {
  const params = useParams<{ id: string; slipId: string }>();
  return (
    <PayslipPage
      slipId={params.slipId}
      backHref={`/super-admin/payroll/${params.id}`}
      backLabel="Back to run"
    />
  );
}
