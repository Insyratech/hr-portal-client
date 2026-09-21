'use client';

import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ActionConfirmDialog } from '@/components/dashboard/action-confirm-dialog';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { ACCENT, FORM_SECTION_TONE } from '@/lib/ui-accents';
import {
  INDIAN_STATES,
  SELECT_CLASS,
  stateFromCode,
} from '@/features/finance/finance-constants';
import { composeAddressLines } from '@/features/finance/finance-address-utils';
import { GstinLookupResultCard } from '@/features/finance/gstin-lookup-result-card';
import { apiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import {
  useCreateFinanceCustomerMutation,
  useGetFinanceCustomerHistoryQuery,
  useLookupFinanceGstinMutation,
  useUpdateFinanceCustomerMutation,
} from '@/store/api/api';
import type { FinanceCustomer, GstinLookupResult } from '@/types/api';

const STEPS: {
  id: string;
  title: string;
  subtitle: string;
  heading: string;
  description: string;
  icon: IconName;
}[] = [
  {
    id: 'basic',
    title: 'Basic info',
    subtitle: 'Name & contacts',
    heading: 'Customer identity',
    description: 'Display name, company, email, and phone for this customer.',
    icon: 'user',
  },
  {
    id: 'tax',
    title: 'Tax',
    subtitle: 'GSTIN & state',
    heading: 'Tax registration',
    description: 'GSTIN lookup can pre-fill state, PAN, and suggested addresses.',
    icon: 'badge',
  },
  {
    id: 'billing',
    title: 'Billing',
    subtitle: 'Structured address',
    heading: 'Billing address',
    description: 'Structured billing address used on quotes and invoices.',
    icon: 'grid',
  },
  {
    id: 'shipping',
    title: 'Shipping',
    subtitle: 'Ship-to details',
    heading: 'Shipping address',
    description: 'Ship-to contact, company, and delivery address.',
    icon: 'grid',
  },
  {
    id: 'terms',
    title: 'Terms & notes',
    subtitle: 'Payment & status',
    heading: 'Payment terms and notes',
    description: 'Default payment terms and internal notes.',
    icon: 'file',
  },
  {
    id: 'preview',
    title: 'Preview',
    subtitle: 'Confirm & submit',
    heading: 'Review customer',
    description: 'Check all details, then confirm to save.',
    icon: 'check',
  },
];

function PreviewRow({ label, value }: { label: string; value?: string | number | null }) {
  const text = value != null && String(value).trim() ? String(value) : '—';
  return (
    <div className="grid gap-1 sm:grid-cols-3">
      <dt className="text-muted">{label}</dt>
      <dd className="sm:col-span-2 text-foreground">{text}</dd>
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

type CustomerFormProps = {
  customer?: FinanceCustomer | null;
  onSaved: (customer: FinanceCustomer) => void;
  onCancel: () => void;
};

function parseMultilineAddress(text: string | null | undefined): {
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
} {
  const lines = (text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) {
    return { line1: '', line2: '', city: '', postalCode: '' };
  }
  const last = lines[lines.length - 1] ?? '';
  const postalMatch = last.match(/(\d{6})/);
  return {
    line1: lines[0] ?? '',
    line2: lines.length > 2 ? lines.slice(1, -1).join(', ') : lines[1] ?? '',
    city: lines.length > 1 ? last.replace(postalMatch?.[0] ?? '', '').replace(/,\s*$/, '').trim() : '',
    postalCode: postalMatch?.[1] ?? '',
  };
}

export function FinanceCustomerForm({ customer, onSaved, onCancel }: CustomerFormProps) {
  const isEdit = Boolean(customer);
  const [createCustomer, { isLoading: creating }] = useCreateFinanceCustomerMutation();
  const [updateCustomer, { isLoading: updating }] = useUpdateFinanceCustomerMutation();
  const [lookupGstin, { isLoading: lookingUp }] = useLookupFinanceGstinMutation();
  const { data: historyData } = useGetFinanceCustomerHistoryQuery(customer?.id ?? '', {
    skip: !customer?.id,
  });

  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(() => (customer ? STEPS.length - 1 : 0));
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [displayName, setDisplayName] = useState(customer?.displayName ?? '');
  const [companyName, setCompanyName] = useState(customer?.companyName ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [paymentTermsDays, setPaymentTermsDays] = useState(customer?.paymentTermsDays ?? 0);
  const [notes, setNotes] = useState(customer?.notes ?? '');
  const [status, setStatus] = useState<'active' | 'inactive'>(customer?.status ?? 'active');
  const [gstin, setGstin] = useState(customer?.gstin ?? '');
  const [pan, setPan] = useState(customer?.pan ?? '');
  const [stateCode, setStateCode] = useState(customer?.stateCode ?? '');
  const [billingLine1, setBillingLine1] = useState(customer?.billingLine1 ?? '');
  const [billingLine2, setBillingLine2] = useState(customer?.billingLine2 ?? '');
  const [billingCity, setBillingCity] = useState(customer?.billingCity ?? '');
  const [billingPostalCode, setBillingPostalCode] = useState(customer?.billingPostalCode ?? '');
  const [billingCountry, setBillingCountry] = useState(customer?.billingCountry || 'India');
  const [shippingLine1, setShippingLine1] = useState(customer?.shippingLine1 ?? '');
  const [shippingLine2, setShippingLine2] = useState(customer?.shippingLine2 ?? '');
  const [shippingCity, setShippingCity] = useState(customer?.shippingCity ?? '');
  const [shippingStateCode, setShippingStateCode] = useState(customer?.shippingStateCode ?? '');
  const [shippingPostalCode, setShippingPostalCode] = useState(customer?.shippingPostalCode ?? '');
  const [shippingCountry, setShippingCountry] = useState(customer?.shippingCountry || 'India');
  const [shipToContactName, setShipToContactName] = useState(customer?.shipToContactName ?? '');
  const [shipToCompanyName, setShipToCompanyName] = useState(customer?.shipToCompanyName ?? '');
  const [pendingLookup, setPendingLookup] = useState<GstinLookupResult | null>(null);

  const lastStep = STEPS.length - 1;
  const current = STEPS[step]!;
  const saving = creating || updating;

  useEffect(() => {
    if (!customer) return;
    setDisplayName(customer.displayName ?? '');
    setCompanyName(customer.companyName ?? '');
    setEmail(customer.email ?? '');
    setPhone(customer.phone ?? '');
    setPaymentTermsDays(customer.paymentTermsDays ?? 0);
    setNotes(customer.notes ?? '');
    setStatus(customer.status ?? 'active');
    setGstin(customer.gstin ?? '');
    setPan(customer.pan ?? '');
    setStateCode(customer.stateCode ?? '');
    setBillingLine1(customer.billingLine1 ?? '');
    setBillingLine2(customer.billingLine2 ?? '');
    setBillingCity(customer.billingCity ?? '');
    setBillingPostalCode(customer.billingPostalCode ?? '');
    setBillingCountry(customer.billingCountry || 'India');
    setShippingLine1(customer.shippingLine1 ?? '');
    setShippingLine2(customer.shippingLine2 ?? '');
    setShippingCity(customer.shippingCity ?? '');
    setShippingStateCode(customer.shippingStateCode ?? '');
    setShippingPostalCode(customer.shippingPostalCode ?? '');
    setShippingCountry(customer.shippingCountry || 'India');
    setShipToContactName(customer.shipToContactName ?? '');
    setShipToCompanyName(customer.shipToCompanyName ?? '');
  }, [customer]);

  function copyBillingToShipping() {
    setShippingLine1(billingLine1);
    setShippingLine2(billingLine2);
    setShippingCity(billingCity);
    setShippingStateCode(stateCode);
    setShippingPostalCode(billingPostalCode);
    setShippingCountry(billingCountry);
  }

  function applyLookup(result: GstinLookupResult) {
    if (result.stateCode) setStateCode(result.stateCode);
    if (result.pan) setPan(result.pan);
    if (result.legalName) {
      setCompanyName(result.legalName);
      if (!displayName.trim()) setDisplayName(result.tradeName || result.legalName);
    } else if (result.tradeName) {
      setCompanyName(result.tradeName);
      if (!displayName.trim()) setDisplayName(result.tradeName);
    }
    if (result.addressLine1) {
      setBillingLine1(result.addressLine1);
      setBillingLine2(result.addressLine2 ?? '');
      setBillingCity(result.city ?? '');
      setBillingPostalCode(result.postalCode ?? '');
    } else if (result.billingAddress) {
      const parsed = parseMultilineAddress(result.billingAddress);
      setBillingLine1(parsed.line1);
      setBillingLine2(parsed.line2);
      setBillingCity(parsed.city);
      setBillingPostalCode(parsed.postalCode);
    }
    if (result.shippingAddress) {
      const parsed = parseMultilineAddress(result.shippingAddress);
      setShippingLine1(parsed.line1);
      setShippingLine2(parsed.line2);
      setShippingCity(parsed.city);
      setShippingPostalCode(parsed.postalCode);
      setShippingStateCode(result.stateCode ?? stateCode);
    } else if (result.addressLine1) {
      setShippingLine1(result.addressLine1);
      setShippingLine2(result.addressLine2 ?? '');
      setShippingCity(result.city ?? '');
      setShippingPostalCode(result.postalCode ?? '');
      setShippingStateCode(result.stateCode ?? stateCode);
    }
    setPendingLookup(null);
  }

  async function runGstinLookup(raw?: string) {
    const value = (raw ?? gstin).trim().toUpperCase();
    if (value.length < 15) return;
    setError(null);
    try {
      const result = await lookupGstin({ gstin: value }).unwrap();
      if (result.data.validFormat) {
        setPendingLookup(result.data);
      } else {
        setPendingLookup(null);
        setError(result.data.message);
      }
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to look up GSTIN.'));
    }
  }

  function validateStep(index: number): boolean {
    if (index === 0 && !displayName.trim()) {
      setError('Display name is required.');
      return false;
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

  function collectBody() {
    const { stateCode: resolvedStateCode, stateName } = stateFromCode(stateCode);
    const { stateCode: shipStateCode, stateName: shipStateName } = stateFromCode(shippingStateCode || stateCode);
    const billingAddress = composeAddressLines({
      line1: billingLine1,
      line2: billingLine2,
      city: billingCity,
      stateName,
      postalCode: billingPostalCode,
      country: billingCountry,
    });
    const shippingAddress = composeAddressLines({
      line1: shippingLine1,
      line2: shippingLine2,
      city: shippingCity,
      stateName: shipStateName,
      postalCode: shippingPostalCode,
      country: shippingCountry,
    });

    return {
      displayName: displayName.trim(),
      companyName: companyName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      gstin: gstin.trim() || null,
      pan: pan.trim() || null,
      stateCode: resolvedStateCode,
      stateName,
      billingAddress,
      shippingAddress,
      billingLine1: billingLine1.trim(),
      billingLine2: billingLine2.trim(),
      billingCity: billingCity.trim(),
      billingPostalCode: billingPostalCode.trim(),
      billingCountry: billingCountry.trim() || 'India',
      shippingLine1: shippingLine1.trim(),
      shippingLine2: shippingLine2.trim(),
      shippingCity: shippingCity.trim(),
      shippingStateCode: shipStateCode,
      shippingStateName: shipStateName,
      shippingPostalCode: shippingPostalCode.trim(),
      shippingCountry: shippingCountry.trim() || 'India',
      shipToContactName: shipToContactName.trim(),
      shipToCompanyName: shipToCompanyName.trim(),
      paymentTermsDays: Number(paymentTermsDays) || 0,
      notes: notes.trim(),
      ...(isEdit ? { status } : {}),
    };
  }

  async function handleConfirmSave() {
    setError(null);
    const body = collectBody();
    if (!body.displayName) {
      setError('Display name is required.');
      setConfirmOpen(false);
      setStep(0);
      return;
    }
    try {
      const result = customer
        ? await updateCustomer({ id: customer.id, body }).unwrap()
        : await createCustomer(body).unwrap();
      setConfirmOpen(false);
      onSaved(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, customer ? 'Unable to update customer.' : 'Unable to create customer.'));
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

  const history = historyData?.data ?? [];
  const { stateName: billingStateName } = stateFromCode(stateCode);
  const { stateName: previewShippingStateName } = stateFromCode(shippingStateCode || stateCode);
  const billingAddressPreview = composeAddressLines({
    line1: billingLine1,
    line2: billingLine2,
    city: billingCity,
    stateName: billingStateName,
    postalCode: billingPostalCode,
    country: billingCountry,
  });
  const shippingAddressPreview = composeAddressLines({
    line1: shippingLine1,
    line2: shippingLine2,
    city: shippingCity,
    stateName: previewShippingStateName,
    postalCode: shippingPostalCode,
    country: shippingCountry,
  });

  return (
    <form onSubmit={onSubmit} onKeyDown={onFormKeyDown} className="mt-4">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <nav aria-label="Customer stages" className="shrink-0 lg:w-56">
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

          {pendingLookup ? (
            <GstinLookupResultCard
              result={pendingLookup}
              onAutoFill={() => applyLookup(pendingLookup)}
              onManual={() => setPendingLookup(null)}
              autoFillLabel="Apply suggested details"
              manualLabel="Cancel"
              hint="Apply fills state, PAN, and addresses when available. You can still edit every field afterward."
            />
          ) : null}

          <div className={cn('mt-6 space-y-4', step !== 0 && 'hidden')} aria-hidden={step !== 0}>
            <div>
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                tabIndex={step === 0 ? undefined : -1}
              />
            </div>
            <div>
              <Label htmlFor="companyName">Company name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                tabIndex={step === 0 ? undefined : -1}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  tabIndex={step === 0 ? undefined : -1}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  tabIndex={step === 0 ? undefined : -1}
                />
              </div>
            </div>
          </div>

          <div className={cn('mt-6 space-y-4', step !== 1 && 'hidden')} aria-hidden={step !== 1}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="gstin">GSTIN</Label>
                <div className="flex gap-2">
                  <Input
                    id="gstin"
                    value={gstin}
                    onChange={(event) => setGstin(event.target.value.toUpperCase())}
                    onBlur={() => void runGstinLookup()}
                    maxLength={15}
                    tabIndex={step === 1 ? undefined : -1}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    loading={lookingUp}
                    onClick={() => void runGstinLookup()}
                    tabIndex={step === 1 ? undefined : -1}
                  >
                    Look up
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="pan">PAN</Label>
                <Input
                  id="pan"
                  value={pan}
                  onChange={(event) => setPan(event.target.value.toUpperCase())}
                  tabIndex={step === 1 ? undefined : -1}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="stateCode">State</Label>
              <select
                id="stateCode"
                className={SELECT_CLASS}
                value={stateCode}
                onChange={(event) => setStateCode(event.target.value)}
                tabIndex={step === 1 ? undefined : -1}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={cn('mt-6 space-y-4', step !== 2 && 'hidden')} aria-hidden={step !== 2}>
            <div>
              <Label htmlFor="billingLine1">Address line 1</Label>
              <Input
                id="billingLine1"
                value={billingLine1}
                onChange={(event) => setBillingLine1(event.target.value)}
                tabIndex={step === 2 ? undefined : -1}
              />
            </div>
            <div>
              <Label htmlFor="billingLine2">Address line 2</Label>
              <Input
                id="billingLine2"
                value={billingLine2}
                onChange={(event) => setBillingLine2(event.target.value)}
                tabIndex={step === 2 ? undefined : -1}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="billingCity">City</Label>
                <Input
                  id="billingCity"
                  value={billingCity}
                  onChange={(event) => setBillingCity(event.target.value)}
                  tabIndex={step === 2 ? undefined : -1}
                />
              </div>
              <div>
                <Label htmlFor="billingPostalCode">Postal code</Label>
                <Input
                  id="billingPostalCode"
                  value={billingPostalCode}
                  onChange={(event) => setBillingPostalCode(event.target.value)}
                  tabIndex={step === 2 ? undefined : -1}
                />
              </div>
              <div>
                <Label htmlFor="billingCountry">Country</Label>
                <Input
                  id="billingCountry"
                  value={billingCountry}
                  onChange={(event) => setBillingCountry(event.target.value)}
                  tabIndex={step === 2 ? undefined : -1}
                />
              </div>
            </div>
          </div>

          <div className={cn('mt-6 space-y-4', step !== 3 && 'hidden')} aria-hidden={step !== 3}>
            <div className="flex items-center justify-between">
              <Label>Shipping address</Label>
              <Button type="button" variant="outline" size="sm" onClick={copyBillingToShipping}>
                Copy from billing
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="shipToContactName">Ship-to contact</Label>
                <Input
                  id="shipToContactName"
                  value={shipToContactName}
                  onChange={(event) => setShipToContactName(event.target.value)}
                  tabIndex={step === 3 ? undefined : -1}
                />
              </div>
              <div>
                <Label htmlFor="shipToCompanyName">Ship-to company</Label>
                <Input
                  id="shipToCompanyName"
                  value={shipToCompanyName}
                  onChange={(event) => setShipToCompanyName(event.target.value)}
                  tabIndex={step === 3 ? undefined : -1}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="shippingLine1">Address line 1</Label>
              <Input
                id="shippingLine1"
                value={shippingLine1}
                onChange={(event) => setShippingLine1(event.target.value)}
                tabIndex={step === 3 ? undefined : -1}
              />
            </div>
            <div>
              <Label htmlFor="shippingLine2">Address line 2</Label>
              <Input
                id="shippingLine2"
                value={shippingLine2}
                onChange={(event) => setShippingLine2(event.target.value)}
                tabIndex={step === 3 ? undefined : -1}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="shippingCity">City</Label>
                <Input
                  id="shippingCity"
                  value={shippingCity}
                  onChange={(event) => setShippingCity(event.target.value)}
                  tabIndex={step === 3 ? undefined : -1}
                />
              </div>
              <div>
                <Label htmlFor="shippingStateCode">State</Label>
                <select
                  id="shippingStateCode"
                  className={SELECT_CLASS}
                  value={shippingStateCode}
                  onChange={(event) => setShippingStateCode(event.target.value)}
                  tabIndex={step === 3 ? undefined : -1}
                >
                  <option value="">Same as billing</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="shippingPostalCode">Postal code</Label>
                <Input
                  id="shippingPostalCode"
                  value={shippingPostalCode}
                  onChange={(event) => setShippingPostalCode(event.target.value)}
                  tabIndex={step === 3 ? undefined : -1}
                />
              </div>
              <div>
                <Label htmlFor="shippingCountry">Country</Label>
                <Input
                  id="shippingCountry"
                  value={shippingCountry}
                  onChange={(event) => setShippingCountry(event.target.value)}
                  tabIndex={step === 3 ? undefined : -1}
                />
              </div>
            </div>
          </div>

          <div className={cn('mt-6 space-y-4', step !== 4 && 'hidden')} aria-hidden={step !== 4}>
            <div>
              <Label htmlFor="paymentTermsDays">Payment terms (days)</Label>
              <Input
                id="paymentTermsDays"
                type="number"
                min={0}
                value={paymentTermsDays}
                onChange={(event) => setPaymentTermsDays(Number(event.target.value) || 0)}
                tabIndex={step === 4 ? undefined : -1}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                tabIndex={step === 4 ? undefined : -1}
              />
            </div>
            {isEdit ? (
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className={SELECT_CLASS}
                  value={status}
                  onChange={(event) => setStatus(event.target.value as 'active' | 'inactive')}
                  tabIndex={step === 4 ? undefined : -1}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            ) : null}
          </div>

          <div className={cn('mt-6 space-y-4', step !== 5 && 'hidden')} aria-hidden={step !== 5}>
            <PreviewSection title="Identity">
              <PreviewRow label="Display name" value={displayName} />
              <PreviewRow label="Company name" value={companyName} />
              <PreviewRow label="Email" value={email} />
              <PreviewRow label="Phone" value={phone} />
            </PreviewSection>
            <PreviewSection title="Tax">
              <PreviewRow label="GSTIN" value={gstin} />
              <PreviewRow label="PAN" value={pan} />
              <PreviewRow label="State" value={billingStateName || stateCode} />
            </PreviewSection>
            <PreviewSection title="Billing address">
              <PreviewRow label="Address" value={billingAddressPreview} />
            </PreviewSection>
            <PreviewSection title="Shipping address">
              <PreviewRow label="Ship-to contact" value={shipToContactName} />
              <PreviewRow label="Ship-to company" value={shipToCompanyName} />
              <PreviewRow label="Address" value={shippingAddressPreview} />
            </PreviewSection>
            <PreviewSection title="Terms & notes">
              <PreviewRow label="Payment terms (days)" value={paymentTermsDays} />
              <PreviewRow label="Notes" value={notes} />
              {isEdit ? <PreviewRow label="Status" value={status} /> : null}
            </PreviewSection>
          </div>

          {isEdit && history.length ? (
            <div className="mt-8 border-t border-border pt-6">
              <h4 className="text-sm font-medium" style={{ color: ACCENT[FORM_SECTION_TONE] }}>
                Change history
              </h4>
              <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-xs text-muted">
                {history.map((entry) => (
                  <li key={entry.id}>
                    <span className="text-foreground">{entry.fieldName}</span>:{' '}
                    {entry.oldValue || '—'} → {entry.newValue || '—'}{' '}
                    <span className="text-muted">({new Date(entry.changedAt).toLocaleString('en-IN')})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

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
        title={isEdit ? 'Save customer changes?' : 'Submit this customer?'}
        description={
          isEdit
            ? 'This will update the customer record. You can edit again later if needed.'
            : 'Submit this customer? You cannot undo from here without editing later.'
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
