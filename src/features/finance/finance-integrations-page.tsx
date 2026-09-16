'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { SELECT_CLASS } from '@/features/finance/finance-constants';
import { formatInr, salesStatusTone } from '@/features/finance/finance-procurement-utils';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import {
  useCancelFinanceEinvoiceMutation,
  useCreateFinancePaymentCheckoutMutation,
  useGenerateFinanceEinvoiceMutation,
  useGenerateFinanceEwayBillMutation,
  useGetFinanceEinvoicesQuery,
  useGetFinanceEwayBillsQuery,
  useGetFinanceGstnJobsQuery,
  useGetFinanceIntegrationSettingsQuery,
  useGetFinanceInvoicesQuery,
  useGetFinancePaymentCheckoutsQuery,
  usePullFinanceGstr2bMutation,
  usePushFinanceGstr1Mutation,
  useUpdateFinanceIntegrationSettingsMutation,
} from '@/store/api/api';
import { PERMISSIONS } from '@/types/permissions';

export function FinanceIntegrationsPage() {
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canView =
    permissions.includes(PERMISSIONS.FINANCE_INTEGRATIONS_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_INTEGRATIONS_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_GST_VIEW) ||
    permissions.includes(PERMISSIONS.FINANCE_GST_MANAGE);
  const canManage =
    permissions.includes(PERMISSIONS.FINANCE_INTEGRATIONS_MANAGE) ||
    permissions.includes(PERMISSIONS.FINANCE_GST_MANAGE);

  const { data: settingsData, isLoading: settingsLoading } = useGetFinanceIntegrationSettingsQuery(
    undefined,
    { skip: !canView },
  );
  const { data: einvoicesData, isLoading: einvoicesLoading } = useGetFinanceEinvoicesQuery(undefined, {
    skip: !canView,
  });
  const { data: ewayData, isLoading: ewayLoading } = useGetFinanceEwayBillsQuery(undefined, {
    skip: !canView,
  });
  const { data: jobsData, isLoading: jobsLoading } = useGetFinanceGstnJobsQuery(undefined, {
    skip: !canView,
  });
  const { data: checkoutsData, isLoading: checkoutsLoading } = useGetFinancePaymentCheckoutsQuery(
    undefined,
    { skip: !canView },
  );
  const { data: invoicesData } = useGetFinanceInvoicesQuery(undefined, { skip: !canManage });

  const [updateSettings, { isLoading: savingSettings }] = useUpdateFinanceIntegrationSettingsMutation();
  const [generateEinvoice, { isLoading: generatingIrn }] = useGenerateFinanceEinvoiceMutation();
  const [cancelEinvoice, { isLoading: cancellingIrn }] = useCancelFinanceEinvoiceMutation();
  const [generateEway, { isLoading: generatingEway }] = useGenerateFinanceEwayBillMutation();
  const [pushGstr1, { isLoading: pushingGstr1 }] = usePushFinanceGstr1Mutation();
  const [pullGstr2b, { isLoading: pullingGstr2b }] = usePullFinanceGstr2bMutation();
  const [createCheckout, { isLoading: creatingCheckout }] = useCreateFinancePaymentCheckoutMutation();

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [invoiceIdForIrn, setInvoiceIdForIrn] = useState('');
  const [ewaySourceType, setEwaySourceType] = useState<'invoice' | 'delivery_note'>('invoice');
  const [ewaySourceId, setEwaySourceId] = useState('');
  const [ewayVehicle, setEwayVehicle] = useState('');
  const now = new Date();
  const [periodYear, setPeriodYear] = useState(String(now.getFullYear()));
  const [periodMonth, setPeriodMonth] = useState(String(now.getMonth() + 1));
  const [checkoutInvoiceId, setCheckoutInvoiceId] = useState('');

  const settings = settingsData?.data;
  const postedInvoices = useMemo(
    () => (invoicesData?.data ?? []).filter((inv) => Boolean(inv.journalId)),
    [invoicesData],
  );

  const busy =
    savingSettings ||
    generatingIrn ||
    cancellingIrn ||
    generatingEway ||
    pushingGstr1 ||
    pullingGstr2b ||
    creatingCheckout;

  async function onSaveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      await updateSettings({
        gspMode: String(form.get('gspMode') ?? 'sandbox') as 'sandbox' | 'live',
        paymentGatewayEnabled: form.get('paymentGatewayEnabled') === 'on',
        paymentGatewayProvider: String(form.get('paymentGatewayProvider') ?? 'none') as
          | 'none'
          | 'razorpay'
          | 'stripe',
        bankFeedEnabled: form.get('bankFeedEnabled') === 'on',
        bankFeedProvider: String(form.get('bankFeedProvider') ?? 'none') as
          | 'none'
          | 'account_aggregator'
          | 'manual_api',
        notes: String(form.get('notes') ?? ''),
      }).unwrap();
      setMessage('Integration settings saved.');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to save settings.'));
    }
  }

  async function onGenerateIrn() {
    if (!invoiceIdForIrn) return;
    setError(null);
    setMessage(null);
    try {
      const result = await generateEinvoice(invoiceIdForIrn).unwrap();
      setMessage(`IRN generated: ${result.data.irn}`);
      setInvoiceIdForIrn('');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to generate IRN.'));
    }
  }

  async function onCancelIrn(id: string) {
    setError(null);
    setMessage(null);
    try {
      await cancelEinvoice({ id, reason: 'Cancelled from portal' }).unwrap();
      setMessage('E-invoice cancelled.');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to cancel e-invoice.'));
    }
  }

  async function onGenerateEway(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const result = await generateEway({
        sourceType: ewaySourceType,
        sourceId: ewaySourceId,
        vehicleNumber: ewayVehicle.trim() || undefined,
        transportMode: 'road',
      }).unwrap();
      setMessage(`E-Way Bill generated: ${result.data.ewbNumber}`);
      setEwaySourceId('');
      setEwayVehicle('');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to generate e-Way Bill.'));
    }
  }

  async function onGstn(kind: 'gstr1' | 'gstr2b') {
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
          ? await pushGstr1({ periodYear: year, periodMonth: month }).unwrap()
          : await pullGstr2b({ periodYear: year, periodMonth: month }).unwrap();
      setMessage(
        `${kind === 'gstr1' ? 'GSTR-1 push' : 'GSTR-2B pull'} ${result.data.status} (${result.data.referenceId || 'no ref'}).`,
      );
    } catch (cause) {
      setError(apiErrorMessage(cause, 'GSTN job failed.'));
    }
  }

  async function onCreateCheckout() {
    if (!checkoutInvoiceId) return;
    setError(null);
    setMessage(null);
    try {
      const result = await createCheckout({ invoiceId: checkoutInvoiceId }).unwrap();
      setMessage(`Checkout created (${result.data.status}): ${result.data.checkoutUrl}`);
      setCheckoutInvoiceId('');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create payment checkout.'));
    }
  }

  if (!canView) {
    return (
      <>
        <PageHeader kicker="GST & Tax" title="Integrations" />
        <p className="max-w-2xl text-sm text-muted">
          You need integrations or GST view permission to open this page.
        </p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay
        active={
          busy ||
          settingsLoading ||
          einvoicesLoading ||
          ewayLoading ||
          jobsLoading ||
          checkoutsLoading
        }
      />
      <PageHeader kicker="GST & Tax" title="Integrations" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Sandbox e-Invoice IRN, e-Way Bill, GSTN sync jobs, and payment checkout intents. Live GSP
        requires credentials — see the finance GSP runbook.
      </p>

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

      <section className="mb-10 space-y-4">
        <h2 className="text-base font-semibold">Settings</h2>
        {settings ? (
          <form onSubmit={onSaveSettings} className="max-w-xl space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="gspMode">GSP mode</Label>
                <select
                  id="gspMode"
                  name="gspMode"
                  className={SELECT_CLASS}
                  defaultValue={settings.gspMode}
                  disabled={!canManage}
                >
                  <option value="sandbox">Sandbox</option>
                  <option value="live">Live</option>
                </select>
              </div>
              <div>
                <Label htmlFor="paymentGatewayProvider">Payment gateway</Label>
                <select
                  id="paymentGatewayProvider"
                  name="paymentGatewayProvider"
                  className={SELECT_CLASS}
                  defaultValue={settings.paymentGatewayProvider}
                  disabled={!canManage}
                >
                  <option value="none">None</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>
              <div>
                <Label htmlFor="bankFeedProvider">Bank feed</Label>
                <select
                  id="bankFeedProvider"
                  name="bankFeedProvider"
                  className={SELECT_CLASS}
                  defaultValue={settings.bankFeedProvider}
                  disabled={!canManage}
                >
                  <option value="none">None</option>
                  <option value="account_aggregator">Account aggregator</option>
                  <option value="manual_api">Manual API</option>
                </select>
              </div>
              <div className="space-y-2 pt-6 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="paymentGatewayEnabled"
                    defaultChecked={settings.paymentGatewayEnabled}
                    disabled={!canManage}
                  />
                  Payment gateway enabled
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="bankFeedEnabled"
                    defaultChecked={settings.bankFeedEnabled}
                    disabled={!canManage}
                  />
                  Bank feed enabled
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" defaultValue={settings.notes} disabled={!canManage} />
            </div>
            <p className="text-xs text-muted">
              Env: GSP credentials {settings.env.gspCredentialsConfigured ? 'configured' : 'missing'} ·
              Payment keys {settings.env.paymentGatewayConfigured ? 'configured' : 'missing'} · Bank feed{' '}
              {settings.env.bankFeedConfigured ? 'configured' : 'missing'}
            </p>
            {canManage ? (
              <Button type="submit" loading={savingSettings}>
                Save settings
              </Button>
            ) : null}
          </form>
        ) : null}
      </section>

      <section className="mb-10 space-y-4">
        <h2 className="text-base font-semibold">E-Invoices (IRN)</h2>
        {canManage ? (
          <div className="flex max-w-xl flex-wrap items-end gap-3">
            <div className="min-w-[14rem] flex-1">
              <Label htmlFor="invoiceIdForIrn">Posted invoice</Label>
              <select
                id="invoiceIdForIrn"
                className={SELECT_CLASS}
                value={invoiceIdForIrn}
                onChange={(event) => setInvoiceIdForIrn(event.target.value)}
              >
                <option value="">Select invoice</option>
                {postedInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.documentNumber} — {inv.customerName || 'Customer'} ({formatInr(inv.grandTotal)})
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" loading={generatingIrn} onClick={() => void onGenerateIrn()}>
              Generate IRN
            </Button>
          </div>
        ) : null}
        <DataTable
          columns={[
            { id: 'invoice', header: 'Invoice', cell: (row) => row.invoiceNumber || row.invoiceId },
            { id: 'mode', header: 'Mode', cell: (row) => row.providerMode },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={salesStatusTone(row.status)} label={row.status} />,
            },
            { id: 'irn', header: 'IRN', cell: (row) => row.irn || '—' },
            { id: 'ack', header: 'Ack', cell: (row) => row.ackNumber || '—' },
            {
              id: 'actions',
              header: '',
              cell: (row) =>
                canManage && row.status === 'generated' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void onCancelIrn(row.id)}
                  >
                    Cancel
                  </Button>
                ) : null,
            },
          ]}
          rows={einvoicesData?.data ?? []}
          loading={einvoicesLoading}
          emptyTitle="No e-invoices"
          emptyDescription="Generate an IRN for a posted invoice."
        />
      </section>

      <section className="mb-10 space-y-4">
        <h2 className="text-base font-semibold">E-Way Bills</h2>
        {canManage ? (
          <form onSubmit={onGenerateEway} className="flex max-w-2xl flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="ewaySourceType">Source</Label>
              <select
                id="ewaySourceType"
                className={SELECT_CLASS}
                value={ewaySourceType}
                onChange={(event) =>
                  setEwaySourceType(event.target.value as 'invoice' | 'delivery_note')
                }
              >
                <option value="invoice">Invoice</option>
                <option value="delivery_note">Delivery note</option>
              </select>
            </div>
            <div className="min-w-[12rem] flex-1">
              <Label htmlFor="ewaySourceId">Source ID</Label>
              <Input
                id="ewaySourceId"
                value={ewaySourceId}
                onChange={(event) => setEwaySourceId(event.target.value)}
                placeholder="UUID"
                required
              />
            </div>
            <div>
              <Label htmlFor="ewayVehicle">Vehicle</Label>
              <Input
                id="ewayVehicle"
                value={ewayVehicle}
                onChange={(event) => setEwayVehicle(event.target.value)}
                placeholder="MH12AB1234"
              />
            </div>
            <Button type="submit" loading={generatingEway}>
              Generate e-Way
            </Button>
          </form>
        ) : null}
        <DataTable
          columns={[
            {
              id: 'source',
              header: 'Source',
              cell: (row) => `${row.sourceType}: ${row.sourceNumber || row.sourceId}`,
            },
            { id: 'mode', header: 'Mode', cell: (row) => row.providerMode },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={salesStatusTone(row.status)} label={row.status} />,
            },
            { id: 'ewb', header: 'EWB', cell: (row) => row.ewbNumber || '—' },
            { id: 'vehicle', header: 'Vehicle', cell: (row) => row.vehicleNumber || '—' },
            { id: 'valid', header: 'Valid until', cell: (row) => row.validUntil || '—' },
          ]}
          rows={ewayData?.data ?? []}
          loading={ewayLoading}
          emptyTitle="No e-Way bills"
          emptyDescription="Generate from a posted invoice or delivered DN."
        />
      </section>

      <section className="mb-10 space-y-4">
        <h2 className="text-base font-semibold">GSTN jobs</h2>
        {canManage ? (
          <div className="flex max-w-md flex-wrap items-end gap-3">
            <div className="min-w-[8rem] flex-1">
              <Label htmlFor="periodYear">Year</Label>
              <Input
                id="periodYear"
                type="number"
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
            <Button type="button" loading={pushingGstr1} onClick={() => void onGstn('gstr1')}>
              Push GSTR-1
            </Button>
            <Button
              type="button"
              variant="outline"
              loading={pullingGstr2b}
              onClick={() => void onGstn('gstr2b')}
            >
              Pull GSTR-2B
            </Button>
          </div>
        ) : null}
        <DataTable
          columns={[
            { id: 'type', header: 'Type', cell: (row) => row.jobType },
            {
              id: 'period',
              header: 'Period',
              cell: (row) => `${row.periodYear}-${String(row.periodMonth).padStart(2, '0')}`,
            },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={salesStatusTone(row.status)} label={row.status} />,
            },
            { id: 'rows', header: 'Rows', cell: (row) => String(row.rowCount) },
            { id: 'ref', header: 'Reference', cell: (row) => row.referenceId || '—' },
            { id: 'created', header: 'Created', cell: (row) => row.createdAt.slice(0, 19) },
          ]}
          rows={jobsData?.data ?? []}
          loading={jobsLoading}
          emptyTitle="No GSTN jobs"
          emptyDescription="Push GSTR-1 or pull GSTR-2B for a period."
        />
      </section>

      <section className="mb-6 space-y-4">
        <h2 className="text-base font-semibold">Payment checkouts</h2>
        {canManage ? (
          <div className="flex max-w-xl flex-wrap items-end gap-3">
            <div className="min-w-[14rem] flex-1">
              <Label htmlFor="checkoutInvoiceId">Posted invoice</Label>
              <select
                id="checkoutInvoiceId"
                className={SELECT_CLASS}
                value={checkoutInvoiceId}
                onChange={(event) => setCheckoutInvoiceId(event.target.value)}
              >
                <option value="">Select invoice</option>
                {postedInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.documentNumber} — due {formatInr(Math.max(0, inv.grandTotal - inv.amountPaid))}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" loading={creatingCheckout} onClick={() => void onCreateCheckout()}>
              Create checkout
            </Button>
          </div>
        ) : null}
        <DataTable
          columns={[
            {
              id: 'invoice',
              header: 'Invoice',
              cell: (row) => row.invoiceNumber || row.invoiceId,
            },
            { id: 'amount', header: 'Amount', cell: (row) => formatInr(row.amount) },
            { id: 'provider', header: 'Provider', cell: (row) => row.provider },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={salesStatusTone(row.status)} label={row.status} />,
            },
            { id: 'url', header: 'Checkout URL', cell: (row) => row.checkoutUrl || '—' },
          ]}
          rows={checkoutsData?.data ?? []}
          loading={checkoutsLoading}
          emptyTitle="No checkout intents"
          emptyDescription="Enable the payment gateway in settings, then create a checkout."
        />
      </section>
    </>
  );
}
