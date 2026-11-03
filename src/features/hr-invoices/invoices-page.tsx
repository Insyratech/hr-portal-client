'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { formatInvoiceDate, formatInvoiceMoney } from '@/features/hr-invoices/invoice-document';
import { downloadInvoicePdf } from '@/features/hr-invoices/invoice-pdf';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import {
  useCreateHrInvoiceMutation,
  useGetCompaniesQuery,
  useGetHrInvoiceClientsQuery,
  useGetHrInvoicesQuery,
  useLazyGetHrInvoiceQuery,
} from '@/store/api/api';
import type { HrInvoiceCurrency } from '@/types/api';

type DraftLine = {
  key: string;
  description: string;
  detail: string;
  quantity: string;
  unitPrice: string;
};

const CURRENCIES: HrInvoiceCurrency[] = ['INR', 'GBP', 'USD', 'EUR'];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyLine(): DraftLine {
  return { key: crypto.randomUUID(), description: '', detail: '', quantity: '1', unitPrice: '' };
}

function fieldClass(): string {
  return 'h-10 w-full rounded border border-border bg-background px-3 text-sm shadow-card outline-none';
}

export function HrInvoicesPage() {
  const toast = useToast();
  const { data: invoices, isLoading, isError, error: listError } = useGetHrInvoicesQuery();
  const { data: companies } = useGetCompaniesQuery();
  const { data: clients } = useGetHrInvoiceClientsQuery();
  const [createInvoice, { isLoading: creating }] = useCreateHrInvoiceMutation();
  const [loadInvoice] = useLazyGetHrInvoiceQuery();
  const [formOpen, setFormOpen] = useState(false);
  const [step, setStep] = useState<'company' | 'details'>('company');
  const [companyId, setCompanyId] = useState('');
  const [clientMode, setClientMode] = useState<'previous' | 'new'>('new');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [issueDate, setIssueDate] = useState(todayIso);
  const [dueDate, setDueDate] = useState(todayIso);
  const [reference, setReference] = useState('');
  const [currency, setCurrency] = useState<HrInvoiceCurrency>('INR');
  const [issuerEmail, setIssuerEmail] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const activeCompanies = useMemo(
    () => (companies?.data ?? []).filter((company) => company.status === 'active'),
    [companies],
  );
  const company = activeCompanies.find((item) => item.id === companyId) ?? null;
  const previousClients = clients?.data ?? [];
  const selectedClient = previousClients.find((item) => item.id === clientId) ?? null;

  function openForm() {
    setError(null);
    setStep('company');
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setError(null);
  }

  function continueFromCompany() {
    if (!company) {
      setError('Choose the company that issues this invoice.');
      return;
    }
    setError(null);
    setSignatureName((current) => current || company.name);
    setClientMode(previousClients.length > 0 ? 'previous' : 'new');
    setStep('details');
  }

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  async function onDownload(id: string) {
    setDownloadingId(id);
    try {
      const result = await loadInvoice(id).unwrap();
      await downloadInvoicePdf(result.data);
      toast.success('Invoice downloaded.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to download this invoice.'));
    } finally {
      setDownloadingId(null);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!company) return;
    setError(null);
    const parsed = lines.map((line) => ({
      description: line.description.trim(),
      detail: line.detail.trim(),
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
    }));
    if (parsed.some((line) => !line.description)) {
      setError('Each line needs a description.');
      return;
    }
    if (parsed.some((line) => !Number.isFinite(line.quantity) || line.quantity <= 0)) {
      setError('Each line needs a quantity above 0.');
      return;
    }
    if (parsed.some((line) => !Number.isFinite(line.unitPrice) || line.unitPrice < 0)) {
      setError('Each line needs a unit price of 0 or more.');
      return;
    }
    if (dueDate < issueDate) {
      setError('Due date cannot be before the issue date.');
      return;
    }
    try {
      await createInvoice({
        companyId: company.id,
        clientId: clientMode === 'previous' ? clientId : null,
        client: clientMode === 'new' ? { name: clientName.trim(), address: clientAddress.trim() } : null,
        issueDate,
        dueDate,
        reference: reference.trim(),
        currency,
        issuerEmail: issuerEmail.trim(),
        signatureName: signatureName.trim(),
        lines: parsed,
      }).unwrap();
      toast.success('Invoice created.');
      setFormOpen(false);
      setStep('company');
      setLines([emptyLine()]);
      setReference('');
      setClientName('');
      setClientAddress('');
      setClientId('');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create the invoice.'));
    }
  }

  return (
    <>
      <PageHeader
        kicker="HR"
        title="Freelancer invoices"
        actions={
          <Button type="button" onClick={() => (formOpen ? closeForm() : openForm())}>
            {formOpen ? 'Close form' : 'New invoice'}
          </Button>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Choose a company, bill a new or previous client, and download the invoice. Saved bills stay in the table below.
      </p>

      {formOpen ? (
        <section className="mb-8 rounded border border-border bg-background p-6 shadow-card">
          {step === 'company' ? (
            <div className="max-w-lg space-y-4">
              <h2 className="text-lg font-semibold">Company</h2>
              <p className="text-sm text-muted">The company name, address, and logo are printed on the invoice.</p>
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
              <div>
                <Label htmlFor="invoice-company">Issuing company</Label>
                <select
                  id="invoice-company"
                  className={fieldClass()}
                  value={companyId}
                  onChange={(event) => setCompanyId(event.target.value)}
                >
                  <option value="">Select a company</option>
                  {activeCompanies.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              {company?.address ? <p className="text-sm text-muted whitespace-pre-line">{company.address}</p> : null}
              <div className="flex gap-2">
                <Button type="button" onClick={continueFromCompany}>
                  Continue
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={(event) => void onSubmit(event)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{company?.name}</h2>
                  <p className="text-sm text-muted">Fill the bill, then generate it.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setStep('company')}>
                  Change company
                </Button>
              </div>
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="client-mode">Client</Label>
                  <select
                    id="client-mode"
                    className={fieldClass()}
                    value={clientMode}
                    onChange={(event) => setClientMode(event.target.value as 'previous' | 'new')}
                  >
                    <option value="new">New client</option>
                    <option value="previous" disabled={previousClients.length === 0}>
                      Previous client
                    </option>
                  </select>
                </div>
                {clientMode === 'previous' ? (
                  <div>
                    <Label htmlFor="previous-client">Previous client</Label>
                    <select
                      id="previous-client"
                      className={fieldClass()}
                      value={clientId}
                      onChange={(event) => setClientId(event.target.value)}
                      required
                    >
                      <option value="">Select a client</option>
                      {previousClients.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="client-name">Client name</Label>
                    <Input
                      id="client-name"
                      value={clientName}
                      onChange={(event) => setClientName(event.target.value)}
                      required
                    />
                  </div>
                )}
              </div>
              {clientMode === 'previous' && selectedClient?.address ? (
                <p className="text-sm text-muted whitespace-pre-line">{selectedClient.address}</p>
              ) : null}
              {clientMode === 'new' ? (
                <div>
                  <Label htmlFor="client-address">Client address</Label>
                  <textarea
                    id="client-address"
                    className="min-h-24 w-full rounded border border-border bg-background px-3 py-2 text-sm shadow-card outline-none"
                    value={clientAddress}
                    onChange={(event) => setClientAddress(event.target.value)}
                  />
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label htmlFor="issue-date">Issue date</Label>
                  <Input id="issue-date" type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="due-date">Due date</Label>
                  <Input id="due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="reference">Reference</Label>
                  <Input id="reference" value={reference} onChange={(event) => setReference(event.target.value)} />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className={fieldClass()}
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value as HrInvoiceCurrency)}
                  >
                    {CURRENCIES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="issuer-email">Footer email</Label>
                  <Input
                    id="issuer-email"
                    type="email"
                    value={issuerEmail}
                    onChange={(event) => setIssuerEmail(event.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signature">Issued by</Label>
                  <Input
                    id="signature"
                    value={signatureName}
                    onChange={(event) => setSignatureName(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Lines</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLines((current) => (current.length >= 20 ? current : [...current, emptyLine()]))}
                  >
                    Add line
                  </Button>
                </div>
                {lines.map((line) => (
                  <div key={line.key} className="grid gap-3 rounded border border-border p-3 md:grid-cols-12">
                    <div className="md:col-span-4">
                      <Label htmlFor={`desc-${line.key}`}>Description</Label>
                      <Input
                        id={`desc-${line.key}`}
                        value={line.description}
                        onChange={(event) => updateLine(line.key, { description: event.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label htmlFor={`detail-${line.key}`}>Detail</Label>
                      <Input
                        id={`detail-${line.key}`}
                        value={line.detail}
                        onChange={(event) => updateLine(line.key, { detail: event.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`qty-${line.key}`}>Quantity</Label>
                      <Input
                        id={`qty-${line.key}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={line.quantity}
                        onChange={(event) => updateLine(line.key, { quantity: event.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`price-${line.key}`}>Unit price</Label>
                      <Input
                        id={`price-${line.key}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(event) => updateLine(line.key, { unitPrice: event.target.value })}
                        required
                      />
                    </div>
                    <div className="flex items-end md:col-span-1">
                      {lines.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button type="submit" loading={creating}>
                  {creating ? 'Generating' : 'Generate invoice'}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </section>
      ) : null}

      {isError ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{apiErrorMessage(listError, 'Unable to load invoices.')}</StatusMessage>
        </div>
      ) : null}
      <DataTable
        loading={isLoading}
        rows={invoices?.data ?? []}
        emptyTitle="No invoices yet"
        emptyDescription="Open New invoice, choose a company, and generate the first bill."
        columns={[
          { id: 'number', header: 'Invoice', cell: (row) => row.invoiceNumber },
          { id: 'date', header: 'Issue date', cell: (row) => formatInvoiceDate(row.issueDate) },
          { id: 'company', header: 'Company', cell: (row) => row.companyName },
          { id: 'client', header: 'Client', cell: (row) => row.clientName },
          { id: 'total', header: 'Total', cell: (row) => formatInvoiceMoney(row.currency, row.total) },
          {
            id: 'actions',
            header: '',
            cell: (row) => (
              <div className="flex justify-end gap-2">
                <Link href={`/hr/invoices/${row.id}`} className="text-sm underline">
                  View
                </Link>
                <button
                  type="button"
                  className="text-sm underline disabled:opacity-40"
                  disabled={downloadingId === row.id}
                  onClick={() => void onDownload(row.id)}
                >
                  {downloadingId === row.id ? 'Downloading' : 'Download'}
                </button>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
