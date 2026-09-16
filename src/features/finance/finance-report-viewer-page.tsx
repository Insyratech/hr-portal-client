'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { defaultMonthRange } from '@/features/finance/finance-gst-utils';
import { formatInr } from '@/features/finance/finance-procurement-utils';
import { useAppSelector } from '@/store/hooks';
import {
  useGetFinanceActivityReportQuery,
  useGetFinanceApAgingQuery,
  useGetFinanceArAgingQuery,
  useGetFinanceBalanceSheetQuery,
  useGetFinanceBankingReconSummaryQuery,
  useGetFinanceCashFlowReportQuery,
  useGetFinanceCustomerBalancesQuery,
  useGetFinanceInvoiceDetailsReportQuery,
  useGetFinancePoStatusQuery,
  useGetFinanceProfitLossQuery,
  useGetFinancePurchasesByItemQuery,
  useGetFinancePurchasesByVendorQuery,
  useGetFinanceReportCatalogQuery,
  useGetFinanceSalesByCustomerQuery,
  useGetFinanceSalesByItemQuery,
  useGetFinanceTaxSummaryQuery,
  useGetFinanceVendorBalancesQuery,
} from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

type RangeMode = 'range' | 'asOf' | 'none';

const REPORT_META: Record<string, { title: string; mode: RangeMode }> = {
  'profit-loss': { title: 'Profit and loss', mode: 'range' },
  'balance-sheet': { title: 'Balance sheet', mode: 'asOf' },
  'cash-flow': { title: 'Cash flow', mode: 'range' },
  'sales-by-customer': { title: 'Sales by customer', mode: 'range' },
  'sales-by-item': { title: 'Sales by item', mode: 'range' },
  'invoice-details': { title: 'Invoice details', mode: 'range' },
  'ar-aging': { title: 'AR aging', mode: 'asOf' },
  'customer-balances': { title: 'Customer balances', mode: 'asOf' },
  'ap-aging': { title: 'AP aging', mode: 'asOf' },
  'vendor-balances': { title: 'Vendor balances', mode: 'asOf' },
  'po-status': { title: 'PO status', mode: 'none' },
  'purchases-by-vendor': { title: 'Purchases by vendor', mode: 'range' },
  'purchases-by-item': { title: 'Purchases by item', mode: 'range' },
  'tax-summary': { title: 'Tax summary', mode: 'range' },
  'banking-reconciliation': { title: 'Banking reconciliation', mode: 'none' },
  activity: { title: 'Document activity', mode: 'range' },
};

function todayIso(): string {
  return defaultMonthRange().toDate;
}

