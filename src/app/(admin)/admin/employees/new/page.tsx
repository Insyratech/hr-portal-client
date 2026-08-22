'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { CreateEmployeeForm } from '@/features/employees/create-employee-form';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export default function AdminNewEmployeePage() {
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.USERS_MANAGE),
  );

  return (
    <>
      <PageHeader kicker="Employees" title="New employee" />
      {canManage ? (
        <CreateEmployeeForm basePath="/admin/employees" />
      ) : (
        <p className="text-sm text-muted">
          Only Super Admin can onboard employees and issue login credentials. Use{' '}
          <Link href="/super-admin/employees/new" className="underline">
            Super Admin → Employees
          </Link>{' '}
          when signed in as Super Admin.
        </p>
      )}
    </>
  );
}
