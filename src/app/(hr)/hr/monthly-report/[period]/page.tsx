'use client';

import { useParams } from 'next/navigation';
import { MonthlyWorkReportMonthPage } from '@/features/work/monthly-work-report-page';

export default function Page() {
  const params = useParams<{ period: string }>();
  return <MonthlyWorkReportMonthPage baseHref="/hr/monthly-report" period={params.period} />;
}
