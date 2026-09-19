'use client';

import type { FormEvent, LabelHTMLAttributes, ReactNode } from 'react';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import {
  FISCAL_YEAR_MONTHS,
  INDIAN_STATES,
  SELECT_CLASS,
  optionalFormString,
  stateFromCode,
} from '@/features/finance/finance-constants';
import { uploadFinanceOrgLogo } from '@/features/finance/finance-vendor-uploads';
import { apiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateFinanceOrgAddressMutation,
  useCreateFinanceOrgGstProfileLogoMutation,
  useCreateFinanceOrgGstProfileMutation,
  useCreateFinanceOrgOfficerMutation,
  useGetFinanceOrgAddressesQuery,
  useGetFinanceOrgGstProfilesQuery,
  useGetFinanceOrgOfficersQuery,
  useGetFinanceOrganizationQuery,
  useUpdateFinanceOrgAddressMutation,
  useUpdateFinanceOrgGstProfileMutation,
  useUpdateFinanceOrganizationMutation,
} from '@/store/api/api';

/** Soft violet — not portal gold — for field labels on this page only. */
const FIELD_LABEL = '#c4b5fd';
/** Purple for section / form headings on this page only. */
const FORM_HEADING = '#a78bfa';

const STEPS: {
  id: string;
  title: string;
  subtitle: string;
  heading: string;
  description: string;
  icon: IconName;
}[] = [
  {
    id: 'org',
    title: 'Organisation',
    subtitle: 'Legal & fiscal profile',
    heading: 'Primary organisation profile',
    description: 'Legal name, default GSTIN, address, and fiscal year used across finance documents.',
    icon: 'building',
  },
  {
    id: 'gst',
    title: 'GST letterheads',
    subtitle: 'Profiles, CIN, logo',
    heading: 'GST profiles (letterheads)',
    description: 'Register each company GST with address, CIN, PAN, and logo for vendor forms.',
    icon: 'badge',
  },
  {
    id: 'addresses',
    title: 'Addresses',
    subtitle: 'Billing & shipping book',
    heading: 'Company addresses',
    description: 'Registered, operating, billing, and shipping addresses for vendor registration dropdowns.',
    icon: 'grid',
  },
  {
    id: 'officers',
    title: 'Directors & CEO',
    subtitle: 'Company officers',
    heading: 'Directors & CEO',
    description: 'Record directors and CEO details for company compliance records.',
    icon: 'users',
  },
];

function FieldLabel({ className, style, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-2 block text-xs uppercase tracking-[0.16em]', className)}
      style={{ color: FIELD_LABEL, ...style }}
      {...props}
    />
  );
}

function FormHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-lg font-medium" style={{ color: FORM_HEADING }}>
      {children}
    </h3>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: FORM_HEADING }}>
      {children}
    </p>
  );
}

