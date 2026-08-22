'use client';

import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Meta } from '@/components/layout/meta';
import { useGetPoliciesQuery, useGetPolicyAcknowledgementsQuery } from '@/store/api/api';

export default function AdminPoliciesPage() {
  const { data, isLoading } = useGetPoliciesQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: report } = useGetPolicyAcknowledgementsQuery(
    { id: selectedId ?? '' },
    { skip: !selectedId },
  );

  return (
    <>
      <PageHeader kicker="Policies" title="HR policies" />
      <DataTable
        columns={[
          { id: 'title', header: 'Title', cell: (row) => row.title },
          {
            id: 'version',
            header: 'Current',
            cell: (row) => row.currentVersion?.versionLabel ?? '—',
          },
          {
            id: 'effective',
            header: 'Effective',
            cell: (row) => row.currentVersion?.effectiveDate ?? '—',
          },
          {
            id: 'report',
            header: 'Acknowledgements',
            cell: (row) => (
              <Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(row.id)}>
                Who has not acknowledged
              </Button>
            ),
          },
        ]}
        rows={data?.data ?? []}
        emptyTitle={isLoading ? 'Loading' : 'No policies'}
        emptyDescription="Published HR policies appear here."
      />

      {report?.data ? (
        <section className="mt-10 space-y-4">
          <Meta>
            {report.data.version.versionLabel} · {report.data.acknowledgedCount} acknowledged ·{' '}
            {report.data.pendingCount} pending
          </Meta>
          <DataTable
            columns={[
              { id: 'name', header: 'Employee', cell: (row) => row.fullName },
              { id: 'email', header: 'Email', cell: (row) => row.email },
              {
                id: 'status',
                header: 'Status',
                cell: (row) => (row.acknowledged ? `Accepted ${row.acceptedAt ?? ''}` : 'Not acknowledged'),
              },
            ]}
            rows={report.data.employees.map((row) => ({ ...row, id: row.employeeId }))}
            emptyTitle="No employees"
            emptyDescription="Active employees appear in acknowledgement reports."
          />
        </section>
      ) : null}
    </>
  );
}
