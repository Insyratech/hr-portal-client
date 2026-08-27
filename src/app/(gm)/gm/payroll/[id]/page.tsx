'use client';

import { useParams } from 'next/navigation';
import { PayrollRunPreview } from '@/features/payroll/payroll-run-preview';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export default function Page() {
  const params = useParams<{ id: string }>();
  const canManage = useAppSelector((state) => state.permissions.permissions.includes(PERMISSIONS.PAYROLL_MANAGE));
  return (
    <PayrollRunPreview
      runId={params.id}
      listHref="/gm/payroll"
      slipHref={(slipId) => `/gm/payroll/${params.id}/slips/${slipId}`}
      canManage={canManage}
    />
  );
}
