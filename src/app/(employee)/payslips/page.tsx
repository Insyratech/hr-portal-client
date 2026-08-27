'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { formatInr } from '@/features/payroll/format';
import { useGetMyPayslipsQuery } from '@/store/api/api';

export default function EmployeePayslipsPage() {
  const { data, isLoading } = useGetMyPayslipsQuery();

  return (
    <>
      <PageHeader kicker="Payslips" title="Salary slips" />
      <p className="mb-8 text-sm text-muted">Published months only. Open a slip to print it.</p>
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
