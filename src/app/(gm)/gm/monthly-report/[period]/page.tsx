'use client';

import { useParams } from 'next/navigation';
import { MonthlyWorkReportMonthPage } from '@/features/work/monthly-work-report-page';

export default function Page() {
  const params = useParams<{ period: string }>();
  return <MonthlyWorkReportMonthPage baseHref="/gm/monthly-report" period={params.period} />;
}
