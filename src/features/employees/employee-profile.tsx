'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { EmptyState } from '@/components/dashboard/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { cn } from '@/lib/utils';
import { EmployeeAttendancePanel } from '@/features/employees/employee-attendance-panel';
import { EmployeeLeavesPanel } from '@/features/employees/employee-leaves-panel';
import { EmployeeOverviewEditor } from '@/features/employees/employee-overview-editor';
import { useGetEmployeeAuditQuery, useGetEmployeeQuery } from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'leaves', label: 'Leaves' },
  { id: 'documents', label: 'Documents' },
  { id: 'activity', label: 'Activity' },
] as const;

export function EmployeeProfile({ basePath = '/admin/employees' }: { basePath?: string }) {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'overview';
  const { data, isError, isFetching } = useGetEmployeeQuery(params.id);
  const { data: audit } = useGetEmployeeAuditQuery(params.id, { skip: tab !== 'activity' });
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.USERS_MANAGE),
  );
  const employee = data?.data;

  if (isFetching && !employee) {
    return <p className="text-sm text-muted">Loading</p>;
  }

  if (isError || !employee) {
    return <p className="text-sm">Employee not found.</p>;
  }

  return (
    <>
      <PageHeader kicker={employee.employeeCode} title={employee.fullName} />
      <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={`${basePath}/${employee.id}?tab=${item.id}`}
            className={cn(
              'shrink-0 px-3 py-2 text-xs uppercase tracking-[0.12em]',
              tab === item.id ? 'bg-foreground text-background' : 'text-muted',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {tab === 'overview' ? (
        canManage ? (
          <EmployeeOverviewEditor employee={employee} />
        ) : (
          <dl className="grid max-w-2xl gap-6 sm:grid-cols-2">
            <Field label="Email" value={employee.email} />
            <Field label="Phone" value={employee.phone ?? '—'} />
            <Field label="Date of birth" value={employee.dateOfBirth ?? '—'} />
            <Field label="Department" value={employee.departmentName ?? '—'} />
            <Field label="Designation" value={employee.designationName ?? '—'} />
            <Field label="Joining date" value={employee.joiningDate} />
            <Field label="Employment type" value={employee.employmentType.replaceAll('_', ' ')} />
            <Field label="Status" value={employee.status} />
            <Field label="Roles" value={employee.roleCodes.join(', ') || '—'} />
          </dl>
        )
      ) : null}
      {tab === 'attendance' ? (
        <EmployeeAttendancePanel employeeId={employee.id} canManage={canManage} />
      ) : null}
      {tab === 'leaves' ? <EmployeeLeavesPanel employeeId={employee.id} canManage={canManage} /> : null}
      {tab === 'documents' ? (
        <EmptyState title="Documents" description="Storage is not enabled yet. Uploads are not available." />
      ) : null}
      {tab === 'activity' ? (
        <ActivityTimeline
          items={(audit?.data ?? []).map((item) => ({
            id: item.id,
            title: item.action,
            detail: item.createdAt,
          }))}
        />
      ) : null}
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>
        <Meta>{label}</Meta>
      </dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}
