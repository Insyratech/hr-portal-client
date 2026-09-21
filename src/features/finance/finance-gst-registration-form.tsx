'use client';

import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ActionConfirmDialog } from '@/components/dashboard/action-confirm-dialog';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import {
  INDIAN_STATES,
  SELECT_CLASS,
  stateFromCode,
} from '@/features/finance/finance-constants';
import { uploadFinanceOrgLogo } from '@/features/finance/finance-vendor-uploads';
import { apiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { ACCENT, FORM_SECTION_TONE } from '@/lib/ui-accents';
import {
  useCreateFinanceOrgGstProfileLogoMutation,
  useCreateFinanceOrgGstProfileMutation,
  useLookupFinanceGstinMutation,
  useUpdateFinanceOrgGstProfileMutation,
} from '@/store/api/api';
import type { FinanceOrgGstProfile, GstinLookupResult } from '@/types/api';

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
    description: 'GSTIN is the unique key for this letterhead. Lookup can pre-fill state and PAN.',
    icon: 'badge',
  },
  {
    id: 'identity',
    title: 'Identity',
    subtitle: 'Legal & trade name',
    heading: 'Company identity',
    description: 'Legal name is required and used as the display label for this registration.',
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
    id: 'preview',
    title: 'Preview',
    subtitle: 'Confirm & submit',
    heading: 'Review GST registration',
    description: 'Check all details, then confirm to save this registration.',
    icon: 'check',
  },
];

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
  const [lookupGstin, { isLoading: lookingUp }] = useLookupFinanceGstinMutation();

  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(() => (profile ? STEPS.length - 1 : 0));
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingLookup, setPendingLookup] = useState<GstinLookupResult | null>(null);

  const [gstin, setGstin] = useState(profile?.gstin ?? '');
  const [registrationType, setRegistrationType] = useState<
    'regular' | 'composition' | 'unregistered'
  >(profile?.registrationType ?? 'regular');
  const [isDefault, setIsDefault] = useState(profile?.isDefault ?? false);
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

  const lastStep = STEPS.length - 1;
  const current = STEPS[step]!;
  const saving = creating || updating;
  const { stateName } = stateFromCode(stateCode);

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
  }, [profile]);

  function applyLookup(result: GstinLookupResult) {
    if (result.stateCode) setStateCode(result.stateCode);
    if (result.pan) setPan(result.pan);
    if (result.legalName && !legalName.trim()) setLegalName(result.legalName);
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
    };
  }

  async function handleConfirmSave() {
    setError(null);
    const body = collectBody();
    if (!body.gstin || !body.legalName || !body.addressLine1 || !body.city) {
      setError('GSTIN, legal name, address line 1, and city are required.');
      setConfirmOpen(false);
      return;
    }
    try {
      const result = profile
        ? await updateProfile({ id: profile.id, body }).unwrap()
        : await createProfile(body).unwrap();
      if (logoFile) {
        await uploadFinanceOrgLogo(createLogo, result.data.id, logoFile);
      }
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
    if (step !== lastStep) {
      goNext();
      return;
    }
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      if (!gstin.trim()) setStep(0);
      else if (!legalName.trim()) setStep(1);
      else setStep(2);
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

  const registrationTypeLabel =
    registrationType === 'regular'
      ? 'Regular'
      : registrationType === 'composition'
        ? 'Composition'
        : 'Unregistered';

  return (
    <form onSubmit={onSubmit} onKeyDown={onFormKeyDown} className="mt-4">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <nav aria-label="GST registration stages" className="shrink-0 lg:w-56">
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
            <div className="mt-4 rounded border border-[var(--accent-purple)]/40 bg-[var(--accent-purple)]/10 p-4">
              <p className="text-sm">{pendingLookup.message}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => applyLookup(pendingLookup)}>
                  Apply suggested details
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setPendingLookup(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          <div className={cn('mt-6 space-y-4', step !== 0 && 'hidden')} aria-hidden={step !== 0}>
            <div>
              <Label htmlFor="gstRegGstin">GSTIN</Label>
              <div className="flex gap-2">
                <Input
                  id="gstRegGstin"
                  value={gstin}
                  onChange={(event) => setGstin(event.target.value.toUpperCase())}
                  onBlur={() => void runGstinLookup()}
                  maxLength={15}
                  required
                  readOnly={isEdit}
                  tabIndex={step === 0 ? undefined : -1}
                />
                {!isEdit ? (
                  <Button
                    type="button"
                    variant="outline"
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
          </div>

          <div className={cn('mt-6 space-y-4', step !== 1 && 'hidden')} aria-hidden={step !== 1}>
            <div>
              <Label htmlFor="gstLegalName">Legal name</Label>
              <Input
                id="gstLegalName"
                value={legalName}
                onChange={(event) => setLegalName(event.target.value)}
                required
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
                required
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
                  required
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
            <PreviewSection title="GSTIN">
              <PreviewRow label="GSTIN" value={gstin.trim().toUpperCase()} />
              <PreviewRow label="Registration type" value={registrationTypeLabel} />
              <PreviewRow label="Default letterhead" value={isDefault} />
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
        title={isEdit ? 'Save GST registration changes?' : 'Register this GSTIN?'}
        description={
          isEdit
            ? 'This will update the GST registration letterhead. Changes apply to new documents using this GSTIN.'
            : `Register GSTIN ${gstin.trim().toUpperCase()} as a letterhead? You can register up to 3 active GST registrations.`
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
