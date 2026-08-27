'use client';

import { useMemo, useState } from 'react';
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
import { useGetPayrollRunQuery, usePublishPayrollMutation } from '@/store/api/api';

export function PayrollRunPreview({
  runId,
  listHref,
  slipHref,
  canManage,
}: {
  runId: string;
  listHref: string;
  slipHref: (slipId: string) => string;
  canManage: boolean;
}) {
  const { data, isLoading, isError, error } = useGetPayrollRunQuery(runId);
  const [publish, { isLoading: publishing }] = usePublishPayrollMutation();
  const [company, setCompany] = useState('all');
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

  return (
    <>
      <PageHeader kicker="Payroll" title={bundle ? bundle.run.period : 'Run'} />
      <p className="mb-8">
        <Link href={listHref} className="text-sm text-muted hover:text-foreground">
          Back to payroll
        </Link>
      </p>
      {isLoading ? <p className="text-sm text-muted">Loading slips…</p> : null}
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
              { id: 'code', header: 'ID', cell: (row) => row.employeeCode },
              { id: 'name', header: 'Name', cell: (row) => row.employeeName },
              { id: 'company', header: 'Company', cell: (row) => row.companyName },
              { id: 'lop', header: 'LOP', cell: (row) => String(row.lopDays) },
              { id: 'net', header: 'Net', cell: (row) => formatInr(row.net) },
              {
                id: 'open',
                header: '',
                cell: (row) => (
                  <Link href={slipHref(row.id)} className="text-sm text-muted hover:text-foreground">
                    Slip
                  </Link>
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