export function FinanceReportViewerPage() {
  const params = useParams<{ reportId: string }>();
  const reportId = params.reportId;
  const meta = REPORT_META[reportId];

  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_REPORTS_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_ACCOUNTANT_MANAGE);

  const defaults = useMemo(() => defaultMonthRange(), []);
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [asOfDate, setAsOfDate] = useState(todayIso());
  const [appliedRange, setAppliedRange] = useState(defaults);
  const [appliedAsOf, setAppliedAsOf] = useState(todayIso());
  const [ran, setRan] = useState(meta?.mode === 'none');

  const skip = !canView || !meta || (meta.mode !== 'none' && !ran);
  const rangeArgs = appliedRange;
  const asOfArgs = { asOfDate: appliedAsOf };

  const { data: catalogData } = useGetFinanceReportCatalogQuery(undefined, { skip: !canView });
  const catalogItem = catalogData?.data?.find((item) => item.id === reportId);

  const profitLoss = useGetFinanceProfitLossQuery(rangeArgs, {
    skip: skip || reportId !== 'profit-loss',
  });
  const balanceSheet = useGetFinanceBalanceSheetQuery(asOfArgs, {
    skip: skip || reportId !== 'balance-sheet',
  });
  const cashFlow = useGetFinanceCashFlowReportQuery(rangeArgs, {
    skip: skip || reportId !== 'cash-flow',
  });
  const salesByCustomer = useGetFinanceSalesByCustomerQuery(rangeArgs, {
    skip: skip || reportId !== 'sales-by-customer',
  });
  const salesByItem = useGetFinanceSalesByItemQuery(rangeArgs, {
    skip: skip || reportId !== 'sales-by-item',
  });
  const invoiceDetails = useGetFinanceInvoiceDetailsReportQuery(rangeArgs, {
    skip: skip || reportId !== 'invoice-details',
  });
  const arAging = useGetFinanceArAgingQuery(asOfArgs, { skip: skip || reportId !== 'ar-aging' });
  const customerBalances = useGetFinanceCustomerBalancesQuery(asOfArgs, {
    skip: skip || reportId !== 'customer-balances',
  });
  const apAging = useGetFinanceApAgingQuery(asOfArgs, { skip: skip || reportId !== 'ap-aging' });
  const vendorBalances = useGetFinanceVendorBalancesQuery(asOfArgs, {
    skip: skip || reportId !== 'vendor-balances',
  });
  const poStatus = useGetFinancePoStatusQuery(undefined, { skip: skip || reportId !== 'po-status' });
  const purchasesByVendor = useGetFinancePurchasesByVendorQuery(rangeArgs, {
    skip: skip || reportId !== 'purchases-by-vendor',
  });
  const purchasesByItem = useGetFinancePurchasesByItemQuery(rangeArgs, {
    skip: skip || reportId !== 'purchases-by-item',
  });
  const taxSummary = useGetFinanceTaxSummaryQuery(rangeArgs, {
    skip: skip || reportId !== 'tax-summary',
  });
  const bankingRecon = useGetFinanceBankingReconSummaryQuery(undefined, {
    skip: skip || reportId !== 'banking-reconciliation',
  });
  const activity = useGetFinanceActivityReportQuery(rangeArgs, {
    skip: skip || reportId !== 'activity',
  });

  const activeQuery = (() => {
    switch (reportId) {
      case 'profit-loss':
        return profitLoss;
      case 'balance-sheet':
        return balanceSheet;
      case 'cash-flow':
        return cashFlow;
      case 'sales-by-customer':
        return salesByCustomer;
      case 'sales-by-item':
        return salesByItem;
      case 'invoice-details':
        return invoiceDetails;
      case 'ar-aging':
        return arAging;
      case 'customer-balances':
        return customerBalances;
      case 'ap-aging':
        return apAging;
      case 'vendor-balances':
        return vendorBalances;
      case 'po-status':
        return poStatus;
      case 'purchases-by-vendor':
        return purchasesByVendor;
      case 'purchases-by-item':
        return purchasesByItem;
      case 'tax-summary':
        return taxSummary;
      case 'banking-reconciliation':
        return bankingRecon;
      case 'activity':
        return activity;
      default:
        return null;
    }
  })();

  const isLoading = activeQuery?.isLoading ?? false;
  const isFetching = activeQuery?.isFetching ?? false;
  const isError = activeQuery?.isError ?? false;

  if (!canView) {
    return (
      <>
        <PageHeader kicker="Reports" title="Report" />
        <p className="max-w-2xl text-sm text-muted">You need reports view permission to open this report.</p>
      </>
    );
  }

  if (!meta) {
    return (
      <>
        <PageHeader kicker="Reports" title="Unknown report" />
        <p className="mb-4 max-w-2xl text-sm text-muted">This report id is not available.</p>
        <Link href="/finance/reports" className="text-sm underline-offset-2 hover:underline">
          Back to reports center
        </Link>
      </>
    );
  }

  const title = catalogItem?.title ?? meta.title;

  return (
    <>
      <PageHeader kicker="Reports" title={title} />
      <p className="mb-4 max-w-2xl text-sm text-muted">
        <Link href="/finance/reports" className="underline-offset-2 hover:underline">
          Reports center
        </Link>
        {catalogItem?.description ? ` · ${catalogItem.description}` : null}
      </p>

      {meta.mode === 'range' ? (
        <form
          className="mb-6 flex max-w-2xl flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedRange({ fromDate, toDate });
            setRan(true);
          }}
        >
          <div className="min-w-[10rem] flex-1">
            <Label htmlFor="fromDate">From</Label>
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              required
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <Label htmlFor="toDate">To</Label>
            <Input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={isFetching}>
            {isFetching ? 'Loading…' : 'Run'}
          </Button>
        </form>
      ) : null}

      {meta.mode === 'asOf' ? (
        <form
          className="mb-6 flex max-w-md flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedAsOf(asOfDate);
            setRan(true);
          }}
        >
          <div className="min-w-[12rem] flex-1">
            <Label htmlFor="asOfDate">As of date</Label>
            <Input
              id="asOfDate"
              type="date"
              value={asOfDate}
              onChange={(event) => setAsOfDate(event.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={isFetching}>
            {isFetching ? 'Loading…' : 'Run'}
          </Button>
        </form>
      ) : null}

      {isError ? <p className="mb-4 text-sm">Unable to load this report.</p> : null}

      {reportId === 'profit-loss' && profitLoss.data?.data ? (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 text-sm text-muted">
            <span>Income {formatInr(profitLoss.data.data.totalIncome)}</span>
            <span>Expenses {formatInr(profitLoss.data.data.totalExpenses)}</span>
            <span>Net profit {formatInr(profitLoss.data.data.netProfit)}</span>
          </div>
          <DataTable
            columns={[
              { id: 'label', header: 'Account', cell: (row) => row.label },
              { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount) },
            ]}
            rows={[
              ...profitLoss.data.data.income.map((r) => ({ ...r, id: `i-${r.key}`, section: 'Income' })),
              ...profitLoss.data.data.expenses.map((r) => ({
                ...r,
                id: `e-${r.key}`,
                section: 'Expense',
              })),
            ]}
            loading={isLoading}
            emptyTitle="No activity"
            emptyDescription="No income or expense in this period."
          />
        </div>
      ) : null}

      {reportId === 'balance-sheet' && balanceSheet.data?.data ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <StatusBadge
              status={balanceSheet.data.data.isBalanced ? 'approved' : 'rejected'}
              label={balanceSheet.data.data.isBalanced ? 'Balanced' : 'Out of balance'}
            />
            <span className="text-muted">Assets {formatInr(balanceSheet.data.data.totalAssets)}</span>
            <span className="text-muted">
              Liabilities {formatInr(balanceSheet.data.data.totalLiabilities)}
            </span>
            <span className="text-muted">Equity {formatInr(balanceSheet.data.data.totalEquity)}</span>
          </div>
          <DataTable
            columns={[
              { id: 'section', header: 'Section', cell: (row) => row.section },
              { id: 'label', header: 'Account', cell: (row) => row.label },
              { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount) },
            ]}
            rows={[
              ...balanceSheet.data.data.assets.map((r) => ({ ...r, id: `a-${r.key}`, section: 'Asset' })),
              ...balanceSheet.data.data.liabilities.map((r) => ({
                ...r,
                id: `l-${r.key}`,
                section: 'Liability',
              })),
              ...balanceSheet.data.data.equity.map((r) => ({ ...r, id: `eq-${r.key}`, section: 'Equity' })),
            ]}
            loading={isLoading}
            emptyTitle="No balances"
            emptyDescription="No balance sheet lines as of this date."
          />
        </div>
      ) : null}

      {reportId === 'cash-flow' && cashFlow.data?.data ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted">
            <span>Opening {formatInr(cashFlow.data.data.openingCash)}</span>
            <span>Net change {formatInr(cashFlow.data.data.netChange)}</span>
            <span>Closing {formatInr(cashFlow.data.data.closingCash)}</span>
          </div>
          <DataTable
            columns={[
              { id: 'section', header: 'Category', cell: (row) => row.section },
              { id: 'label', header: 'Source', cell: (row) => row.label },
              { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount) },
            ]}
            rows={[
              ...cashFlow.data.data.operating.map((r) => ({
                ...r,
                id: `o-${r.key}`,
                section: 'Operating',
              })),
              ...cashFlow.data.data.investing.map((r) => ({
                ...r,
                id: `i-${r.key}`,
                section: 'Investing',
              })),
              ...cashFlow.data.data.financing.map((r) => ({
                ...r,
                id: `f-${r.key}`,
                section: 'Financing',
              })),
            ]}
            loading={isLoading}
            emptyTitle="No cash movements"
            emptyDescription="No bank/cash journal activity in this period."
          />
        </div>
      ) : null}

      {(reportId === 'sales-by-customer' ||
        reportId === 'sales-by-item' ||
        reportId === 'purchases-by-vendor' ||
        reportId === 'purchases-by-item' ||
        reportId === 'customer-balances' ||
        reportId === 'vendor-balances') &&
      ran ? (
        <DataTable
          columns={[
            {
              id: 'name',
              header: 'Name',
              cell: (row) =>
                row.href ? (
                  <Link href={row.href} className="underline-offset-2 hover:underline">
                    {row.name}
                  </Link>
                ) : (
                  row.name
                ),
            },
            {
              id: 'count',
              header: 'Count',
              cell: (row) => (row.count != null ? String(row.count) : '—'),
            },
            { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount) },
          ]}
          rows={
            (reportId === 'sales-by-customer'
              ? salesByCustomer.data?.data
              : reportId === 'sales-by-item'
                ? salesByItem.data?.data
                : reportId === 'purchases-by-vendor'
                  ? purchasesByVendor.data?.data
                  : reportId === 'purchases-by-item'
                    ? purchasesByItem.data?.data
                    : reportId === 'customer-balances'
                      ? customerBalances.data?.data
                      : vendorBalances.data?.data) ?? []
          }
          loading={isLoading || isFetching}
          emptyTitle="No rows"
          emptyDescription="Nothing to show for this report."
        />
      ) : null}

      {reportId === 'invoice-details' && invoiceDetails.data?.data ? (
        <DataTable
          columns={[
            {
              id: 'doc',
              header: 'Invoice',
              cell: (row) => (
                <Link href={row.href} className="underline-offset-2 hover:underline">
                  {row.documentNumber}
                </Link>
              ),
            },
            { id: 'date', header: 'Date', cell: (row) => row.invoiceDate },
            { id: 'customer', header: 'Customer', cell: (row) => row.customerName ?? '—' },
            { id: 'status', header: 'Status', cell: (row) => row.status },
            { id: 'total', header: 'Total', cell: (row) => formatInr(row.grandTotal) },
            { id: 'due', header: 'Due', cell: (row) => formatInr(row.amountDue) },
          ]}
          rows={invoiceDetails.data.data}
          loading={isLoading}
          emptyTitle="No invoices"
          emptyDescription="No posted invoices in this period."
        />
      ) : null}

      {(reportId === 'ar-aging' || reportId === 'ap-aging') &&
      (arAging.data?.data || apAging.data?.data) ? (
        <div className="space-y-4">
          {(() => {
            const report = reportId === 'ar-aging' ? arAging.data!.data : apAging.data!.data;
            return (
              <>
                <div className="flex flex-wrap gap-4 text-sm text-muted">
                  <span>Current {formatInr(report.totals.current)}</span>
                  <span>1–30 {formatInr(report.totals.days1to30)}</span>
                  <span>31–60 {formatInr(report.totals.days31to60)}</span>
                  <span>61+ {formatInr(report.totals.days61plus)}</span>
                  <span>Total {formatInr(report.totals.total)}</span>
                </div>
                <DataTable
                  columns={[
                    {
                      id: 'party',
                      header: reportId === 'ar-aging' ? 'Customer' : 'Vendor',
                      cell: (row) => (
                        <Link href={row.href} className="underline-offset-2 hover:underline">
                          {row.partyName}
                        </Link>
                      ),
                    },
                    { id: 'current', header: 'Current', cell: (row) => formatInr(row.buckets.current) },
                    { id: 'd30', header: '1–30', cell: (row) => formatInr(row.buckets.days1to30) },
                    { id: 'd60', header: '31–60', cell: (row) => formatInr(row.buckets.days31to60) },
                    { id: 'd61', header: '61+', cell: (row) => formatInr(row.buckets.days61plus) },
                    { id: 'total', header: 'Total', cell: (row) => formatInr(row.buckets.total) },
                  ]}
                  rows={report.rows.map((row) => ({ ...row, id: row.partyId }))}
                  loading={isLoading}
                  emptyTitle="No open balances"
                  emptyDescription="Nothing outstanding as of this date."
                />
              </>
            );
          })()}
        </div>
      ) : null}

      {reportId === 'po-status' && poStatus.data?.data ? (
        <DataTable
          columns={[
            {
              id: 'doc',
              header: 'PO',
              cell: (row) => (
                <Link href={row.href} className="underline-offset-2 hover:underline">
                  {row.documentNumber}
                </Link>
              ),
            },
            { id: 'date', header: 'Order date', cell: (row) => row.orderDate },
            { id: 'vendor', header: 'Vendor', cell: (row) => row.vendorName ?? '—' },
            { id: 'status', header: 'Status', cell: (row) => row.status },
            { id: 'total', header: 'Total', cell: (row) => formatInr(row.grandTotal) },
          ]}
          rows={poStatus.data.data}
          loading={isLoading}
          emptyTitle="No open POs"
          emptyDescription="No purchase orders in progress."
        />
      ) : null}

      {reportId === 'tax-summary' && taxSummary.data?.data ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted">
            <span>Outward taxable {formatInr(taxSummary.data.data.outwardTaxable)}</span>
            <span>Outward tax {formatInr(taxSummary.data.data.outwardTax)}</span>
            <span>Inward taxable {formatInr(taxSummary.data.data.inwardTaxable)}</span>
            <span>ITC eligible {formatInr(taxSummary.data.data.itcEligible)}</span>
            <span>Net GST {formatInr(taxSummary.data.data.netGstLiability)}</span>
          </div>
          <DataTable
            columns={[
              {
                id: 'label',
                header: 'Register',
                cell: (row) => (
                  <Link href={row.href} className="underline-offset-2 hover:underline">
                    {row.label}
                  </Link>
                ),
              },
            ]}
            rows={taxSummary.data.data.links.map((link) => ({
              id: link.href,
              label: link.label,
              href: link.href,
            }))}
            loading={isLoading}
            emptyTitle="No links"
            emptyDescription="GST registers are linked from the tax summary."
          />
        </div>
      ) : null}

      {reportId === 'banking-reconciliation' && bankingRecon.data?.data ? (
        <DataTable
          columns={[
            {
              id: 'name',
              header: 'Account',
              cell: (row) => (
                <Link href={row.href} className="underline-offset-2 hover:underline">
                  {row.bankAccountName}
                </Link>
              ),
            },
            { id: 'unmatched', header: 'Unmatched', cell: (row) => String(row.unmatchedCount) },
            { id: 'matched', header: 'Matched', cell: (row) => String(row.matchedCount) },
            { id: 'categorized', header: 'Categorized', cell: (row) => String(row.categorizedCount) },
          ]}
          rows={bankingRecon.data.data.map((row) => ({ ...row, id: row.bankAccountId }))}
          loading={isLoading}
          emptyTitle="No bank accounts"
          emptyDescription="Add a bank account to see reconciliation status."
        />
      ) : null}

      {reportId === 'activity' && activity.data?.data ? (
        <DataTable
          columns={[
            { id: 'when', header: 'When', cell: (row) => new Date(row.createdAt).toLocaleString() },
            { id: 'action', header: 'Action', cell: (row) => row.action },
            { id: 'entity', header: 'Entity', cell: (row) => row.entityType },
            {
              id: 'link',
              header: 'Open',
              cell: (row) =>
                row.href ? (
                  <Link href={row.href} className="underline-offset-2 hover:underline">
                    View
                  </Link>
                ) : (
                  '—'
                ),
            },
          ]}
          rows={activity.data.data}
          loading={isLoading}
          emptyTitle="No activity"
          emptyDescription="No finance audit events in this period."
        />
      ) : null}

      {!ran && meta.mode !== 'none' ? (
        <p className="text-sm text-muted">Choose dates and run the report.</p>
      ) : null}
    </>
  );
}
