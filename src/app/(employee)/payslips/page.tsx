'use client';

import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { formatInr } from '@/features/payroll/format';
import {
  isPayslipPlaygroundViewer,
  PAYSLIP_PLAYGROUND_PATH,
} from '@/features/payroll/playground-access';
import { useGetMeQuery, useGetMyPayslipsQuery } from '@/store/api/api';

export default function EmployeePayslipsPage() {
  const { data, isLoading } = useGetMyPayslipsQuery();
  const { data: me } = useGetMeQuery();
  const showPlayground = isPayslipPlaygroundViewer(me?.data?.fullName);

  return (
    <>
      <PageHeader kicker="Payslips" title="Salary slips" />
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">Published months only. Open a slip to print it.</p>
        {showPlayground ? (
          <Button asChild variant="outline" size="sm">
            <Link href={PAYSLIP_PLAYGROUND_PATH}>Payslip playground</Link>
          </Button>
        ) : null}
      </div>
      {showPlayground ? (
        <p className="mb-6 text-sm text-muted">
          Use the playground to draft a new-regime salary slip (ephemeral — not published).
        </p>
      ) : null}
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
