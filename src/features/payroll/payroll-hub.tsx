'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { PayrollCalculateDialog } from '@/features/payroll/payroll-calculate-dialog';
import { useGetPayrollImportsQuery, useGetPayrollPreviewQuery, useGetPayrollRunsQuery } from '@/store/api/api';

export function PayrollHub({
  runHref,
  canManage,
  title = 'Salary slips',
  kicker = 'Payroll',
}: {
  runHref: string;
  canManage: boolean;
  title?: string;
  kicker?: string;
}) {
  const { data: runData, isLoading } = useGetPayrollRunsQuery();
  const { data: importData } = useGetPayrollImportsQuery(undefined, { skip: !canManage });
  const [prepareImportId, setPrepareImportId] = useState<string | null>(null);
  const { isFetching: previewLoading } = useGetPayrollPreviewQuery(prepareImportId ?? '', {
    skip: !prepareImportId,
  });

  const publishedRuns = (runData?.data ?? []).filter((row) =>
    canManage ? true : row.status === 'PUBLISHED',
  );

  return (
    <>
      <PageHeader kicker={kicker} title={title} />
      {canManage ? (
        <section className="mb-10">
          <Meta className="mb-3">Confirmed attendance</Meta>
          <p className="mb-4 text-sm text-muted">
            Calculate after the month is confirmed. Review incentives and deductions for each employee, then calculate.
            Publish when the preview looks right. Employees then see the slip only — they cannot change it.
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
                    <Button
                      type="button"
                      size="sm"
                      loading={prepareImportId === row.importId && previewLoading}
                      disabled={prepareImportId === row.importId && previewLoading}
                      onClick={() => setPrepareImportId(row.importId)}
                    >
                      {prepareImportId === row.importId && previewLoading ? 'Opening' : 'Calculate'}
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
        <p className="mb-8 text-sm text-muted">
          Open a published month to view every employee salary slip. You can view, print, or save each slip as PDF.
        </p>
      )}
      <Meta className="mb-3">{canManage ? 'Runs' : 'Published months'}</Meta>
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
        rows={publishedRuns}
        loading={isLoading}
        emptyTitle={canManage ? 'No payroll runs' : 'No published salary slips'}
        emptyDescription={
          canManage
            ? 'Calculate a confirmed month to create slips.'
            : 'Published payroll months appear here after GM publishes.'
        }
      />
      <PayrollCalculateDialog
        importId={prepareImportId}
        runHref={runHref}
        open={prepareImportId !== null}
        onOpenChange={(open) => {
          if (!open) setPrepareImportId(null);
        }}
      />
    </>
  );
}
