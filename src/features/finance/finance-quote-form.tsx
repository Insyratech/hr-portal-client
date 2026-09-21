'use client';

import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ActionConfirmDialog } from '@/components/dashboard/action-confirm-dialog';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { ACCENT, FORM_SECTION_TONE } from '@/lib/ui-accents';
import {
  addDaysIso,
  customerShipToName,
  formatCustomerBillingAddress,
  formatCustomerShippingAddress,
} from '@/features/finance/finance-address-utils';
import { SELECT_CLASS } from '@/features/finance/finance-constants';
import { formatInr } from '@/features/finance/finance-procurement-utils';
import { apiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import {
  useCreateFinanceSalesQuoteMutation,
  useGetFinanceCustomersQuery,
  useGetFinanceOrgGstProfilesQuery,
  useLazyGetFinanceQuoteNextNumberQuery,
  useUpdateFinanceSalesQuoteMutation,
} from '@/store/api/api';
import type { FinanceCustomer, SalesQuote } from '@/types/api';

const STEPS: {
  id: string;
  title: string;
  subtitle: string;
  heading: string;
  description: string;
  icon: IconName;
}[] = [
  {
    id: 'letterhead',
    title: 'Our GST profile',
    subtitle: 'Letterhead',
    heading: 'Company letterhead',
    description: 'Select the GST profile that appears on this quote.',
    icon: 'building',
  },
  {
    id: 'customer',
    title: 'Customer',
    subtitle: 'Bill & ship to',
    heading: 'Customer and addresses',
    description: 'Choose the customer; billing, shipping, GSTIN, and place of supply are prefilled.',
    icon: 'user',
  },
  {
    id: 'meta',
    title: 'Quote details',
    subtitle: 'Subject & dates',
    heading: 'Quote metadata',
    description: 'Subject, reference, place of supply, and validity dates.',
    icon: 'file',
  },
  {
    id: 'lines',
    title: 'Line items',
    subtitle: 'Catalog & tax',
    heading: 'Quote lines',
    description: 'Description, catalog number, HSN/SAC, quantity, rate, and tax.',
    icon: 'grid',
  },
  {
    id: 'terms',
    title: 'Terms & notes',
    subtitle: 'Totals & terms',
    heading: 'Terms, notes, and totals',
    description: 'Edit payment terms, notes, and review calculated totals.',
    icon: 'file',
  },
  {
    id: 'preview',
    title: 'Preview',
    subtitle: 'Confirm & submit',
    heading: 'Review quote',
    description: 'Check all details, then confirm to save.',
    icon: 'check',
  },
];

function PreviewRow({ label, value }: { label: string; value?: string | number | null }) {
  const text = value != null && String(value).trim() ? String(value) : '—';
  return (
    <div className="grid gap-1 sm:grid-cols-3">
      <dt className="text-muted">{label}</dt>
      <dd className="whitespace-pre-wrap sm:col-span-2 text-foreground">{text}</dd>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded border border-border p-4">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <dl className="mt-3 space-y-2 text-sm">{children}</dl>
    </section>
  );
}

type QuoteLineDraft = {
  key: string;
  description: string;
  catalogNo: string;
  hsnSac: string;
  quantity: string;
  unit: string;
  rate: string;
  taxPercent: string;
};

function newQuoteLine(): QuoteLineDraft {
  return {
    key: crypto.randomUUID(),
    description: '',
    catalogNo: '',
    hsnSac: '',
    quantity: '1',
    unit: 'nos',
    rate: '0',
    taxPercent: '18',
  };
}

function formatLetterheadAddress(profile: {
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
}): string {
  return [profile.addressLine1, profile.addressLine2, profile.city, profile.postalCode]
    .filter(Boolean)
    .join(', ');
}

function lineTotals(lines: QuoteLineDraft[]) {
  let subtotal = 0;
  let taxTotal = 0;
  for (const line of lines) {
    const qty = Number(line.quantity) || 0;
    const rate = Number(line.rate) || 0;
    const taxPercent = Number(line.taxPercent) || 0;
    const amount = qty * rate;
    const taxAmount = (amount * taxPercent) / 100;
    subtotal += amount;
    taxTotal += taxAmount;
  }
  return { subtotal, taxTotal, grandTotal: subtotal + taxTotal };
}

type FinanceQuoteFormProps = {
  quote?: SalesQuote | null;
  onSaved: (quote: SalesQuote) => void;
  onCancel: () => void;
};

export function FinanceQuoteForm({ quote, onSaved, onCancel }: FinanceQuoteFormProps) {
  const isEdit = Boolean(quote);
  const { data: profilesData } = useGetFinanceOrgGstProfilesQuery();
  const { data: customersData } = useGetFinanceCustomersQuery();
  const [fetchNextNumber] = useLazyGetFinanceQuoteNextNumberQuery();
  const [createQuote, { isLoading: creating }] = useCreateFinanceSalesQuoteMutation();
  const [updateQuote, { isLoading: updating }] = useUpdateFinanceSalesQuoteMutation();

  const profiles = useMemo(
    () => (profilesData?.data ?? []).filter((item) => item.active),
    [profilesData],
  );
  const customers = customersData?.data ?? [];

  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(() => (quote ? STEPS.length - 1 : 0));
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [documentNumber, setDocumentNumber] = useState(quote?.documentNumber ?? '');
  const [quoteDate, setQuoteDate] = useState(quote?.quoteDate ?? '');
  const [expiryDate, setExpiryDate] = useState(quote?.expiryDate ?? '');
  const [terms, setTerms] = useState(quote?.terms ?? '');
  const [notes, setNotes] = useState(quote?.notes ?? '');
  const [orgGstProfileId, setOrgGstProfileId] = useState(quote?.orgGstProfileId ?? '');
  const [customerId, setCustomerId] = useState(quote?.customerId ?? '');
  const [subject, setSubject] = useState(quote?.subject ?? '');
  const [referenceText, setReferenceText] = useState(quote?.referenceText ?? '');
  const [placeOfSupply, setPlaceOfSupply] = useState(quote?.placeOfSupply ?? '');
  const [billingAddressSnapshot, setBillingAddressSnapshot] = useState(quote?.billingAddressSnapshot ?? '');
  const [shippingAddressSnapshot, setShippingAddressSnapshot] = useState(quote?.shippingAddressSnapshot ?? '');
  const [customerGstinSnapshot, setCustomerGstinSnapshot] = useState(quote?.customerGstinSnapshot ?? '');
  const [shipToName, setShipToName] = useState(quote?.shipToName ?? '');
  const [changeNote, setChangeNote] = useState('');
  const [lines, setLines] = useState<QuoteLineDraft[]>(() =>
    quote?.lines.length
      ? quote.lines.map((line) => ({
          key: line.id,
          description: line.description,
          catalogNo: line.catalogNo ?? '',
          hsnSac: line.hsnSac ?? '',
          quantity: String(line.quantity),
          unit: line.unit ?? 'nos',
          rate: String(line.rate),
          taxPercent: String(line.taxPercent),
        }))
      : [newQuoteLine()],
  );

  const lastStep = STEPS.length - 1;
  const current = STEPS[step]!;
  const saving = creating || updating;
  const selectedProfile = profiles.find((item) => item.id === orgGstProfileId) ?? null;
  const selectedCustomer = customers.find((item) => item.id === customerId) ?? null;
  const totals = lineTotals(lines);
  const preparedLines = lines
    .map((line) => ({
      description: line.description.trim(),
      catalogNo: line.catalogNo.trim() || undefined,
      hsnSac: line.hsnSac.trim() || undefined,
      quantity: Number(line.quantity),
      unit: line.unit.trim() || 'nos',
      rate: Number(line.rate),
      taxPercent: Number(line.taxPercent),
      amount: (Number(line.quantity) || 0) * (Number(line.rate) || 0),
    }))
    .filter((line) => line.description && line.quantity > 0);

  useEffect(() => {
    if (quote || orgGstProfileId || !profiles.length) return;
    const defaultProfile = profiles.find((item) => item.isDefault) ?? profiles[0];
    if (defaultProfile) setOrgGstProfileId(defaultProfile.id);
  }, [quote, orgGstProfileId, profiles]);

  useEffect(() => {
    if (isEdit) return;
    void fetchNextNumber()
      .unwrap()
      .then((result) => {
        setDocumentNumber(result.data.documentNumber);
        setQuoteDate(result.data.quoteDate);
        setExpiryDate(result.data.expiryDate);
        setTerms(result.data.terms);
        setNotes(result.data.notes);
      })
      .catch(() => {
        /* preview optional */
      });
  }, [isEdit, fetchNextNumber]);

  useEffect(() => {
    if (!quoteDate || isEdit) return;
    setExpiryDate(addDaysIso(quoteDate, 30));
  }, [quoteDate, isEdit]);

  function applyCustomer(customer: FinanceCustomer) {
    setBillingAddressSnapshot(formatCustomerBillingAddress(customer));
    setShippingAddressSnapshot(formatCustomerShippingAddress(customer));
    setCustomerGstinSnapshot(customer.gstin ?? '');
    setPlaceOfSupply(customer.stateName || customer.stateCode || '');
    setShipToName(customerShipToName(customer));
  }

  function onCustomerChange(id: string) {
    setCustomerId(id);
    const customer = customers.find((item) => item.id === id);
    if (customer) applyCustomer(customer);
  }

  function validateStep(index: number): boolean {
    if (index === 1 && !customerId) {
      setError('Select a customer.');
      return false;
    }
    if (index === 3) {
      const prepared = lines.filter((line) => line.description.trim() && Number(line.quantity) > 0);
      if (!prepared.length) {
        setError('Add at least one quote line.');
        return false;
      }
    }
    setError(null);
    return true;
  }

  function goToStep(index: number) {
    if (index < 0 || index > lastStep || index > maxReached) return;
    setError(null);
    setStep(index);
  }

  function goNext() {
    if (!validateStep(step)) return;
    const next = Math.min(step + 1, lastStep);
    setStep(next);
    setMaxReached((prev) => Math.max(prev, next));
  }

  function goBack() {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 0));
  }

  function buildBody() {
    return {
      customerId,
      quoteDate: quoteDate || undefined,
      expiryDate: expiryDate || null,
      notes: notes.trim() || undefined,
      terms: terms.trim() || undefined,
      subject: subject.trim() || undefined,
      referenceText: referenceText.trim() || undefined,
      placeOfSupply: placeOfSupply.trim() || undefined,
      orgGstProfileId: orgGstProfileId || null,
      billingAddressSnapshot: billingAddressSnapshot.trim() || undefined,
      shippingAddressSnapshot: shippingAddressSnapshot.trim() || undefined,
      customerGstinSnapshot: customerGstinSnapshot.trim() || null,
      shipToName: shipToName.trim() || undefined,
      lines: preparedLines.map(({ amount: _amount, ...line }) => line),
      ...(isEdit && changeNote.trim() ? { changeNote: changeNote.trim() } : {}),
    };
  }

  async function handleConfirmSave() {
    setError(null);
    if (!preparedLines.length) {
      setError('Add at least one quote line.');
      setConfirmOpen(false);
      setStep(3);
      return;
    }
    if (!customerId) {
      setError('Select a customer.');
      setConfirmOpen(false);
      setStep(1);
      return;
    }
    try {
      const result = quote
        ? await updateQuote({ id: quote.id, body: buildBody() }).unwrap()
        : await createQuote(buildBody()).unwrap();
      setConfirmOpen(false);
      onSaved(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, quote ? 'Unable to update quote.' : 'Unable to create quote.'));
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== lastStep) {
      goNext();
      return;
    }
    setConfirmOpen(true);
  }

  function onFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== 'Enter') return;
    const target = event.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;
    if (step !== lastStep) {
      event.preventDefault();
      goNext();
    }
  }

  return (
    <form onSubmit={onSubmit} onKeyDown={onFormKeyDown} className="mt-4">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <nav aria-label="Quote stages" className="shrink-0 lg:w-56">
          <ol className="relative space-y-0">
            {STEPS.map((item, index) => {
              const active = index === step;
              const reachable = index <= maxReached;
              const done = index < step;
              return (
                <li key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
                  {index < lastStep ? (
                    <span
                      aria-hidden
                      className="absolute left-[15px] top-8 h-[calc(100%-12px)] w-px bg-border"
                    />
                  ) : null}
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => goToStep(index)}
                    className={cn(
                      'relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors',
                      active && 'text-background',
                      !active && done && 'border-[var(--accent-purple)] text-[var(--accent-purple)]',
                      !active && !done && 'border-border text-muted',
                      !reachable && 'cursor-not-allowed opacity-50',
                      reachable && !active && 'hover:border-[var(--accent-purple)]',
                    )}
                    style={
                      active
                        ? {
                            borderColor: ACCENT[FORM_SECTION_TONE],
                            backgroundColor: ACCENT[FORM_SECTION_TONE],
                            color: '#0a0a0a',
                          }
                        : undefined
                    }
                    aria-current={active ? 'step' : undefined}
                  >
                    <Icon name={item.icon} className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => goToStep(index)}
                    className={cn('min-w-0 flex-1 pt-0.5 text-left', !reachable && 'cursor-not-allowed opacity-50')}
                  >
                    <div className={cn('text-sm font-medium leading-tight', active ? 'text-foreground' : 'text-muted')}>
                      {item.title}
                    </div>
                    <div className="mt-0.5 text-xs text-muted">{item.subtitle}</div>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Step {step + 1}/{STEPS.length}
          </p>
          <h3 className="mt-2 text-lg font-medium" style={{ color: ACCENT[FORM_SECTION_TONE] }}>
            {current.heading}
          </h3>
          <p className="mt-1 text-sm text-muted">{current.description}</p>

          <div className={cn('mt-6 space-y-4', step !== 0 && 'hidden')} aria-hidden={step !== 0}>
            <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:justify-between">
              <div className="max-w-md flex-1">
                <Label htmlFor="orgGstProfileId">Our company GST profile</Label>
                <select
                  id="orgGstProfileId"
                  className={SELECT_CLASS}
                  value={orgGstProfileId}
                  onChange={(event) => setOrgGstProfileId(event.target.value)}
                  tabIndex={step === 0 ? undefined : -1}
                >
                  <option value="">Select GST profile</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.gstin} — {profile.legalName || profile.tradeName}
                    </option>
                  ))}
                </select>
              </div>
              {selectedProfile ? (
                <div className="max-w-xs text-right text-xs leading-relaxed text-muted">
                  {selectedProfile.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedProfile.logoUrl}
                      alt="Company logo"
                      className="ml-auto mb-2 h-12 max-w-[140px] object-contain"
                    />
                  ) : null}
                  <div className="font-medium uppercase text-foreground">
                    {selectedProfile.legalName || selectedProfile.tradeName}
                  </div>
                  <div>GST: {selectedProfile.gstin}</div>
                  {selectedProfile.cin ? <div>CIN: {selectedProfile.cin}</div> : null}
                  <div>{formatLetterheadAddress(selectedProfile)}</div>
                </div>
              ) : null}
            </div>
          </div>

          <div className={cn('mt-6 space-y-4', step !== 1 && 'hidden')} aria-hidden={step !== 1}>
            <div>
              <Label htmlFor="customerId">Customer</Label>
              <select
                id="customerId"
                className={SELECT_CLASS}
                value={customerId}
                onChange={(event) => onCustomerChange(event.target.value)}
                required
                tabIndex={step === 1 ? undefined : -1}
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.displayName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="shipToName">Ship to name</Label>
              <Input
                id="shipToName"
                value={shipToName}
                onChange={(event) => setShipToName(event.target.value)}
                tabIndex={step === 1 ? undefined : -1}
              />
            </div>
            <div>
              <Label htmlFor="billingAddressSnapshot">Billing address snapshot</Label>
              <textarea
                id="billingAddressSnapshot"
                className="min-h-[80px] w-full rounded border border-border bg-background px-3 py-2 text-sm"
                value={billingAddressSnapshot}
                onChange={(event) => setBillingAddressSnapshot(event.target.value)}
                tabIndex={step === 1 ? undefined : -1}
              />
            </div>
            <div>
              <Label htmlFor="shippingAddressSnapshot">Shipping address snapshot</Label>
              <textarea
                id="shippingAddressSnapshot"
                className="min-h-[80px] w-full rounded border border-border bg-background px-3 py-2 text-sm"
                value={shippingAddressSnapshot}
                onChange={(event) => setShippingAddressSnapshot(event.target.value)}
                tabIndex={step === 1 ? undefined : -1}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="customerGstinSnapshot">Customer GSTIN</Label>
                <Input
                  id="customerGstinSnapshot"
                  value={customerGstinSnapshot}
                  onChange={(event) => setCustomerGstinSnapshot(event.target.value)}
                  tabIndex={step === 1 ? undefined : -1}
                />
              </div>
              <div>
                <Label htmlFor="placeOfSupply">Place of supply</Label>
                <Input
                  id="placeOfSupply"
                  value={placeOfSupply}
                  onChange={(event) => setPlaceOfSupply(event.target.value)}
                  tabIndex={step === 1 ? undefined : -1}
                />
              </div>
            </div>
          </div>

          <div className={cn('mt-6 space-y-4', step !== 2 && 'hidden')} aria-hidden={step !== 2}>
            <div>
              <Label htmlFor="documentNumber">Quote number</Label>
              <Input id="documentNumber" value={documentNumber} readOnly className="bg-muted/30" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="quoteDate">Quote date</Label>
                <Input
                  id="quoteDate"
                  type="date"
                  value={quoteDate}
                  onChange={(event) => setQuoteDate(event.target.value)}
                  tabIndex={step === 2 ? undefined : -1}
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate ?? ''}
                  readOnly={!isEdit}
                  onChange={(event) => setExpiryDate(event.target.value)}
                  className={!isEdit ? 'bg-muted/30' : undefined}
                  tabIndex={step === 2 ? undefined : -1}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                tabIndex={step === 2 ? undefined : -1}
              />
            </div>
            <div>
              <Label htmlFor="referenceText">Reference</Label>
              <Input
                id="referenceText"
                value={referenceText}
                onChange={(event) => setReferenceText(event.target.value)}
                tabIndex={step === 2 ? undefined : -1}
              />
            </div>
          </div>

          <div className={cn('mt-6 space-y-4', step !== 3 && 'hidden')} aria-hidden={step !== 3}>
            <div className="flex items-center justify-between">
              <Label>Lines</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLines((prev) => [...prev, newQuoteLine()])}
              >
                Add line
              </Button>
            </div>
            {lines.map((line, index) => (
              <div key={line.key} className="grid gap-2 sm:grid-cols-12">
                <Input
                  className="sm:col-span-3"
                  placeholder="Description"
                  value={line.description}
                  onChange={(event) =>
                    setLines((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, description: event.target.value } : item)),
                    )
                  }
                  required
                />
                <Input
                  className="sm:col-span-2"
                  placeholder="Catalog"
                  value={line.catalogNo}
                  onChange={(event) =>
                    setLines((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, catalogNo: event.target.value } : item)),
                    )
                  }
                />
                <Input
                  className="sm:col-span-2"
                  placeholder="HSN/SAC"
                  value={line.hsnSac}
                  onChange={(event) =>
                    setLines((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, hsnSac: event.target.value } : item)),
                    )
                  }
                />
                <Input
                  className="sm:col-span-1"
                  type="number"
                  min={0.01}
                  step="any"
                  value={line.quantity}
                  onChange={(event) =>
                    setLines((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, quantity: event.target.value } : item)),
                    )
                  }
                  required
                />
                <Input
                  className="sm:col-span-1"
                  value={line.unit}
                  onChange={(event) =>
                    setLines((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, unit: event.target.value } : item)),
                    )
                  }
                />
                <Input
                  className="sm:col-span-1"
                  type="number"
                  min={0}
                  step="any"
                  value={line.rate}
                  onChange={(event) =>
                    setLines((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, rate: event.target.value } : item)),
                    )
                  }
                  required
                />
                <Input
                  className="sm:col-span-1"
                  type="number"
                  min={0}
                  step="any"
                  value={line.taxPercent}
                  onChange={(event) =>
                    setLines((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, taxPercent: event.target.value } : item)),
                    )
                  }
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="sm:col-span-1"
                  disabled={lines.length === 1}
                  onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>

          <div className={cn('mt-6 space-y-4', step !== 4 && 'hidden')} aria-hidden={step !== 4}>
            <div>
              <Label htmlFor="terms">Terms</Label>
              <textarea
                id="terms"
                className="min-h-[80px] w-full rounded border border-border bg-background px-3 py-2 text-sm"
                value={terms}
                onChange={(event) => setTerms(event.target.value)}
                tabIndex={step === 4 ? undefined : -1}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="min-h-[60px] w-full rounded border border-border bg-background px-3 py-2 text-sm"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                tabIndex={step === 4 ? undefined : -1}
              />
            </div>
            {isEdit ? (
              <div>
                <Label htmlFor="changeNote">Change note (optional)</Label>
                <Input
                  id="changeNote"
                  value={changeNote}
                  onChange={(event) => setChangeNote(event.target.value)}
                  placeholder="Reason for this revision"
                  tabIndex={step === 4 ? undefined : -1}
                />
              </div>
            ) : null}
            <div className="rounded border border-border p-4 text-sm">
              <p>
                <span className="text-muted">Subtotal:</span> {formatInr(totals.subtotal)}
              </p>
              <p>
                <span className="text-muted">Tax:</span> {formatInr(totals.taxTotal)}
              </p>
              <p className="font-medium">
                <span className="text-muted">Grand total:</span> {formatInr(totals.grandTotal)}
              </p>
            </div>
          </div>

          <div className={cn('mt-6 space-y-4', step !== 5 && 'hidden')} aria-hidden={step !== 5}>
            <PreviewSection title="Letterhead">
              <PreviewRow
                label="GST profile"
                value={
                  selectedProfile
                    ? `${selectedProfile.label || selectedProfile.gstin} — ${selectedProfile.gstin}`
                    : null
                }
              />
            </PreviewSection>
            <PreviewSection title="Customer">
              <PreviewRow label="Customer" value={selectedCustomer?.displayName ?? shipToName} />
              <PreviewRow label="Ship to name" value={shipToName} />
              <PreviewRow label="Billing address" value={billingAddressSnapshot} />
              <PreviewRow label="Shipping address" value={shippingAddressSnapshot} />
              <PreviewRow label="Customer GSTIN" value={customerGstinSnapshot} />
              <PreviewRow label="Place of supply" value={placeOfSupply} />
            </PreviewSection>
            <PreviewSection title="Quote details">
              <PreviewRow label="Quote number" value={documentNumber} />
              <PreviewRow label="Quote date" value={quoteDate} />
              <PreviewRow label="Expiry date" value={expiryDate} />
              <PreviewRow label="Subject" value={subject} />
              <PreviewRow label="Reference" value={referenceText} />
            </PreviewSection>
            <section className="rounded border border-border p-4">
              <h4 className="text-sm font-medium text-foreground">Line items</h4>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted">
                      <th className="pb-2 pr-3 font-normal">Description</th>
                      <th className="pb-2 pr-3 font-normal">Catalog</th>
                      <th className="pb-2 pr-3 font-normal">HSN/SAC</th>
                      <th className="pb-2 pr-3 font-normal">Qty</th>
                      <th className="pb-2 pr-3 font-normal">Rate</th>
                      <th className="pb-2 pr-3 font-normal">Tax %</th>
                      <th className="pb-2 font-normal text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preparedLines.map((line, index) => (
                      <tr key={index} className="border-b border-border/60 last:border-0">
                        <td className="py-2 pr-3">{line.description}</td>
                        <td className="py-2 pr-3">{line.catalogNo || '—'}</td>
                        <td className="py-2 pr-3">{line.hsnSac || '—'}</td>
                        <td className="py-2 pr-3">
                          {line.quantity} {line.unit}
                        </td>
                        <td className="py-2 pr-3">{formatInr(line.rate)}</td>
                        <td className="py-2 pr-3">{line.taxPercent}%</td>
                        <td className="py-2 text-right">{formatInr(line.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <PreviewSection title="Terms & notes">
              <PreviewRow label="Terms" value={terms} />
              <PreviewRow label="Notes" value={notes} />
              {isEdit && changeNote.trim() ? <PreviewRow label="Change note" value={changeNote} /> : null}
            </PreviewSection>
            <div className="rounded border border-border p-4 text-sm">
              <p>
                <span className="text-muted">Subtotal:</span> {formatInr(totals.subtotal)}
              </p>
              <p>
                <span className="text-muted">Tax:</span> {formatInr(totals.taxTotal)}
              </p>
              <p className="font-medium">
                <span className="text-muted">Grand total:</span> {formatInr(totals.grandTotal)}
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-4">
              <StatusMessage tone="danger">{error}</StatusMessage>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              {step > 0 ? (
                <Button type="button" variant="outline" onClick={goBack}>
                  Back
                </Button>
              ) : null}
            </div>
            <Button type="submit" loading={step === lastStep && saving}>
              {step === lastStep ? 'Confirm & submit' : 'Next'}
            </Button>
          </div>
        </div>
      </div>

      <ActionConfirmDialog
        open={confirmOpen}
        title={isEdit ? 'Save quote changes?' : 'Submit this quote?'}
        description={
          isEdit
            ? 'This will update the quote record. You can edit again later if needed.'
            : 'Submit this quote? You cannot undo from here without editing later.'
        }
        confirmLabel="OK, submit"
        pending={saving}
        onCancel={() => {
          if (!saving) setConfirmOpen(false);
        }}
        onConfirm={() => void handleConfirmSave()}
      />
    </form>
  );
}
