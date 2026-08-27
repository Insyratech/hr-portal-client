'use client';

import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/layout/page-header';

export default function CsoOverviewPage() {
  const router = useRouter();
  return (
    <>
      <PageHeader kicker="CSO" title="Overview" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Team work desk: week plans, priorities, weekly PPTs, projects, employees, and insights. R&amp;D and JC come
        later.
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
        <StatCard value="Week" label="Team week" icon="calendar" onClick={() => router.push('/cso/work')} />
        <StatCard value="View" label="Priorities" icon="grid" onClick={() => router.push('/cso/work/priorities')} />
        <StatCard
          value="PPT"
          label="Weekly work updates"
          icon="file"
          onClick={() => router.push('/cso/work/weekly-updates')}
        />
        <StatCard value="Projects" label="Projects" icon="building" onClick={() => router.push('/cso/work/projects')} />
        <StatCard value="People" label="Employees" icon="users" onClick={() => router.push('/cso/work/employees')} />
        <StatCard value="Trends" label="Insights" icon="overview" onClick={() => router.push('/cso/work/insights')} />
      </div>
    </>
  );
}
