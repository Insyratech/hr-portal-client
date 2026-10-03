'use client';

import { useMemo, useState } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { StatusMessage } from '@/components/ui/status-message';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { formatInr } from '@/features/payroll/format';
import { downloadSalarySlipPdf, printSalarySlip } from '@/features/payroll/salary-slip-print';
import type { SalarySlip } from '@/types/api';
import { useGetPayrollRunQuery, usePublishPayrollMutation } from '@/store/api/api';

export function PayrollRunPreview({
  runId,
  listHref,
  slipHref,
  canManage,
  backLabel = 'Back to payroll',
}: {
  runId: string;
  listHref: string;
  slipHref: (slipId: string) => string;
  canManage: boolean;
  backLabel?: string;
}) {
  const { data, isLoading, isError, error } = useGetPayrollRunQuery(runId);
  const [publish, { isLoading: publishing }] = usePublishPayrollMutation();
  const [company, setCompany] = useState('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const toast = useToast();
  const bundle = data?.data;
  const slips = useMemo(() => {
    const rows = bundle?.slips ?? [];
    if (company === 'all') return rows;
    return rows.filter((row) => row.companyName === company);
  }, [bundle, company]);

  async function onPublish() {
    try {
      await publish(runId).unwrap();
      toast.success('Payroll published. Employees can open their payslips.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to publish payroll.'));
    }
  }

  function onPrint(slip: SalarySlip) {
    const opened = printSalarySlip(slip);
    if (!opened) {
      toast.error('Allow pop-ups to print the salary slip.');
    }
  }

  async function onDownload(slip: SalarySlip) {
    if (downloadingId) return;
    setDownloadingId(slip.id);
    try {
      await downloadSalarySlipPdf(slip);
      toast.success('Salary slip PDF downloaded.');
    } catch {
      toast.error('Unable to download the salary slip PDF.');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <>
      <PageHeader kicker="Payroll" title={bundle ? bundle.run.period : 'Run'} />
      <p className="mb-8">
        <Link href={listHref} className="text-sm text-muted hover:text-foreground">
          {backLabel}
        </Link>
      </p>
      {isLoading ? <PageLoading compact message="Loading slips…" /> : null}
      {isError ? <StatusMessage tone="danger">{apiErrorMessage(error, 'Unable to load this run.')}</StatusMessage> : null}
      {bundle ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <StatusBadge
              status={bundle.run.status === 'PUBLISHED' ? 'approved' : 'pending'}
              label={bundle.run.status}
            />
            {canManage && bundle.run.status === 'CALCULATED' ? (
              <Button type="button" disabled={publishing} onClick={() => void onPublish()}>
                Publish
              </Button>
            ) : null}
          </div>
          {bundle.skipped && bundle.skipped.length > 0 ? (
            <StatusMessage tone="danger">
              {`Skipped ${bundle.skipped.length} employee${bundle.skipped.length === 1 ? '' : 's'} (no company or compensation).`}
            </StatusMessage>
          ) : null}
          <div>
            <Meta className="mb-2">Company</Meta>
            <select
              className="h-10 border border-border bg-background px-3 text-sm"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            >
              <option value="all">All companies</option>
              {bundle.companies.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <DataTable
            columns={[
              { id: 'name', header: 'Name', cell: (row) => row.employeeName },
              { id: 'code', header: 'ID', cell: (row) => row.employeeCode },
              { id: 'company', header: 'Company', cell: (row) => row.companyName },
              {
                id: 'working',
                header: 'Working days',
                cell: (row) => String(row.workingDays ?? row.calendarDays),
              },
              { id: 'lop', header: 'LOP days', cell: (row) => String(row.lopDays) },
              { id: 'salary', header: 'Salary (CTC)', cell: (row) => formatInr(row.gross) },
              { id: 'net', header: 'Net pay', cell: (row) => formatInr(row.net) },
              {
                id: 'actions',
                header: 'Actions',
                cell: (row) => (
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={slipHref(row.id)} className="text-sm text-muted hover:text-foreground">
                      View
                    </Link>
                    <button
                      type="button"
                      className="text-sm text-muted hover:text-foreground"
                      onClick={() => onPrint(row)}
                    >
                      Print
                    </button>
                    <button
                      type="button"
                      className="text-sm text-muted hover:text-foreground disabled:opacity-50"
                      disabled={downloadingId === row.id}
                      onClick={() => void onDownload(row)}
                    >
                      {downloadingId === row.id ? 'Downloading…' : 'Download'}
                    </button>
                  </div>
                ),
              },
            ]}
            rows={slips}
            emptyTitle="No slips"
            emptyDescription="Calculate payroll to generate slips."
          />
        </div>
      ) : null}
    </>
  );
}
