'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { useCalculatePayrollMutation, useGetPayrollImportsQuery, useGetPayrollRunsQuery } from '@/store/api/api';

export function PayrollHub({
  runHref,
  canManage,
}: {
  runHref: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const { data: runData, isLoading } = useGetPayrollRunsQuery();
  const { data: importData } = useGetPayrollImportsQuery(undefined, { skip: !canManage });
  const [calculate, { isLoading: calculating }] = useCalculatePayrollMutation();
  const toast = useToast();

  async function onCalculate(importId: string) {
    try {
      const result = await calculate({ importId }).unwrap();
      toast.success('Payroll calculated. Review slips before publishing.');
      router.push(`${runHref}/${result.data.run.id}`);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to calculate payroll.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Payroll" title="Salary slips" />
      {canManage ? (
        <section className="mb-10">
          <Meta className="mb-3">Confirmed attendance</Meta>
          <p className="mb-4 text-sm text-muted">
            Calculate after the month is confirmed. Publish when the preview looks right. Employees then see the slip
            only — they cannot change it.
          </p>
          <DataTable
            columns={[
              { id: 'period', header: 'Month', cell: (row) => row.period },
              { id: 'file', header: 'Attendance file', cell: (row) => row.fileName },
              {
                id: 'status',
                header: 'Payroll',
                cell: (row) => row.payrollStatus ?? 'Not calculated',
              },
              {
                id: 'act',
                header: '',
                cell: (row) =>
                  row.payrollLocked ? (
                    <span className="text-sm text-muted">Published</span>
                  ) : (
                    <Button type="button" size="sm" disabled={calculating} onClick={() => void onCalculate(row.importId)}>
                      Calculate
                    </Button>
                  ),
              },
            ]}
            rows={(importData?.data ?? []).map((row) => ({ ...row, id: row.importId }))}
            emptyTitle="No confirmed month"
            emptyDescription="Confirm attendance for a month first."
          />
        </section>
      ) : (
        <p className="mb-8 text-sm text-muted">Published slips only.</p>
      )}
      <Meta className="mb-3">Runs</Meta>
      <DataTable
        columns={[
          { id: 'period', header: 'Month', cell: (row) => row.period },
          {
            id: 'status',
            header: 'Status',
            cell: (row) => (
              <StatusBadge
                status={row.status === 'PUBLISHED' ? 'approved' : row.status === 'CALCULATED' ? 'pending' : 'rejected'}
                label={row.status}
              />
            ),
          },
          {
            id: 'open',
            header: '',
            cell: (row) => (
              <Link href={`${runHref}/${row.id}`} className="text-sm text-muted hover:text-foreground">
                Open
              </Link>
            ),
          },
        ]}
        rows={runData?.data ?? []}
        loading={isLoading}
        emptyTitle="No payroll runs"
        emptyDescription={canManage ? 'Calculate a confirmed month to create slips.' : 'Published payroll appears here.'}
      />
    </>
  );
}
