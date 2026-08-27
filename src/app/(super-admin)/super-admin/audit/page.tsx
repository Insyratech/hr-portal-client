'use client';

import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { useGetAuditLogsQuery } from '@/store/api/api';

export default function AuditPage() {
  const { data, isFetching, isError } = useGetAuditLogsQuery();

  return (
    <>
      <PageHeader kicker="System" title="Audit logs" />
      {isError ? <p className="mb-4 text-sm">Unable to load audit logs.</p> : null}
      <DataTable
        columns={[
          { id: 'created', header: 'When', cell: (row) => row.createdAt },
          { id: 'action', header: 'Action', cell: (row) => row.action },
          { id: 'entity', header: 'Entity', cell: (row) => row.entityType },
        ]}
        rows={data?.data ?? []}
        loading={isFetching}
        emptyTitle="No audit events"
        emptyDescription="Sensitive writes will appear here."
      />
    </>
  );
}
