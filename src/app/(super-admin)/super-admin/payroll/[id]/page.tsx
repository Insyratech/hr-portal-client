'use client';

import { useParams } from 'next/navigation';
import { PayrollRunPreview } from '@/features/payroll/payroll-run-preview';

export default function SuperAdminPayrollRunPage() {
  const params = useParams<{ id: string }>();
  return (
    <PayrollRunPreview
      runId={params.id}
      listHref="/super-admin/payroll"
      slipHref={(slipId) => `/super-admin/payroll/${params.id}/slips/${slipId}`}
      canManage={false}
    />
  );
}
