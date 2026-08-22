'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { useGetEmployeesQuery } from '@/store/api/api';

export default function SuperAdminEmployeesPage() {
  const { data, isFetching, isError } = useGetEmployeesQuery();
  const rows = data?.data ?? [];

  return (
    <>
      <PageHeader
        kicker="Organization"
        title="Employees"
        actions={
          <Button asChild>
            <Link href="/super-admin/employees/new">Add employee</Link>
          </Button>
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
              <Link href={`/super-admin/employees/${row.id}`} className="hover:underline">
                {row.fullName}
              </Link>
            ),
          },
          { id: 'email', header: 'Email', cell: (row) => row.email },
          {
            id: 'role',
            header: 'Role',
            cell: (row) => row.roleCodes.join(', ') || '—',
          },
          { id: 'department', header: 'Department', cell: (row) => row.departmentName ?? '—' },
          { id: 'status', header: 'Status', cell: (row) => row.status },
        ]}
        rows={rows}
        emptyTitle={isFetching ? 'Loading' : 'No employees'}
        emptyDescription={
          isFetching ? 'Fetching the directory.' : 'Onboard the first employee with a temporary login password.'
        }
      />
    </>
  );
}
