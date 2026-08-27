'use client';

import Link from 'next/link';
import { PageLoading } from '@/components/ui/page-loading';
import { useParams, useSearchParams } from 'next/navigation';
import { ActivityTimeline } from '@/components/dashboard/activity-timeline';
import { EmptyState } from '@/components/dashboard/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { cn } from '@/lib/utils';
import { EmployeeAccessRoles } from '@/features/employees/employee-access-roles';
import { EmployeeAccountActions } from '@/features/employees/employee-account-actions';
import { EmployeeAttendancePanel } from '@/features/employees/employee-attendance-panel';
import { EmployeeCompanyEditor } from '@/features/employees/employee-company-editor';
import { DirectoryEditRequestPanel } from '@/features/employees/directory-edit-request-panel';
import { EmployeeLeavesPanel } from '@/features/employees/employee-leaves-panel';
import { EmployeeOverviewEditor } from '@/features/employees/employee-overview-editor';
import { EmployeePayrollPanel } from '@/features/employees/employee-payroll-panel';
import { EmployeeWorkPanel } from '@/features/employees/employee-work-panel';
import { useGetDirectoryEditRequestForEmployeeQuery, useGetEmployeeAuditQuery, useGetEmployeeQuery } from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import {
  canEditDirectoryRecord,
  canLifecycleDirectoryRecord,
  isHrManager,
  isSuperAdmin,
} from '@/features/auth/role-access';
import { roleLabel } from '@/features/employees/onboarding-roles';
import { PERMISSIONS } from '@/types/permissions';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'leaves', label: 'Leaves' },
  { id: 'work', label: 'Work' },
  { id: 'documents', label: 'Documents' },
  { id: 'activity', label: 'Activity' },
] as const;

