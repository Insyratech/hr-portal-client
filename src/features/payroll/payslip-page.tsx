'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { StatusMessage } from '@/components/ui/status-message';
import { SalarySlipDocument } from '@/features/payroll/salary-slip-document';
import { downloadSalarySlipPdf, printSalarySlip } from '@/features/payroll/salary-slip-print';
import { apiErrorMessage } from '@/lib/api-error';
import { useGetPayslipQuery } from '@/store/api/api';
import { useToast } from '@/hooks/use-toast';

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
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  function onPrint() {
    if (!slip) return;
    const opened = printSalarySlip(slip);
    if (!opened) {
      toast.error('Allow pop-ups to print the salary slip.');
    }
  }

  async function onDownload() {
    if (!slip || downloading) return;
    setDownloading(true);
    try {
      await downloadSalarySlipPdf(slip);
      toast.success('Salary slip PDF downloaded.');
    } catch {
      toast.error('Unable to download the salary slip PDF.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <PageHeader kicker="Payroll" title="Salary slip" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="text-sm text-muted hover:text-foreground">
          {backLabel}
        </Link>
        {slip ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onPrint}>
              Print
            </Button>
            <Button type="button" variant="outline" size="sm" loading={downloading} onClick={() => void onDownload()}>
              {downloading ? 'Downloading' : 'Download PDF'}
            </Button>
          </div>
        ) : null}
      </div>
      {isLoading ? <PageLoading compact message="Loading slip…" /> : null}
      {isError ? <StatusMessage tone="danger">{apiErrorMessage(error, 'Unable to load this slip.')}</StatusMessage> : null}
      {slip ? <SalarySlipDocument slip={slip} /> : null}
    </>
  );
}
