'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { formatInr } from '@/features/payroll/format';
import { useGetMeQuery, useGetMyPayslipsQuery, useGetPayslipPlaygroundSeedQuery } from '@/store/api/api';

export default function EmployeePayslipsPage() {
  const { data, isLoading } = useGetMyPayslipsQuery();
  const { data: me } = useGetMeQuery();
  const maybeSandip = me?.data?.fullName === 'Sandip Kumar Yadav';
  const playground = useGetPayslipPlaygroundSeedQuery(undefined, { skip: !maybeSandip });
  const showPlayground = playground.isSuccess;

  return (
    <>
      <PageHeader kicker="Payslips" title="Salary slips" />
      <p className="mb-4 text-sm text-muted">Published months only. Open a slip to print it.</p>
      {showPlayground ? (
        <p className="mb-8 text-sm">
          <Link href="/payslips/playground" className="text-muted underline-offset-2 hover:text-foreground hover:underline">
            Opens payslip playground
          </Link>
          <span className="text-muted"> — ephemeral new-regime draft (not published).</span>
        </p>
      ) : (
        <div className="mb-8" />
      )}
      <DataTable
        columns={[
          { id: 'month', header: 'Month', cell: (row) => row.monthLabel },
          { id: 'company', header: 'Company', cell: (row) => row.companyName },
          { id: 'net', header: 'Net', cell: (row) => formatInr(row.net) },
          {
            id: 'open',
            header: '',
            cell: (row) => (
              <Link href={`/payslips/${row.id}`} className="text-sm text-muted hover:text-foreground">
                Open
              </Link>
            ),
          },
        ]}
        rows={data?.data ?? []}
        loading={isLoading}
        emptyTitle="No payslips yet"
        emptyDescription="HR publishes a month after attendance is confirmed. Your slip will appear here."
      />
    </>
  );
}