export function EmployeeProfile({ basePath = '/hr/employees' }: { basePath?: string }) {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') ?? 'overview';
  const justCreated = searchParams.get('created') === '1';
  const { data, isError, isFetching } = useGetEmployeeQuery(params.id);
  const { data: editUnlock } = useGetDirectoryEditRequestForEmployeeQuery(params.id);
  const { data: audit } = useGetEmployeeAuditQuery(params.id, { skip: tab !== 'activity' });
  const roles = useAppSelector((state) => state.auth.user?.roles ?? []);
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const employee = data?.data;
  const actorEmployeeId = useAppSelector((state) => state.auth.user?.employeeId);
  const unlocked = Boolean(editUnlock?.data.canEdit);
  const canEditProfile = Boolean(
    employee &&
      permissions.includes(PERMISSIONS.USERS_MANAGE) &&
      canEditDirectoryRecord(roles, employee.roleCodes, unlocked),
  );
  const canLifecycle = Boolean(
    employee &&
      permissions.includes(PERMISSIONS.USERS_MANAGE) &&
      canLifecycleDirectoryRecord(roles, actorEmployeeId, employee),
  );
  const canManageLeaves = Boolean(
    employee &&
      permissions.includes(PERMISSIONS.LEAVE_ALLOCATIONS_MANAGE) &&
      !employee.roleCodes.includes('SUPER_ADMIN'),
  );
  const canManageAttendance = Boolean(
    employee &&
      permissions.includes(PERMISSIONS.SHIFTS_MANAGE) &&
      !employee.roleCodes.includes('SUPER_ADMIN'),
  );
  const canViewPayroll =
    permissions.includes(PERMISSIONS.PAYROLL_VIEW) ||
    permissions.includes(PERMISSIONS.PAYROLL_MANAGE) ||
    permissions.includes(PERMISSIONS.USERS_VIEW);
  const canManagePayroll = Boolean(
    employee &&
      isHrManager(roles) &&
      permissions.includes(PERMISSIONS.COMPANIES_MANAGE) &&
      !employee.roleCodes.includes('SUPER_ADMIN'),
  );
  const canAssignCompany = canManagePayroll;
  const canRequestEdit =
    isHrManager(roles) &&
    Boolean(employee) &&
    permissions.includes(PERMISSIONS.USERS_VIEW) &&
    !employee?.roleCodes.includes('SUPER_ADMIN');
  const canViewWork =
    permissions.includes(PERMISSIONS.WORK_VIEW) || permissions.includes(PERMISSIONS.WORK_ASSIGN);
  const canAssignAccessRoles =
    isSuperAdmin(roles) &&
    Boolean(employee) &&
    permissions.includes(PERMISSIONS.USERS_MANAGE) &&
    !employee?.roleCodes.includes('SUPER_ADMIN');
  const tabs = TABS.filter((item) => {
    if (item.id === 'payroll') return canViewPayroll;
    if (item.id === 'work') return canViewWork;
    return true;
  });

  if (isFetching && !employee) {
    return <PageLoading compact message="Loading" />;
  }

  if (isError || !employee) {
    return <p className="text-sm">Employee not found.</p>;
  }

  return (
    <>
      <PageHeader
        kicker={employee.employeeCode}
        title={employee.fullName}
        actions={canLifecycle ? <EmployeeAccountActions employee={employee} listHref={basePath} /> : undefined}
      />
      {justCreated && isSuperAdmin(roles) ? (
        <div className="mb-6 max-w-2xl rounded border border-border bg-background p-4 shadow-card">
          <p className="text-sm font-medium text-foreground">Employee created</p>
          <p className="mt-1 text-sm text-muted">
            They can sign in with the temporary password. Next: HR sets company, shift, leave, and pay. Assign
            managerial access below if needed.
          </p>
          <p className="mt-3 text-sm text-muted">
            <a href="#access-roles" className="underline">
              Assign access roles
            </a>
            {' · '}
            <Link href={`${basePath}/${employee.id}`} className="underline">
              Dismiss
            </Link>
          </p>
        </div>
      ) : null}
      {canRequestEdit || isSuperAdmin(roles) ? (
        <DirectoryEditRequestPanel
          employeeId={employee.id}
          canRequest={canRequestEdit}
          canEdit={isSuperAdmin(roles)}
        />
      ) : null}
      {isSuperAdmin(roles) && !canEditProfile ? (
        <p className="mb-4 max-w-2xl text-sm text-muted">
          Name, phone, joining date, and other personal details stay view-only until an edit request is approved.
          Access roles do not need an unlock. Company, shift, leave, and pay are set by HR Manager.
        </p>
      ) : null}
      <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((item) => (
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
        <div className="space-y-8">
          {canAssignAccessRoles ? <EmployeeAccessRoles employee={employee} /> : null}
          {canAssignCompany ? <EmployeeCompanyEditor employee={employee} /> : null}
          {canEditProfile ? (
            <EmployeeOverviewEditor employee={employee} />
          ) : (
            <dl className="grid max-w-2xl gap-6 sm:grid-cols-2">
              <Field label="Email" value={employee.email} />
              <Field label="Phone" value={employee.phone ?? '—'} />
              <Field label="Company" value={employee.companyName ?? '—'} />
              <Field label="Department" value={employee.departmentName ?? '—'} />
              <Field label="Designation (job title)" value={employee.designationName ?? '—'} />
              <Field label="Joining date" value={employee.joiningDate} />
              <Field label="Employment type" value={employee.employmentType.replaceAll('_', ' ')} />
              <Field
                label="Status"
                value={employee.status === 'inactive' ? 'Deactivated — cannot sign in' : 'Active'}
              />
              {!canAssignAccessRoles ? (
                <Field
                  label="Access roles"
                  value={employee.roleCodes.map((code) => roleLabel(code)).join(', ') || '—'}
                />
              ) : null}
            </dl>
          )}
        </div>
      ) : null}
      {tab === 'payroll' && canViewPayroll ? (
        <EmployeePayrollPanel
          employeeId={employee.id}
          joiningDate={employee.joiningDate}
          canManage={canManagePayroll}
        />
      ) : null}
      {tab === 'attendance' ? (
        <EmployeeAttendancePanel employeeId={employee.id} canManage={canManageAttendance} />
      ) : null}
      {tab === 'leaves' ? (
        <EmployeeLeavesPanel
          employeeId={employee.id}
          canManage={canManageLeaves}
          forStaffManager={
            isSuperAdmin(roles) &&
            (employee.roleCodes.includes('GENERAL_MANAGER') ||
              employee.roleCodes.includes('HR_MANAGER') ||
              employee.roleCodes.includes('ADMIN'))
          }
        />
      ) : null}
      {tab === 'work' && canViewWork ? (
        <EmployeeWorkPanel employeeId={employee.id} />
      ) : null}
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
