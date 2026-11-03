'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/page-loading';
import { StatusMessage } from '@/components/ui/status-message';
import { buildInvoiceHtml, printInvoice } from '@/features/hr-invoices/invoice-document';
import { InvoiceEmailDialog } from '@/features/hr-invoices/invoice-email-dialog';
import { downloadInvoicePdf } from '@/features/hr-invoices/invoice-pdf';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useGetHrInvoiceQuery } from '@/store/api/api';

export function HrInvoiceViewPage({ invoiceId }: { invoiceId: string }) {
  const { data, isLoading, isError, error } = useGetHrInvoiceQuery(invoiceId);
  const invoice = data?.data;
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  function onPrint() {
    if (!invoice) return;
    const opened = printInvoice(invoice);
    if (!opened) toast.error('Allow pop-ups to print the invoice.');
  }

  async function onDownload() {
    if (!invoice || downloading) return;
    setDownloading(true);
    try {
      await downloadInvoicePdf(invoice);
      toast.success('Invoice downloaded.');
    } catch {
      toast.error('Unable to download the invoice.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <PageHeader kicker="HR" title={invoice ? `Invoice ${invoice.invoiceNumber}` : 'Invoice'} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/hr/invoices" className="text-sm text-muted hover:text-foreground">
          Back to invoices
        </Link>
        {invoice ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
              Email
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onPrint}>
              Print
            </Button>
            <Button type="button" variant="outline" size="sm" loading={downloading} onClick={() => void onDownload()}>
              {downloading ? 'Downloading' : 'Download PDF'}
            </Button>
          </div>
        ) : null}
      </div>
      {isLoading ? <PageLoading compact message="Loading invoice…" /> : null}
      {isError ? <StatusMessage tone="danger">{apiErrorMessage(error, 'Unable to load this invoice.')}</StatusMessage> : null}
      {invoice ? (
        <iframe
          title={`Invoice ${invoice.invoiceNumber}`}
          className="h-[1120px] w-full rounded border border-border bg-white"
          srcDoc={buildInvoiceHtml(invoice)}
        />
      ) : null}
      <InvoiceEmailDialog
        invoice={invoice ?? null}
        open={emailOpen && Boolean(invoice)}
        onOpenChange={setEmailOpen}
      />
    </>
  );
}
