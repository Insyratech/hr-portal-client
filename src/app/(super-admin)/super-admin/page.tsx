'use client';

import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/layout/page-header';
import { useGetEmployeesQuery } from '@/store/api/api';

export default function SuperAdminOverviewPage() {
  const router = useRouter();
  const { data: employees } = useGetEmployeesQuery();

  return (
    <>
      <PageHeader kicker="Super admin" title="Overview" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Oversee accounts, access roles, policies, and system settings. Leave, attendance, payroll, and work desks live
        in the HR, General Manager, CSO, and Finance portals.
      </p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <StatCard
          value={String(employees?.data.length ?? 0)}
          label="Accounts"
          icon="users"
          onClick={() => router.push('/super-admin/employees')}
        />
        <StatCard
          value="Settings"
          label="System"
          icon="settings"
          onClick={() => router.push('/super-admin/settings')}
        />
        <StatCard
          value="Requests"
          label="Edit unlocks"
          icon="audit"
          onClick={() => router.push('/super-admin/edit-requests')}
        />
        <StatCard value="Log" label="Audit" icon="audit" onClick={() => router.push('/super-admin/audit')} />
        <StatCard
          value="Policies"
          label="HR policies"
          icon="file"
          onClick={() => router.push('/super-admin/hr-policies')}
        />
      </div>
    </>
  );
}
