'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { downloadCsv } from '@/features/finance/finance-gst-utils';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useLazyExportFinanceGstr1Query,
  useLazyExportFinanceGstr2bQuery,
} from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceGstWorkbooksPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_GST_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_GST_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_TAX_MANAGE);

  const now = new Date();
  const [periodYear, setPeriodYear] = useState(String(now.getFullYear()));
  const [periodMonth, setPeriodMonth] = useState(String(now.getMonth() + 1));
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [exportGstr1, { isFetching: exporting1 }] = useLazyExportFinanceGstr1Query();
  const [exportGstr2b, { isFetching: exporting2 }] = useLazyExportFinanceGstr2bQuery();

  async function onExport(kind: 'gstr1' | 'gstr2b') {
    setError(null);
    setMessage(null);
    const year = Number(periodYear);
    const month = Number(periodMonth);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      setError('Enter a valid year and month (1–12).');
      return;
    }
    try {
      const result =
        kind === 'gstr1'
          ? await exportGstr1({ periodYear: year, periodMonth: month }).unwrap()
          : await exportGstr2b({ periodYear: year, periodMonth: month }).unwrap();
      downloadCsv(result.data.filename, result.data.csv, result.data.contentType);
      setMessage(`Downloaded ${result.data.filename} (${result.data.rowCount} rows).`);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to export workbook.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="GST & Tax" title="Workbooks" />
        <p className="max-w-2xl text-sm text-muted">You need GST view permission to export workbooks.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={exporting1 || exporting2} />
      <PageHeader kicker="GST & Tax" title="Workbooks" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Download GSTR-1 and GSTR-2B style CSV workbooks for a month. GSTN filing is deferred.
      </p>

      <div className="mb-6 flex max-w-md flex-wrap items-end gap-3">
        <div className="min-w-[8rem] flex-1">
          <Label htmlFor="periodYear">Year</Label>
          <Input
            id="periodYear"
            type="number"
            min={2000}
            max={2100}
            value={periodYear}
            onChange={(event) => setPeriodYear(event.target.value)}
          />
        </div>
        <div className="min-w-[8rem] flex-1">
          <Label htmlFor="periodMonth">Month</Label>
          <Input
            id="periodMonth"
            type="number"
            min={1}
            max={12}
            value={periodMonth}
            onChange={(event) => setPeriodMonth(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {message ? (
        <div className="mb-4">
          <StatusMessage tone="success">{message}</StatusMessage>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => void onExport('gstr1')} disabled={exporting1 || exporting2}>
          Download GSTR-1 CSV
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void onExport('gstr2b')}
          disabled={exporting1 || exporting2}
        >
          Download GSTR-2B CSV
        </Button>
      </div>
    </>
  );
}
