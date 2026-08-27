'use client';

import { PayrollHub } from '@/features/payroll/payroll-hub';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export default function Page() {
  const canManage = useAppSelector((state) => state.permissions.permissions.includes(PERMISSIONS.PAYROLL_MANAGE));
  return <PayrollHub runHref="/gm/payroll" canManage={canManage} />;
}
