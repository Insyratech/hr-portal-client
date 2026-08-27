'use client';

import { PayrollHub } from '@/features/payroll/payroll-hub';

export default function SuperAdminPayrollPage() {
  return <PayrollHub runHref="/super-admin/payroll" canManage={false} />;
}
