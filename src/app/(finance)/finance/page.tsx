'use client';

import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/layout/page-header';

export default function FinanceOverviewPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader kicker="Finance Manager" title="Overview" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Finance tools (budgets, cost centres, and reporting) are not live yet. Your personal payslips, leave, and
        attendance are ready under My work.
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <StatCard value="Soon" label="Finance desk" icon="grid" />
        <StatCard value="View" label="My payslips" icon="file" onClick={() => router.push('/payslips')} />
        <StatCard value="Apply" label="My leave" icon="leave" onClick={() => router.push('/leave')} />
        <StatCard value="Open" label="My attendance" icon="clock" onClick={() => router.push('/attendance')} />
      </div>
      <p className="mt-8 max-w-2xl text-sm text-muted">
        Payroll runs and attendance uploads are owned by General Manager. Directory and leave setup are owned by HR
        Manager.
      </p>
    </>
  );
}
