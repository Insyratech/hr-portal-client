'use client';

import { useParams } from 'next/navigation';
import { PayslipPage } from '@/features/payroll/payslip-page';

export default function EmployeePayslipRoute() {
  const params = useParams<{ id: string }>();
  return <PayslipPage slipId={params.id} backHref="/payslips" backLabel="Back to payslips" />;
}
