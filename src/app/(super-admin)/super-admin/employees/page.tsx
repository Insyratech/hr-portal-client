'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Icon } from '@/components/ui/icon';
import { useGetEmployeesQuery } from '@/store/api/api';

export default function SuperAdminEmployeesPage() {
  const { data, isFetching, isError } = useGetEmployeesQuery();
  const rows = data?.data ?? [];

  return (
    <>
      <PageHeader
        kicker="Organization"
        title="Accounts"
        actions={
          <Button asChild>
            <Link href="/super-admin/employees/new">New employee</Link>
          </Button>
        }
      />
      <p className="mb-4 max-w-2xl text-sm text-muted">
        Create people as employees first (personal details + login). HR sets company, shift, leave, and pay. Assign
        HR / GM / CSO / Finance on their profile when needed. Personal details stay locked until HR requests an edit.
      </p>
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
          { id: 'company', header: 'Company', cell: (row) => row.companyName ?? '—' },
          { id: 'status', header: 'Status', cell: (row) => row.status },
          {
            id: 'edit',
            header: 'Edit',
            cell: (row) => (
              <Link
                href={`/super-admin/employees/${row.id}`}
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
        emptyTitle={isFetching ? 'Loading' : 'No employees'}
        emptyDescription={
          isFetching ? 'Fetching the directory.' : 'Create the first person with New employee.'
        }
      />
    </>
  );
}