export function FinanceSettingsPage() {
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.FINANCE_ORG_MANAGE),
  );
  const { data, isLoading, isError } = useGetFinanceOrganizationQuery(undefined, { skip: !canManage });
  const { data: gstData, isLoading: gstLoading } = useGetFinanceOrgGstProfilesQuery(undefined, {
    skip: !canManage,
  });
  const { data: addressData } = useGetFinanceOrgAddressesQuery(undefined, { skip: !canManage });
  const { data: officerData } = useGetFinanceOrgOfficersQuery(undefined, { skip: !canManage });

  const [updateOrg, { isLoading: saving }] = useUpdateFinanceOrganizationMutation();
  const [createGst, { isLoading: creatingGst }] = useCreateFinanceOrgGstProfileMutation();
  const [updateGst, { isLoading: updatingGst }] = useUpdateFinanceOrgGstProfileMutation();
  const [createLogo] = useCreateFinanceOrgGstProfileLogoMutation();
  const [createAddress, { isLoading: creatingAddress }] = useCreateFinanceOrgAddressMutation();
  const [updateAddress] = useUpdateFinanceOrgAddressMutation();
  const [createOfficer, { isLoading: creatingOfficer }] = useCreateFinanceOrgOfficerMutation();

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [gstSaved, setGstSaved] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [officerSaved, setOfficerSaved] = useState(false);

  const org = data?.data;
  const profiles = gstData?.data ?? [];
  const addresses = addressData?.data ?? [];
  const officers = officerData?.data ?? [];
  const lastStep = STEPS.length - 1;
  const current = STEPS[step]!;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    setError(null);
    setSaved(false);
    const form = new FormData(event.currentTarget);
    const { stateCode, stateName } = stateFromCode(String(form.get('stateCode') ?? ''));
    try {
      await updateOrg({
        legalName: String(form.get('legalName') ?? '').trim(),
        tradeName: String(form.get('tradeName') ?? '').trim(),
        gstin: optionalFormString(form.get('gstin')),
        gstRegistered: form.get('gstRegistered') === 'on',
        stateCode,
        stateName,
        addressLine1: String(form.get('addressLine1') ?? '').trim(),
        city: String(form.get('city') ?? '').trim(),
        postalCode: String(form.get('postalCode') ?? '').trim(),
        fiscalYearStartMonth: Number(form.get('fiscalYearStartMonth') ?? 4),
      }).unwrap();
      setSaved(true);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to save organisation profile.'));
    }
  }

  async function onCreateGst(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setGstSaved(false);
    const form = new FormData(event.currentTarget);
    const { stateCode, stateName } = stateFromCode(String(form.get('stateCode') ?? ''));
    try {
      const created = await createGst({
        label: String(form.get('label') ?? '').trim(),
        gstin: String(form.get('gstin') ?? '').trim(),
        legalName: String(form.get('legalName') ?? '').trim(),
        tradeName: String(form.get('tradeName') ?? '').trim(),
        cin: optionalFormString(form.get('cin')),
        pan: optionalFormString(form.get('pan')),
        addressLine1: String(form.get('addressLine1') ?? '').trim(),
        addressLine2: String(form.get('addressLine2') ?? '').trim(),
        city: String(form.get('city') ?? '').trim(),
        postalCode: String(form.get('postalCode') ?? '').trim(),
        stateCode,
        stateName,
        isDefault: form.get('isDefault') === 'on',
      }).unwrap();
      const logo = form.get('logo');
      if (logo instanceof File && logo.size > 0) {
        await uploadFinanceOrgLogo(createLogo, created.data.id, logo);
      }
      event.currentTarget.reset();
      setGstSaved(true);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to add GST profile.'));
    }
  }

  async function onCreateAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAddressSaved(false);
    const form = new FormData(event.currentTarget);
    const { stateCode, stateName } = stateFromCode(String(form.get('stateCode') ?? ''));
    try {
      await createAddress({
        label: String(form.get('label') ?? '').trim() || 'Address',
        addressType: String(form.get('addressType') ?? 'other') as
          | 'registered'
          | 'operating'
          | 'billing'
          | 'shipping'
          | 'factory'
          | 'other',
        line1: String(form.get('line1') ?? '').trim(),
        line2: String(form.get('line2') ?? '').trim(),
        city: String(form.get('city') ?? '').trim(),
        postalCode: String(form.get('postalCode') ?? '').trim(),
        stateCode,
        stateName,
        isDefault: form.get('isDefault') === 'on',
      }).unwrap();
      event.currentTarget.reset();
      setAddressSaved(true);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to add address.'));
    }
  }

  async function onCreateOfficer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setOfficerSaved(false);
    const form = new FormData(event.currentTarget);
    try {
      await createOfficer({
        role: String(form.get('role') ?? 'other') as 'ceo' | 'director' | 'other',
        fullName: String(form.get('fullName') ?? '').trim(),
        designation: String(form.get('designation') ?? '').trim(),
        email: optionalFormString(form.get('email')),
        phone: optionalFormString(form.get('phone')),
        din: optionalFormString(form.get('din')),
      }).unwrap();
      event.currentTarget.reset();
      setOfficerSaved(true);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to add officer.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Finance" title="Settings" />
        <p className="max-w-2xl text-sm text-muted">
          You need organisation manage permission to edit the finance profile.
        </p>
      </>
    );
  }

  const busy = saving || creatingGst || updatingGst || creatingAddress || creatingOfficer;

  return (
    <>
      <DelayedLoadingOverlay active={busy} />
      <PageHeader kicker="Finance" title="Organisation settings" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Legal profile, multiple GST letterheads, company addresses, and officers used on vendor
        registration and documents.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load organisation profile.</p> : null}
      {error ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <nav aria-label="Settings stages" className="shrink-0 lg:w-56">
          <ol className="relative space-y-0">
            {STEPS.map((item, index) => {
              const active = index === step;
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
                    onClick={() => {
                      setError(null);
                      setStep(index);
                    }}
                    className={cn(
                      'relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors',
                      !active && 'border-border text-muted hover:border-[#a78bfa]',
                    )}
                    style={
                      active
                        ? { borderColor: FORM_HEADING, backgroundColor: FORM_HEADING, color: '#0a0a0a' }
                        : undefined
                    }
                    aria-current={active ? 'step' : undefined}
                  >
                    <Icon name={item.icon} className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep(index);
                    }}
                    className="min-w-0 flex-1 pt-0.5 text-left"
                  >
                    <div
                      className={cn('text-sm font-medium leading-tight', active ? 'text-foreground' : 'text-muted')}
                    >
                      {item.title}
                    </div>
                    <div className="mt-0.5 text-xs text-muted">{item.subtitle}</div>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="min-w-0 max-w-3xl flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Stage {step + 1}/{STEPS.length}
          </p>
          <FormHeading>{current.heading}</FormHeading>
          <p className="mt-1 text-sm text-muted">{current.description}</p>

          {step === 0 ? (
            <div className="mt-6">
              {saved ? (
                <div className="mb-4">
                  <StatusMessage tone="success">Organisation profile saved.</StatusMessage>
                </div>
              ) : null}
              {isLoading || !org ? (
                <p className="text-sm text-muted">Loading…</p>
              ) : (
                <form key={org.updatedAt} onSubmit={onSubmit} className="space-y-5">
                  <div className="rounded-lg border border-border p-5 space-y-4">
                    <SubHeading>Identity</SubHeading>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="legalName">Legal name</FieldLabel>
                        <Input id="legalName" name="legalName" defaultValue={org.legalName} required />
                      </div>
                      <div>
                        <FieldLabel htmlFor="tradeName">Trade name</FieldLabel>
                        <Input id="tradeName" name="tradeName" defaultValue={org.tradeName} />
                      </div>
                    </div>
                    <div>
                      <FieldLabel htmlFor="gstin">Default GSTIN</FieldLabel>
                      <Input
                        id="gstin"
                        name="gstin"
                        defaultValue={org.gstin ?? ''}
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        name="gstRegistered"
                        defaultChecked={org.gstRegistered}
                        className="h-4 w-4 rounded border-border"
                      />
                      GST registered
                    </label>
                  </div>

                  <div className="rounded-lg border border-border p-5 space-y-4">
                    <SubHeading>Location & fiscal year</SubHeading>
                    <div>
                      <FieldLabel htmlFor="stateCode">State</FieldLabel>
                      <select
                        id="stateCode"
                        name="stateCode"
                        className={SELECT_CLASS}
                        defaultValue={org.stateCode ?? ''}
                        required
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
                      <FieldLabel htmlFor="addressLine1">Address</FieldLabel>
                      <Input
                        id="addressLine1"
                        name="addressLine1"
                        defaultValue={org.addressLine1}
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="city">City</FieldLabel>
                        <Input id="city" name="city" defaultValue={org.city} required />
                      </div>
                      <div>
                        <FieldLabel htmlFor="postalCode">Postal code</FieldLabel>
                        <Input id="postalCode" name="postalCode" defaultValue={org.postalCode} />
                      </div>
                    </div>
                    <div>
                      <FieldLabel htmlFor="fiscalYearStartMonth">Fiscal year start month</FieldLabel>
                      <select
                        id="fiscalYearStartMonth"
                        name="fiscalYearStartMonth"
                        className={SELECT_CLASS}
                        defaultValue={org.fiscalYearStartMonth}
                      >
                        {FISCAL_YEAR_MONTHS.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" loading={saving}>
                      {saving ? 'Saving…' : 'Save settings'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="mt-6 space-y-6">
              {gstLoading ? <p className="text-sm text-muted">Loading GST profiles…</p> : null}
              {gstSaved ? (
                <StatusMessage tone="success">GST profile added.</StatusMessage>
              ) : null}

              {profiles.length ? (
                <div className="space-y-3">
                  <SubHeading>Saved letterheads</SubHeading>
                  <ul className="space-y-3">
                    {profiles.map((profile) => (
                      <li key={profile.id} className="rounded-lg border border-border p-4 text-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-foreground">
                              {profile.label || profile.gstin}
                              {profile.isDefault ? ' · Default' : ''}
                            </div>
                            <div className="mt-1 text-muted">
                              GST {profile.gstin}
                              {profile.cin ? ` · CIN ${profile.cin}` : ''}
                              {profile.pan ? ` · PAN ${profile.pan}` : ''}
                            </div>
                            <div className="text-muted">
                              {[profile.addressLine1, profile.city, profile.postalCode]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {!profile.isDefault ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    await updateGst({
                                      id: profile.id,
                                      body: { isDefault: true },
                                    }).unwrap();
                                  } catch (cause) {
                                    setError(apiErrorMessage(cause, 'Unable to set default GST.'));
                                  }
                                }}
                              >
                                Make default
                              </Button>
                            ) : null}
                            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted">
                              <span>Logo</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="max-w-[180px] text-xs"
                                onChange={async (event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    await uploadFinanceOrgLogo(createLogo, profile.id, file);
                                  } catch (cause) {
                                    setError(apiErrorMessage(cause, 'Unable to upload logo.'));
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        {profile.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profile.logoUrl} alt="" className="mt-3 h-10 object-contain" />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted">No GST profiles yet. Add one below.</p>
              )}

              <form onSubmit={onCreateGst} className="space-y-4 rounded-lg border border-border p-5">
                <SubHeading>Add GST profile</SubHeading>

                <div className="space-y-4 rounded-md bg-foreground/[0.03] p-4">
                  <p className="text-xs text-muted">1 · Identity</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="gstLabel">Label</FieldLabel>
                      <Input id="gstLabel" name="label" placeholder="GST 1 / Peenya" />
                    </div>
                    <div>
                      <FieldLabel htmlFor="gstGstin">GSTIN</FieldLabel>
                      <Input id="gstGstin" name="gstin" required />
                    </div>
                    <div>
                      <FieldLabel htmlFor="gstLegal">Legal name</FieldLabel>
                      <Input id="gstLegal" name="legalName" />
                    </div>
                    <div>
                      <FieldLabel htmlFor="gstTrade">Trade name</FieldLabel>
                      <Input id="gstTrade" name="tradeName" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-md bg-foreground/[0.03] p-4">
                  <p className="text-xs text-muted">2 · CIN & PAN</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="gstCin">CIN</FieldLabel>
                      <Input id="gstCin" name="cin" />
                    </div>
                    <div>
                      <FieldLabel htmlFor="gstPan">PAN</FieldLabel>
                      <Input id="gstPan" name="pan" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-md bg-foreground/[0.03] p-4">
                  <p className="text-xs text-muted">3 · Address & logo</p>
                  <div>
                    <FieldLabel htmlFor="gstAddr1">Address line 1</FieldLabel>
                    <Input id="gstAddr1" name="addressLine1" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="gstAddr2">Address line 2</FieldLabel>
                      <Input id="gstAddr2" name="addressLine2" />
                    </div>
                    <div>
                      <FieldLabel htmlFor="gstCity">City</FieldLabel>
                      <Input id="gstCity" name="city" />
                    </div>
                    <div>
                      <FieldLabel htmlFor="gstState">State</FieldLabel>
                      <select id="gstState" name="stateCode" className={SELECT_CLASS} defaultValue="">
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((state) => (
                          <option key={state.code} value={state.code}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel htmlFor="gstPostal">Postal code</FieldLabel>
                      <Input id="gstPostal" name="postalCode" />
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel htmlFor="gstLogo">Logo</FieldLabel>
                      <Input
                        id="gstLogo"
                        name="logo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" name="isDefault" className="h-4 w-4 rounded border-border" />
                  Set as default letterhead
                </label>
                <Button type="submit" loading={creatingGst}>
                  Add GST profile
                </Button>
              </form>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-6 space-y-6">
              {addressSaved ? (
                <StatusMessage tone="success">Address added.</StatusMessage>
              ) : null}
              <div className="space-y-3">
                <SubHeading>Saved addresses</SubHeading>
                {addresses.length ? (
                  <ul className="space-y-2 text-sm">
                    {addresses.map((address) => (
                      <li key={address.id} className="rounded-lg border border-border px-4 py-3">
                        <span className="font-medium text-foreground">{address.label}</span>
                        <span className="text-muted"> · {address.addressType}</span>
                        <div className="mt-1 text-muted">
                          {[address.line1, address.line2, address.city, address.stateName, address.postalCode]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                        {!address.isDefault ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-2"
                            onClick={async () => {
                              try {
                                await updateAddress({
                                  id: address.id,
                                  body: { isDefault: true },
                                }).unwrap();
                              } catch (cause) {
                                setError(apiErrorMessage(cause, 'Unable to update address.'));
                              }
                            }}
                          >
                            Mark default
                          </Button>
                        ) : (
                          <span className="mt-1 inline-block text-xs text-muted">Default</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No addresses yet. Add one below.</p>
                )}
              </div>

              <form onSubmit={onCreateAddress} className="space-y-4 rounded-lg border border-border p-5">
                <SubHeading>Add address</SubHeading>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="addrLabel">Label</FieldLabel>
                    <Input id="addrLabel" name="label" placeholder="Registered office" />
                  </div>
                  <div>
                    <FieldLabel htmlFor="addrType">Type</FieldLabel>
                    <select
                      id="addrType"
                      name="addressType"
                      className={SELECT_CLASS}
                      defaultValue="registered"
                    >
                      <option value="registered">Registered</option>
                      <option value="operating">Operating</option>
                      <option value="billing">Billing</option>
                      <option value="shipping">Shipping</option>
                      <option value="factory">Factory</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel htmlFor="addrLine1">Line 1</FieldLabel>
                    <Input id="addrLine1" name="line1" required />
                  </div>
                  <div>
                    <FieldLabel htmlFor="addrLine2">Line 2</FieldLabel>
                    <Input id="addrLine2" name="line2" />
                  </div>
                  <div>
                    <FieldLabel htmlFor="addrCity">City</FieldLabel>
                    <Input id="addrCity" name="city" />
                  </div>
                  <div>
                    <FieldLabel htmlFor="addrState">State</FieldLabel>
                    <select id="addrState" name="stateCode" className={SELECT_CLASS} defaultValue="">
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state.code} value={state.code}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="addrPostal">Postal code</FieldLabel>
                    <Input id="addrPostal" name="postalCode" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" name="isDefault" className="h-4 w-4 rounded border-border" />
                  Default address
                </label>
                <Button type="submit" loading={creatingAddress}>
                  Add address
                </Button>
              </form>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-6 space-y-6">
              {officerSaved ? (
                <StatusMessage tone="success">Officer added.</StatusMessage>
              ) : null}
              <div className="space-y-3">
                <SubHeading>Saved officers</SubHeading>
                {officers.length ? (
                  <ul className="space-y-2 text-sm">
                    {officers.map((officer) => (
                      <li key={officer.id} className="rounded-lg border border-border px-4 py-3">
                        <span className="font-medium text-foreground">{officer.fullName}</span>
                        <span className="text-muted">
                          {' '}
                          · {officer.role.toUpperCase()}
                          {officer.designation ? ` · ${officer.designation}` : ''}
                          {officer.din ? ` · DIN ${officer.din}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No officers yet. Add one below.</p>
                )}
              </div>

              <form onSubmit={onCreateOfficer} className="space-y-4 rounded-lg border border-border p-5">
                <SubHeading>Add officer</SubHeading>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="officerRole">Role</FieldLabel>
                    <select id="officerRole" name="role" className={SELECT_CLASS} defaultValue="director">
                      <option value="ceo">CEO</option>
                      <option value="director">Director</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="officerName">Full name</FieldLabel>
                    <Input id="officerName" name="fullName" required />
                  </div>
                  <div>
                    <FieldLabel htmlFor="officerDesignation">Designation</FieldLabel>
                    <Input id="officerDesignation" name="designation" />
                  </div>
                  <div>
                    <FieldLabel htmlFor="officerDin">DIN</FieldLabel>
                    <Input id="officerDin" name="din" />
                  </div>
                  <div>
                    <FieldLabel htmlFor="officerEmail">Email</FieldLabel>
                    <Input id="officerEmail" name="email" type="email" />
                  </div>
                  <div>
                    <FieldLabel htmlFor="officerPhone">Phone</FieldLabel>
                    <Input id="officerPhone" name="phone" />
                  </div>
                </div>
                <Button type="submit" loading={creatingOfficer}>
                  Add officer
                </Button>
              </form>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0}
              onClick={() => {
                setError(null);
                setStep((prev) => Math.max(prev - 1, 0));
              }}
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={step === lastStep}
              onClick={() => {
                setError(null);
                setStep((prev) => Math.min(prev + 1, lastStep));
              }}
            >
              Next stage
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
