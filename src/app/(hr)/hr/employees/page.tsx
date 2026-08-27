'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { useGetEmployeesQuery } from '@/store/api/api';

export default function Page() {
  const { data, isFetching, isError } = useGetEmployeesQuery();
  const rows = data?.data ?? [];
  return (
    <>
      <PageHeader kicker="Employees" title="Directory" />
      <p className="mb-4 text-sm text-muted">
        Set company, shift, leave, and pay on each profile (no unlock needed). For name, phone, or joining date
        changes, request an edit from Super Admin.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load employees.</p> : null}
      <DataTable
        columns={[
          { id: 'code', header: 'ID', cell: (row) => row.employeeCode },
          {
            id: 'name',
            header: 'Name',
            cell: (row) => (
              <Link href={`/hr/employees/${row.id}`} className="hover:underline">
                {row.fullName}
              </Link>
            ),
          },
          { id: 'email', header: 'Email', cell: (row) => row.email },
          { id: 'department', header: 'Department', cell: (row) => row.departmentName ?? '—' },
          { id: 'company', header: 'Company', cell: (row) => row.companyName ?? '—' },
          { id: 'status', header: 'Status', cell: (row) => row.status },
        ]}
        rows={rows}
        emptyTitle={isFetching ? 'Loading' : 'No employees'}
        emptyDescription={isFetching ? 'Fetching the directory.' : 'Ask Super Admin to create accounts.'}
      />
    </>
  );
}
