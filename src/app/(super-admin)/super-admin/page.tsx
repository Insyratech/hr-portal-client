'use client';

import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import {
  useGetDepartmentsQuery,
  useGetEmployeesQuery,
  useGetGrievanceCountsQuery,
  useGetLeavePoliciesQuery,
  useGetShiftsQuery,
} from '@/store/api/api';

const GRIEVANCE_STATUSES = ['OPEN', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'CLOSED'] as const;

export default function SuperAdminOverviewPage() {
  const router = useRouter();
  const { data: employees } = useGetEmployeesQuery();
  const { data: departments } = useGetDepartmentsQuery();
  const { data: policies } = useGetLeavePoliciesQuery();
  const { data: shifts } = useGetShiftsQuery();
  const { data: grievanceCounts } = useGetGrievanceCountsQuery();
  const byStatus = grievanceCounts?.data.byStatus;

  return (
    <>
      <PageHeader kicker="Super admin" title="Overview" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <StatCard
          value={String(employees?.data.length ?? 0)}
          label="Employees"
          icon="users"
          onClick={() => router.push('/super-admin/employees')}
        />
        <StatCard
          value={String(departments?.data.length ?? 0)}
          label="Departments"
          icon="building"
          onClick={() => router.push('/super-admin/departments')}
        />
        <StatCard
          value={String(policies?.data.length ?? 0)}
          label="Leave"
          icon="leave"
          onClick={() => router.push('/super-admin/leave-types')}
        />
        <StatCard
          value={String(shifts?.data.length ?? 0)}
          label="Shifts"
          icon="clock"
          onClick={() => router.push('/super-admin/shifts')}
        />
      </div>
      <Meta className="mb-4 mt-10">Grievances</Meta>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 lg:gap-6">
        {GRIEVANCE_STATUSES.map((status) => (
          <StatCard
            key={status}
            value={String(byStatus?.[status] ?? 0)}
            label={status.replaceAll('_', ' ')}
            icon="shield"
            onClick={() => router.push(`/super-admin/grievances?status=${status}`)}
          />
        ))}
      </div>
    </>
  );
}
