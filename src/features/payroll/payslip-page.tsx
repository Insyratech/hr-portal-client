'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { StatusMessage } from '@/components/ui/status-message';
import { SalarySlipDocument } from '@/features/payroll/salary-slip-document';
import { apiErrorMessage } from '@/lib/api-error';
import { useGetPayslipQuery } from '@/store/api/api';

export function PayslipPage({
  slipId,
  backHref,
  backLabel,
}: {
  slipId: string;
  backHref: string;
  backLabel: string;
}) {
  const { data, isLoading, isError, error } = useGetPayslipQuery(slipId);
  const slip = data?.data;

  return (
    <>
      <PageHeader kicker="Payroll" title="Salary slip" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={backHref} className="text-sm text-muted hover:text-foreground">
          {backLabel}
        </Link>
        {slip ? (
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            Print
          </Button>
        ) : null}
      </div>
      {isLoading ? <p className="text-sm text-muted">Loading slip…</p> : null}
      {isError ? <StatusMessage tone="danger">{apiErrorMessage(error, 'Unable to load this slip.')}</StatusMessage> : null}
      {slip ? <SalarySlipDocument slip={slip} /> : null}
    </>
  );
}
