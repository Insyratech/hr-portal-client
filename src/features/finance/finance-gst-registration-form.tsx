'use client';

import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ActionConfirmDialog } from '@/components/dashboard/action-confirm-dialog';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import {
  FISCAL_YEAR_MONTHS,
  INDIAN_STATES,
  SELECT_CLASS,
  optionalFormString,
  stateFromCode,
} from '@/features/finance/finance-constants';
import { GstinLookupResultCard } from '@/features/finance/gstin-lookup-result-card';
import { uploadFinanceOrgLogo } from '@/features/finance/finance-vendor-uploads';
import { apiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { ACCENT, FORM_SECTION_TONE } from '@/lib/ui-accents';
import {
  useCreateFinanceOrgGstProfileLogoMutation,
  useCreateFinanceOrgGstProfileMutation,
  useCreateFinanceOrgOfficerMutation,
  useGetFinanceOrgEmployeeOptionsQuery,
  useGetFinanceOrgOfficersQuery,
  useGetFinanceOrganizationQuery,
  useLookupFinanceGstinMutation,
  useUpdateFinanceOrgGstProfileMutation,
} from '@/store/api/api';
import type { FinanceEmployeeOption, FinanceOrgGstProfile, FinanceOrgOfficer, GstinLookupResult } from '@/types/api';

const STEPS: {
  id: string;
  title: string;
  subtitle: string;
  heading: string;
  description: string;
  icon: IconName;
}[] = [
  {
    id: 'gstin',
    title: 'GSTIN',
    subtitle: 'Registration key',
    heading: 'GST registration',
    description: 'GSTIN is the unique key for this letterhead. Use Look up to decode state and PAN.',
    icon: 'badge',
  },
  {
    id: 'identity',
    title: 'Identity',
    subtitle: 'Legal & trade name',
    heading: 'Company identity',
    description: 'Legal name, trade name, CIN, and PAN for this GSTIN letterhead.',
    icon: 'building',
  },
  {
    id: 'address',
    title: 'Address',
    subtitle: 'Registered location',
    heading: 'Registered address',
    description: 'Address printed on vendor forms and documents for this GSTIN.',
    icon: 'grid',
  },
  {
    id: 'contact',
    title: 'Contact',
    subtitle: 'Phone, email, logo',
    heading: 'Contact & branding',
    description: 'Optional contact details and logo for this letterhead.',
    icon: 'user',
  },
  {
    id: 'officers',
    title: 'Officers',
    subtitle: 'Directors & CEO',
    heading: 'Directors & CEO',
    description: 'Link directors and CEO for this GST registration. Pick from employees or enter manually.',
    icon: 'users',
  },
  {
    id: 'preview',
    title: 'Preview',
    subtitle: 'Confirm & submit',
    heading: 'Review GST registration',
    description: 'Check all details, then confirm to save this registration.',
    icon: 'check',
  },
];

type PendingOfficer = {
  tempId: string;
  role: 'ceo' | 'director' | 'other';
  fullName: string;
  email: string | null;
  phone: string | null;
  din: string | null;
  employeeId: string | null;
};

function PreviewRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  let text = '—';
  if (typeof value === 'boolean') {
    text = value ? 'Yes' : 'No';
  } else if (value != null && String(value).trim()) {
    text = String(value);
  }
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

function parseMultilineAddress(text: string | null | undefined): {
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
} {
  if (!text?.trim()) {
    return { line1: '', line2: '', city: '', postalCode: '' };
  }
  const lines = text
    .split(/\n|,/)
    .map((part) => part.trim())
    .filter(Boolean);
  const postalMatch = text.match(/\b(\d{6})\b/);
  return {
    line1: lines[0] ?? '',
    line2: lines[1] ?? '',
    city: lines[2] ?? '',
    postalCode: postalMatch?.[1] ?? '',
  };
}

function officerRoleLabel(role: PendingOfficer['role'] | FinanceOrgOfficer['role']) {
  if (role === 'ceo') return 'CEO';
  if (role === 'director') return 'Director';
  return 'Other';
}

type GstRegistrationFormProps = {
  profile?: FinanceOrgGstProfile | null;
  onSaved: (profile: FinanceOrgGstProfile) => void;
  onCancel: () => void;
};

export function FinanceGstRegistrationForm({ profile, onSaved, onCancel }: GstRegistrationFormProps) {
  const isEdit = Boolean(profile);
  const [createProfile, { isLoading: creating }] = useCreateFinanceOrgGstProfileMutation();
  const [updateProfile, { isLoading: updating }] = useUpdateFinanceOrgGstProfileMutation();
  const [createLogo] = useCreateFinanceOrgGstProfileLogoMutation();
  const [createOfficer] = useCreateFinanceOrgOfficerMutation();
  const [lookupGstin, { isLoading: lookingUp }] = useLookupFinanceGstinMutation();
  const { data: orgData } = useGetFinanceOrganizationQuery();
  const { data: employeesData, isLoading: employeesLoading } = useGetFinanceOrgEmployeeOptionsQuery();
  const { data: officersData } = useGetFinanceOrgOfficersQuery(
    profile?.id ? { orgGstProfileId: profile.id } : undefined,
    { skip: !profile?.id },
  );

  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(() => (profile ? STEPS.length - 1 : 0));
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingLookup, setPendingLookup] = useState<GstinLookupResult | null>(null);
  const [lookupDismissed, setLookupDismissed] = useState(false);

  const [gstin, setGstin] = useState(profile?.gstin ?? '');
  const [registrationType, setRegistrationType] = useState<
    'regular' | 'composition' | 'unregistered'
  >(profile?.registrationType ?? 'regular');
  const [isDefault, setIsDefault] = useState(profile?.isDefault ?? false);
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState(4);
  const [legalName, setLegalName] = useState(profile?.legalName ?? '');
  const [tradeName, setTradeName] = useState(profile?.tradeName ?? '');
  const [cin, setCin] = useState(profile?.cin ?? '');
  const [pan, setPan] = useState(profile?.pan ?? '');
  const [addressLine1, setAddressLine1] = useState(profile?.addressLine1 ?? '');
  const [addressLine2, setAddressLine2] = useState(profile?.addressLine2 ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [stateCode, setStateCode] = useState(profile?.stateCode ?? '');
  const [postalCode, setPostalCode] = useState(profile?.postalCode ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [website, setWebsite] = useState(profile?.website ?? '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [pendingOfficers, setPendingOfficers] = useState<PendingOfficer[]>([]);
  const [officerDraft, setOfficerDraft] = useState({
    role: 'director' as PendingOfficer['role'],
    employeeId: '',
    fullName: '',
    email: '',
    phone: '',
    din: '',
  });

  const lastStep = STEPS.length - 1;
  const current = STEPS[step]!;
  const saving = creating || updating;
  const { stateName } = stateFromCode(stateCode);
  const employees = employeesData?.data ?? [];
  const existingOfficers = officersData?.data ?? [];

  const employeeOptions = useMemo(
    () =>
      [...employees].sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' })),
    [employees],
  );

  useEffect(() => {
    if (orgData?.data?.fiscalYearStartMonth) {
      setFiscalYearStartMonth(orgData.data.fiscalYearStartMonth);
    }
  }, [orgData?.data?.fiscalYearStartMonth]);

  useEffect(() => {
    if (!profile) return;
    setGstin(profile.gstin ?? '');
    setRegistrationType(profile.registrationType ?? 'regular');
    setIsDefault(profile.isDefault ?? false);
    setLegalName(profile.legalName ?? '');
    setTradeName(profile.tradeName ?? '');
    setCin(profile.cin ?? '');
    setPan(profile.pan ?? '');
    setAddressLine1(profile.addressLine1 ?? '');
    setAddressLine2(profile.addressLine2 ?? '');
    setCity(profile.city ?? '');
    setStateCode(profile.stateCode ?? '');
    setPostalCode(profile.postalCode ?? '');
    setPhone(profile.phone ?? '');
    setEmail(profile.email ?? '');
    setWebsite(profile.website ?? '');
    setLogoFile(null);
    setPendingOfficers([]);
    setPendingLookup(null);
    setLookupDismissed(false);
  }, [profile]);

  function applyLookupAutoFill(result: GstinLookupResult) {
    if (result.stateCode) setStateCode(result.stateCode);
    if (result.pan) setPan(result.pan);
    if (result.legalName) setLegalName(result.legalName);
    if (result.tradeName) setTradeName(result.tradeName);
    if (result.cin) setCin(result.cin);
    if (result.registrationType) setRegistrationType(result.registrationType);
    if (result.addressLine1) {
      setAddressLine1(result.addressLine1);
      if (result.addressLine2) setAddressLine2(result.addressLine2);
      if (result.city) setCity(result.city);
      if (result.postalCode) setPostalCode(result.postalCode);
    } else if (result.billingAddress) {
      const parsed = parseMultilineAddress(result.billingAddress);
      if (parsed.line1) setAddressLine1(parsed.line1);
      if (parsed.line2) setAddressLine2(parsed.line2);
      if (parsed.city) setCity(parsed.city);
      if (parsed.postalCode) setPostalCode(parsed.postalCode);
    }
    setPendingLookup(null);
    setLookupDismissed(true);
  }

  function dismissLookupManual() {
    setPendingLookup(null);
    setLookupDismissed(true);
  }

  async function runGstinLookup(raw?: string) {
    const value = (raw ?? gstin).trim().toUpperCase();
    if (value.length < 15) {
      setError('Enter a 15-character GSTIN before looking up.');
      return;
    }
    setError(null);
    setLookupDismissed(false);
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

  function fillOfficerFromEmployee(employeeId: string) {
    const employee = employees.find((item: FinanceEmployeeOption) => item.id === employeeId);
    if (!employee) {
      setOfficerDraft((prev) => ({ ...prev, employeeId }));
      return;
    }
    setOfficerDraft((prev) => ({
      ...prev,
      employeeId,
      fullName: employee.fullName,
      email: employee.email ?? '',
      phone: employee.phone ?? '',
    }));
  }

  function addPendingOfficer() {
    const fullName = officerDraft.fullName.trim();
    if (!fullName) {
      setError('Officer full name is required.');
      return;
    }
    setError(null);
    setPendingOfficers((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        role: officerDraft.role,
        fullName,
        email: optionalFormString(officerDraft.email),
        phone: optionalFormString(officerDraft.phone),
        din: optionalFormString(officerDraft.din),
        employeeId: officerDraft.employeeId || null,
      },
    ]);
    setOfficerDraft({
      role: 'director',
      employeeId: '',
      fullName: '',
      email: '',
      phone: '',
      din: '',
    });
  }

  function validateStep(index: number): boolean {
    if (index === 0) {
      const value = gstin.trim().toUpperCase();
      if (!value) {
        setError('GSTIN is required.');
        return false;
      }
      if (value.length !== 15) {
        setError('GSTIN must be 15 characters.');
        return false;
      }
    }
    if (index === 1 && !legalName.trim()) {
      setError('Legal name is required.');
      return false;
    }
    if (index === 2) {
      if (!addressLine1.trim()) {
        setError('Address line 1 is required.');
        return false;
      }
      if (!city.trim()) {
        setError('City is required.');
        return false;
      }
      if (!stateCode) {
        setError('State is required.');
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

  function collectBody() {
    const { stateCode: resolvedStateCode, stateName: resolvedStateName } = stateFromCode(stateCode);
    return {
      gstin: gstin.trim().toUpperCase(),
      registrationType,
      legalName: legalName.trim(),
      tradeName: tradeName.trim(),
      cin: cin.trim() || null,
      pan: pan.trim() || null,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      stateCode: resolvedStateCode,
      stateName: resolvedStateName,
      phone: phone.trim() || null,
      email: email.trim() || null,
      website: website.trim() || null,
      isDefault,
      fiscalYearStartMonth,
    };
  }

  async function handleConfirmSave() {
    setError(null);
    const body = collectBody();
    if (!body.gstin || !body.legalName || !body.addressLine1 || !body.city || !body.stateCode) {
      setError('GSTIN, legal name, address line 1, city, and state are required.');
      setConfirmOpen(false);
      return;
    }
    try {
      const result = profile
        ? await updateProfile({ id: profile.id, body }).unwrap()
        : await createProfile(body).unwrap();
      const savedId = result.data.id;
      if (logoFile) {
        await uploadFinanceOrgLogo(createLogo, savedId, logoFile);
      }
      for (const officer of pendingOfficers) {
        await createOfficer({
          orgGstProfileId: savedId,
          role: officer.role,
          fullName: officer.fullName,
          designation: officerRoleLabel(officer.role),
          email: officer.email,
          phone: officer.phone,
          din: officer.din,
        }).unwrap();
      }
      setPendingOfficers([]);
      setConfirmOpen(false);
      onSaved(result.data);
    } catch (cause) {
      setError(
        apiErrorMessage(
          cause,
          profile ? 'Unable to update GST registration.' : 'Unable to register GST.',
        ),
      );
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

  const registrationTypeLabel =
    registrationType === 'regular'
      ? 'Regular'
      : registrationType === 'composition'
        ? 'Composition'
        : 'Unregistered';

  return (
    <form onSubmit={onSubmit} onKeyDown={onFormKeyDown} className="mt-4">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <nav aria-label="GST registration stages" className="shrink-0 lg:w-52">
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
              onAutoFill={() => applyLookupAutoFill(pendingLookup)}
              onManual={dismissLookupManual}
            />
          ) : null}

          <div className={cn('mt-6 space-y-4', step !== 0 && 'hidden')} aria-hidden={step !== 0}>
            <div>
              <Label htmlFor="gstRegGstin">GSTIN</Label>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="gstRegGstin"
                  className="min-w-0 flex-1 font-mono tracking-wide"
                  value={gstin}
                  onChange={(event) => {
                    setGstin(event.target.value.toUpperCase());
                    setPendingLookup(null);
                    setLookupDismissed(false);
                  }}
                  maxLength={15}
                  readOnly={isEdit}
                  tabIndex={step === 0 ? undefined : -1}
                  autoComplete="off"
                />
                {!isEdit ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 whitespace-nowrap sm:min-w-[7rem]"
                    loading={lookingUp}
                    onClick={() => void runGstinLookup()}
                    tabIndex={step === 0 ? undefined : -1}
                  >
                    Look up
                  </Button>
                ) : null}
              </div>
              {isEdit ? (
                <p className="mt-1 text-xs text-muted">
                  GSTIN cannot be changed after registration. Register a new GSTIN to use a different number.
                </p>
              ) : lookupDismissed && !pendingLookup ? (
                <p className="mt-1 text-xs text-muted">Continuing with manual entry. Fields remain editable.</p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="registrationType">Registration type</Label>
              <select
                id="registrationType"
                className={SELECT_CLASS}
                value={registrationType}
                onChange={(event) =>
                  setRegistrationType(event.target.value as 'regular' | 'composition' | 'unregistered')
                }
                tabIndex={step === 0 ? undefined : -1}
              >
                <option value="regular">Regular</option>
                <option value="composition">Composition</option>
                <option value="unregistered">Unregistered</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(event) => setIsDefault(event.target.checked)}
                className="h-4 w-4 rounded border-border"
                tabIndex={step === 0 ? undefined : -1}
              />
              Set as default letterhead
            </label>
            <div>
              <Label htmlFor="gstFiscalYearStartMonth">Fiscal year start month</Label>
              <select
                id="gstFiscalYearStartMonth"
                className={SELECT_CLASS}
                value={fiscalYearStartMonth}
                onChange={(event) => setFiscalYearStartMonth(Number(event.target.value))}
                tabIndex={step === 0 ? undefined : -1}
              >
                {FISCAL_YEAR_MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">
                Company fiscal calendar for reports. Saved with this GST registration.
              </p>
            </div>
          </div>

          <div className={cn('mt-6 space-y-4', step !== 1 && 'hidden')} aria-hidden={step !== 1}>
            <div>
              <Label htmlFor="gstLegalName">Legal name</Label>
              <Input
                id="gstLegalName"
                value={legalName}
                onChange={(event) => setLegalName(event.target.value)}
                tabIndex={step === 1 ? undefined : -1}
              />
            </div>
            <div>
              <Label htmlFor="gstTradeName">Trade name</Label>
              <Input
                id="gstTradeName"
                value={tradeName}
                onChange={(event) => setTradeName(event.target.value)}
                tabIndex={step === 1 ? undefined : -1}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="gstCin">CIN</Label>
                <Input
                  id="gstCin"
                  value={cin}
                  onChange={(event) => setCin(event.target.value.toUpperCase())}
                  tabIndex={step === 1 ? undefined : -1}
                />
              </div>
              <div>
                <Label htmlFor="gstPan">PAN</Label>
                <Input
                  id="gstPan"
                  value={pan}
                  onChange={(event) => setPan(event.target.value.toUpperCase())}
                  tabIndex={step === 1 ? undefined : -1}
                />
              </div>
            </div>
          </div>

          <div className={cn('mt-6 space-y-4', step !== 2 && 'hidden')} aria-hidden={step !== 2}>
            <div>
              <Label htmlFor="gstAddressLine1">Address line 1</Label>
              <Input
                id="gstAddressLine1"
                value={addressLine1}
                onChange={(event) => setAddressLine1(event.target.value)}
                tabIndex={step === 2 ? undefined : -1}
              />
            </div>
            <div>
              <Label htmlFor="gstAddressLine2">Address line 2</Label>
              <Input
                id="gstAddressLine2"
                value={addressLine2}
                onChange={(event) => setAddressLine2(event.target.value)}
                tabIndex={step === 2 ? undefined : -1}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="gstCity">City</Label>
                <Input
                  id="gstCity"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  tabIndex={step === 2 ? undefined : -1}
                />
              </div>
              <div>
                <Label htmlFor="gstStateCode">State</Label>
                <select
                  id="gstStateCode"
                  className={SELECT_CLASS}
                  value={stateCode}
                  onChange={(event) => setStateCode(event.target.value)}
                  tabIndex={step === 2 ? undefined : -1}
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="gstPostalCode">Postal code</Label>
                <Input
                  id="gstPostalCode"
                  value={postalCode}
                  onChange={(event) => setPostalCode(event.target.value)}
                  tabIndex={step === 2 ? undefined : -1}
                />
              </div>
            </div>
          </div>

          <div className={cn('mt-6 space-y-4', step !== 3 && 'hidden')} aria-hidden={step !== 3}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="gstPhone">Phone</Label>
                <Input
                  id="gstPhone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  tabIndex={step === 3 ? undefined : -1}
                />
              </div>
              <div>
                <Label htmlFor="gstEmail">Email</Label>
                <Input
                  id="gstEmail"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  tabIndex={step === 3 ? undefined : -1}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="gstWebsite">Website</Label>
              <Input
                id="gstWebsite"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://"
                tabIndex={step === 3 ? undefined : -1}
              />
            </div>
            <div>
              <Label htmlFor="gstLogo">Logo</Label>
              <Input
                id="gstLogo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setLogoFile(file && file.size > 0 ? file : null);
                }}
                tabIndex={step === 3 ? undefined : -1}
              />
              {profile?.logoUrl && !logoFile ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logoUrl} alt="" className="mt-2 h-10 object-contain" />
              ) : null}
              {logoFile ? <p className="mt-1 text-xs text-muted">Selected: {logoFile.name}</p> : null}
            </div>
          </div>

          <div className={cn('mt-6 space-y-4', step !== 4 && 'hidden')} aria-hidden={step !== 4}>
            {existingOfficers.length ? (
              <div className="rounded border border-border p-4">
                <p className="text-sm font-medium text-foreground">Saved for this GSTIN</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {existingOfficers.map((officer) => (
                    <li key={officer.id} className="text-muted">
                      <span className="text-foreground">{officer.fullName}</span>
                      {' · '}
                      {officerRoleLabel(officer.role)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded border border-border p-4 space-y-4">
              <p className="text-sm font-medium text-foreground">Add officer</p>
              <div>
                <Label htmlFor="gstOfficerEmployee">Employee (optional)</Label>
                <select
                  id="gstOfficerEmployee"
                  className={SELECT_CLASS}
                  value={officerDraft.employeeId}
                  onChange={(event) => fillOfficerFromEmployee(event.target.value)}
                  tabIndex={step === 4 ? undefined : -1}
                  disabled={employeesLoading}
                >
                  <option value="">
                    {employeesLoading
                      ? 'Loading employees…'
                      : employeeOptions.length
                        ? 'Select employee or type manually'
                        : 'No employees found — type manually'}
                  </option>
                  {employeeOptions.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName}
                      {employee.employeeCode ? ` (${employee.employeeCode})` : ''}
                      {employee.designationName ? ` — ${employee.designationName}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="gstOfficerRole">Role</Label>
                  <select
                    id="gstOfficerRole"
                    className={SELECT_CLASS}
                    value={officerDraft.role}
                    onChange={(event) =>
                      setOfficerDraft((prev) => ({
                        ...prev,
                        role: event.target.value as PendingOfficer['role'],
                      }))
                    }
                    tabIndex={step === 4 ? undefined : -1}
                  >
                    <option value="ceo">CEO</option>
                    <option value="director">Director</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="gstOfficerName">Full name</Label>
                  <Input
                    id="gstOfficerName"
                    value={officerDraft.fullName}
                    onChange={(event) =>
                      setOfficerDraft((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    tabIndex={step === 4 ? undefined : -1}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="gstOfficerDin">DIN</Label>
                <Input
                  id="gstOfficerDin"
                  value={officerDraft.din}
                  onChange={(event) =>
                    setOfficerDraft((prev) => ({ ...prev, din: event.target.value.toUpperCase() }))
                  }
                  tabIndex={step === 4 ? undefined : -1}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="gstOfficerEmail">Email</Label>
                  <Input
                    id="gstOfficerEmail"
                    type="email"
                    value={officerDraft.email}
                    onChange={(event) =>
                      setOfficerDraft((prev) => ({ ...prev, email: event.target.value }))
                    }
                    tabIndex={step === 4 ? undefined : -1}
                  />
                </div>
                <div>
                  <Label htmlFor="gstOfficerPhone">Phone</Label>
                  <Input
                    id="gstOfficerPhone"
                    value={officerDraft.phone}
                    onChange={(event) =>
                      setOfficerDraft((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    tabIndex={step === 4 ? undefined : -1}
                  />
                </div>
              </div>
              <Button type="button" variant="outline" onClick={addPendingOfficer} tabIndex={step === 4 ? undefined : -1}>
                Add to list
              </Button>
            </div>

            {pendingOfficers.length ? (
              <ul className="space-y-2 text-sm">
                {pendingOfficers.map((officer) => (
                  <li
                    key={officer.tempId}
                    className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2"
                  >
                    <span>
                      <span className="text-foreground">{officer.fullName}</span>
                      {' · '}
                      {officerRoleLabel(officer.role)}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setPendingOfficers((prev) => prev.filter((item) => item.tempId !== officer.tempId))
                      }
                      tabIndex={step === 4 ? undefined : -1}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                Officers are optional. You can add them now or later when editing this GSTIN.
              </p>
            )}
          </div>

          <div className={cn('mt-6 space-y-4', step !== 5 && 'hidden')} aria-hidden={step !== 5}>
            <PreviewSection title="GSTIN">
              <PreviewRow label="GSTIN" value={gstin.trim().toUpperCase()} />
              <PreviewRow label="Registration type" value={registrationTypeLabel} />
              <PreviewRow label="Default letterhead" value={isDefault} />
              <PreviewRow
                label="Fiscal year start"
                value={
                  FISCAL_YEAR_MONTHS.find((month) => month.value === fiscalYearStartMonth)?.label ??
                  String(fiscalYearStartMonth)
                }
              />
            </PreviewSection>
            <PreviewSection title="Identity">
              <PreviewRow label="Legal name" value={legalName} />
              <PreviewRow label="Trade name" value={tradeName} />
              <PreviewRow label="CIN" value={cin} />
              <PreviewRow label="PAN" value={pan} />
            </PreviewSection>
            <PreviewSection title="Address">
              <PreviewRow label="Line 1" value={addressLine1} />
              <PreviewRow label="Line 2" value={addressLine2} />
              <PreviewRow label="City" value={city} />
              <PreviewRow label="State" value={stateName || stateCode} />
              <PreviewRow label="Postal code" value={postalCode} />
            </PreviewSection>
            <PreviewSection title="Contact & branding">
              <PreviewRow label="Phone" value={phone} />
              <PreviewRow label="Email" value={email} />
              <PreviewRow label="Website" value={website} />
              <PreviewRow label="Logo" value={logoFile?.name ?? (profile?.logoUrl ? 'Current logo' : null)} />
            </PreviewSection>
            <PreviewSection title="Directors & CEO">
              {existingOfficers.length === 0 && pendingOfficers.length === 0 ? (
                <PreviewRow label="Officers" value="None added" />
              ) : (
                <>
                  {existingOfficers.map((officer) => (
                    <PreviewRow
                      key={officer.id}
                      label={officerRoleLabel(officer.role)}
                      value={officer.fullName}
                    />
                  ))}
                  {pendingOfficers.map((officer) => (
                    <PreviewRow
                      key={officer.tempId}
                      label={`${officerRoleLabel(officer.role)} (new)`}
                      value={officer.fullName}
                    />
                  ))}
                </>
              )}
            </PreviewSection>
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
            {step === lastStep ? (
              <Button
                type="button"
                loading={saving}
                onClick={() => {
                  if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
                    if (!gstin.trim() || gstin.trim().length !== 15) setStep(0);
                    else if (!legalName.trim()) setStep(1);
                    else setStep(2);
                    return;
                  }
                  setConfirmOpen(true);
                }}
              >
                Confirm & submit
              </Button>
            ) : (
              <Button type="button" onClick={goNext}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>

      <ActionConfirmDialog
        open={confirmOpen}
        title={isEdit ? 'Save GST registration changes?' : 'Register this GSTIN?'}
        description={
          isEdit
            ? 'This will update the GST registration letterhead. Changes apply to new documents using this GSTIN.'
            : `Register GSTIN ${gstin.trim().toUpperCase()} as a letterhead? You can register up to 4 active GST registrations.`
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
