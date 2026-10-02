'use client';

import { PayrollHub } from '@/features/payroll/payroll-hub';

export default function Page() {
  return (
    <PayrollHub
      runHref="/hr/salary-slips"
      canManage={false}
      kicker="Payroll"
      title="Published salary slips"
    />
  );
}
