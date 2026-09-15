'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DataTable, type DataTableColumn } from '@/components/dashboard/data-table';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useGetEmployeesQuery } from '@/store/api/api';
import type { Employee } from '@/types/api';

const UNASSIGNED = '__unassigned__';

function matchesQuery(row: Employee, query: string): boolean {
  if (!query) return true;
  const haystack = `${row.employeeCode} ${row.fullName} ${row.email} ${row.companyName ?? ''}`.toLowerCase();
  return haystack.includes(query);
}

export function EmployeeDirectory({
  basePath,
  kicker,
  title,
  description,
  rowAction = 'none',
  filterByCompany = false,
}: {
  basePath: string;
  kicker: string;
  title: string;
  description: string;
  rowAction?: 'edit' | 'none';
  filterByCompany?: boolean;
}) {
  const { data, isFetching, isError } = useGetEmployeesQuery();
  const [query, setQuery] = useState('');
  const [companyKey, setCompanyKey] = useState('all');
  const allRows = data?.data ?? [];
  const companies = useMemo(() => {
    const names = [...new Set(allRows.map((row) => row.companyName).filter((name): name is string => Boolean(name)))];
    names.sort((a, b) => a.localeCompare(b));
    return names;
  }, [allRows]);
  const hasUnassigned = allRows.some((row) => !row.companyName);
  const needle = query.trim().toLowerCase();
  const rows = allRows.filter((row) => {
    if (!matchesQuery(row, needle)) return false;
    if (!filterByCompany || companyKey === 'all') return true;
    if (companyKey === UNASSIGNED) return !row.companyName;
    return row.companyName === companyKey;
  });

  const columns: DataTableColumn<Employee>[] = [
    { id: 'code', header: 'ID', cell: (row) => row.employeeCode },
    {
      id: 'name',
      header: 'Name',
      cell: (row) => (
        <Link href={`${basePath}/${row.id}`} className="hover:underline">
          {row.fullName}
        </Link>
      ),
    },
    { id: 'email', header: 'Email', cell: (row) => row.email },
    { id: 'department', header: 'Department', cell: (row) => row.departmentName ?? '—' },
    { id: 'company', header: 'Company', cell: (row) => row.companyName ?? '—' },
    { id: 'status', header: 'Status', cell: (row) => row.status },
  ];
  if (rowAction === 'edit') {
    columns.push({
      id: 'edit',
      header: 'Edit',
      cell: (row) => (
        <Link
          href={`${basePath}/${row.id}`}
          aria-label={`Edit ${row.fullName}`}
          title={`Edit ${row.fullName}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-border bg-background text-foreground shadow-card transition-colors hover:bg-surface"
        >
          <Icon name="pencil" className="h-3.5 w-3.5" />
        </Link>
      ),
    });
  }

  return (
    <>
      <PageHeader kicker={kicker} title={title} />
      <p className="mb-4 max-w-2xl text-sm text-muted">{description}</p>
      {filterByCompany ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={companyKey === 'all' ? 'primary' : 'outline'} onClick={() => setCompanyKey('all')}>
            All companies
          </Button>
          {companies.map((name) => (
            <Button
              key={name}
              type="button"
              size="sm"
              variant={companyKey === name ? 'primary' : 'outline'}
              onClick={() => setCompanyKey(name)}
            >
              {name}
            </Button>
          ))}
          {hasUnassigned ? (
            <Button
              type="button"
              size="sm"
              variant={companyKey === UNASSIGNED ? 'primary' : 'outline'}
              onClick={() => setCompanyKey(UNASSIGNED)}
            >
              Unassigned
            </Button>
          ) : null}
        </div>
      ) : null}
      <FilterBar value={query} onChange={setQuery} placeholder="Search name, ID, or email" />
      {isError ? <p className="mb-4 text-sm">Unable to load employees.</p> : null}
      <DataTable
        columns={columns}
        rows={rows}
        loading={isFetching}
        emptyTitle="No employees"
        emptyDescription={isFetching ? 'Fetching the directory.' : 'No people match this filter.'}
      />
    </>
  );
}
