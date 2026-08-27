'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Icon } from '@/components/ui/icon';
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
          {
            id: 'edit',
            header: 'Edit',
            cell: (row) => (
              <Link
                href={`/hr/employees/${row.id}`}
                aria-label={`Edit ${row.fullName}`}
                title={`Edit ${row.fullName}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-foreground shadow-card transition-colors hover:bg-surface"
              >
                <Icon name="pencil" className="h-3.5 w-3.5" />
              </Link>
            ),
          },
        ]}
        rows={rows}
        loading={isFetching}
        emptyTitle="No employees"
        emptyDescription={isFetching ? 'Fetching the directory.' : 'Ask Super Admin to create accounts.'}
      />
    </>
  );
}
