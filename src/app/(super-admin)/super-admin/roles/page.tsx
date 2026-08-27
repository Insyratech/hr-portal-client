'use client';

import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { useGetRolesQuery } from '@/store/api/api';

export default function RolesPage() {
  const { data, isFetching, isError } = useGetRolesQuery();

  return (
    <>
      <PageHeader kicker="Organization" title="Roles" />
      <p className="mb-4 max-w-2xl text-sm text-muted">
        Catalog of portal roles. To grant or remove HR / GM / CSO / Finance for a person, open their employee profile
        and use Access roles.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load roles.</p> : null}
      <DataTable
        columns={[
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'code', header: 'Code', cell: (row) => row.code },
        ]}
        rows={data?.data ?? []}
        emptyTitle={isFetching ? 'Loading' : 'No roles'}
        emptyDescription="Seed roles from the Phase 1 migration."
      />
    </>
  );
}
