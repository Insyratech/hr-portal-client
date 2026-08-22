'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { useGetEmployeesQuery } from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';

export default function AdminEmployeesPage() {
  const { data, isFetching, isError } = useGetEmployeesQuery();
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.USERS_MANAGE),
  );
  const rows = data?.data ?? [];

  return (
    <>
      <PageHeader
        kicker="Employees"
        title="Directory"
        actions={
          canManage ? (
            <Button asChild>
              <Link href="/super-admin/employees/new">Add employee</Link>
            </Button>
          ) : null
        }
      />
      {isError ? <p className="mb-4 text-sm">Unable to load employees.</p> : null}
      <DataTable
        columns={[
          { id: 'code', header: 'ID', cell: (row) => row.employeeCode },
          {
            id: 'name',
            header: 'Name',
            cell: (row) => (
              <Link href={`/admin/employees/${row.id}`} className="hover:underline">
                {row.fullName}
              </Link>
            ),
          },
          { id: 'email', header: 'Email', cell: (row) => row.email },
          { id: 'department', header: 'Department', cell: (row) => row.departmentName ?? '—' },
          { id: 'status', header: 'Status', cell: (row) => row.status },
        ]}
        rows={rows}
        emptyTitle={isFetching ? 'Loading' : 'No employees'}
        emptyDescription={isFetching ? 'Fetching the directory.' : 'Create the first employee record.'}
      />
    </>
  );
}
