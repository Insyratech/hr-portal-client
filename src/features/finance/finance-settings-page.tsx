'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { ActionConfirmDialog } from '@/components/dashboard/action-confirm-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ACCENT, FORM_SECTION_TONE } from '@/lib/ui-accents';
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
  {
    id: 'preview',
    title: 'Preview',
    subtitle: 'Review & submit',
    heading: 'Review and submit',
    description: 'Summary of organisation changes and new items to create on confirm.',
    icon: 'file',
  },
];

type OrgDraft = {
  legalName: string;
  tradeName: string;
  gstin: string;
  gstRegistered: boolean;
  stateCode: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  fiscalYearStartMonth: number;
};

type PendingGstProfile = {
  tempId: string;
  label: string;
  gstin: string;
  legalName: string;
  tradeName: string;
  cin: string | null;
  pan: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  stateCode: string | null;
  stateName: string | null;
  isDefault: boolean;
  logoFile: File | null;
};

type PendingOrgAddress = {
  tempId: string;
  label: string;
  addressType: 'registered' | 'operating' | 'billing' | 'shipping' | 'factory' | 'other';
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  stateCode: string | null;
  stateName: string | null;
  isDefault: boolean;
};

type PendingOfficer = {
  tempId: string;
  role: 'ceo' | 'director' | 'other';
  fullName: string;
  designation: string;
  email: string | null;
  phone: string | null;
  din: string | null;
};

function FormHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-medium" style={{ color: ACCENT[FORM_SECTION_TONE] }}>
      {children}
    </h3>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <Meta tone="purple">{children}</Meta>;
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
  const [createGst] = useCreateFinanceOrgGstProfileMutation();
  const [updateGst, { isLoading: updatingGst }] = useUpdateFinanceOrgGstProfileMutation();
  const [createLogo] = useCreateFinanceOrgGstProfileLogoMutation();
  const [createAddress] = useCreateFinanceOrgAddressMutation();
  const [updateAddress, { isLoading: updatingAddress }] = useUpdateFinanceOrgAddressMutation();
  const [createOfficer] = useCreateFinanceOrgOfficerMutation();

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orgDraft, setOrgDraft] = useState<OrgDraft | null>(null);
  const [pendingGst, setPendingGst] = useState<PendingGstProfile[]>([]);
  const [pendingAddresses, setPendingAddresses] = useState<PendingOrgAddress[]>([]);
  const [pendingOfficers, setPendingOfficers] = useState<PendingOfficer[]>([]);
  const [defaultGstConfirmId, setDefaultGstConfirmId] = useState<string | null>(null);
  const [defaultAddressConfirmId, setDefaultAddressConfirmId] = useState<string | null>(null);

  const org = data?.data;
  const profiles = gstData?.data ?? [];
  const addresses = addressData?.data ?? [];
  const officers = officerData?.data ?? [];
  const lastStep = STEPS.length - 1;
  const current = STEPS[step]!;

  useEffect(() => {
    if (!org) return;
    setOrgDraft({
      legalName: org.legalName,
      tradeName: org.tradeName,
      gstin: org.gstin ?? '',
      gstRegistered: org.gstRegistered,
      stateCode: org.stateCode ?? '',
      addressLine1: org.addressLine1,
      city: org.city,
      postalCode: org.postalCode,
      fiscalYearStartMonth: org.fiscalYearStartMonth,
    });
  }, [org]);

  function validateOrgDraft(): boolean {
    if (!orgDraft?.legalName.trim()) {
      setError('Legal name is required.');
      return false;
    }
    if (!orgDraft.stateCode) {
      setError('State is required.');
      return false;
    }
    if (!orgDraft.addressLine1.trim()) {
      setError('Address is required.');
      return false;
    }
    setError(null);
    return true;
  }

  function goNext() {
    if (step === 0 && !validateOrgDraft()) return;
    setError(null);
    setStep((prev) => Math.min(prev + 1, lastStep));
  }

  function goBack() {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 0));
  }

  function onAddGstToList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const { stateCode, stateName } = stateFromCode(String(form.get('stateCode') ?? ''));
    const gstin = String(form.get('gstin') ?? '').trim();
    if (!gstin) {
      setError('GSTIN is required.');
      return;
    }
    setPendingGst((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        label: String(form.get('label') ?? '').trim(),
        gstin,
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
        logoFile: (() => {
          const logo = form.get('logo');
          return logo instanceof File && logo.size > 0 ? logo : null;
        })(),
      },
    ]);
    event.currentTarget.reset();
  }

  function onAddAddressToList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const line1 = String(form.get('line1') ?? '').trim();
    if (!line1) {
      setError('Address line 1 is required.');
      return;
    }
    const { stateCode, stateName } = stateFromCode(String(form.get('stateCode') ?? ''));
    setPendingAddresses((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        label: String(form.get('label') ?? '').trim() || 'Address',
        addressType: String(form.get('addressType') ?? 'other') as PendingOrgAddress['addressType'],
        line1,
        line2: String(form.get('line2') ?? '').trim(),
        city: String(form.get('city') ?? '').trim(),
        postalCode: String(form.get('postalCode') ?? '').trim(),
        stateCode,
        stateName,
        isDefault: form.get('isDefault') === 'on',
      },
    ]);
    event.currentTarget.reset();
  }

  function onAddOfficerToList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get('fullName') ?? '').trim();
    if (!fullName) {
      setError('Officer full name is required.');
      return;
    }
    setPendingOfficers((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        role: String(form.get('role') ?? 'other') as PendingOfficer['role'],
        fullName,
        designation: String(form.get('designation') ?? '').trim(),
        email: optionalFormString(form.get('email')),
        phone: optionalFormString(form.get('phone')),
        din: optionalFormString(form.get('din')),
      },
    ]);
    event.currentTarget.reset();
  }

  async function executeBatchSubmit() {
    if (!orgDraft) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const { stateCode, stateName } = stateFromCode(orgDraft.stateCode);
      await updateOrg({
        legalName: orgDraft.legalName.trim(),
        tradeName: orgDraft.tradeName.trim(),
        gstin: optionalFormString(orgDraft.gstin),
        gstRegistered: orgDraft.gstRegistered,
        stateCode,
        stateName,
        addressLine1: orgDraft.addressLine1.trim(),
        city: orgDraft.city.trim(),
        postalCode: orgDraft.postalCode.trim(),
        fiscalYearStartMonth: orgDraft.fiscalYearStartMonth,
      }).unwrap();

      for (const item of pendingGst) {
        const created = await createGst({
          label: item.label,
          gstin: item.gstin,
          legalName: item.legalName,
          tradeName: item.tradeName,
          cin: item.cin,
          pan: item.pan,
          addressLine1: item.addressLine1,
          addressLine2: item.addressLine2,
          city: item.city,
          postalCode: item.postalCode,
          stateCode: item.stateCode,
          stateName: item.stateName,
          isDefault: item.isDefault,
        }).unwrap();
        if (item.logoFile) {
          await uploadFinanceOrgLogo(createLogo, created.data.id, item.logoFile);
        }
      }

      for (const item of pendingAddresses) {
        await createAddress({
          label: item.label,
          addressType: item.addressType,
          line1: item.line1,
          line2: item.line2,
          city: item.city,
          postalCode: item.postalCode,
          stateCode: item.stateCode,
          stateName: item.stateName,
          isDefault: item.isDefault,
        }).unwrap();
      }

      for (const item of pendingOfficers) {
        await createOfficer({
          role: item.role,
          fullName: item.fullName,
          designation: item.designation,
          email: item.email,
          phone: item.phone,
          din: item.din,
        }).unwrap();
      }

      setPendingGst([]);
      setPendingAddresses([]);
      setPendingOfficers([]);
      setConfirmOpen(false);
      setSuccess('Organisation settings saved successfully.');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to save organisation settings.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDefaultGst(id: string) {
    try {
      await updateGst({ id, body: { isDefault: true } }).unwrap();
      setDefaultGstConfirmId(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to set default GST.'));
    }
  }

  async function confirmDefaultAddress(id: string) {
    try {
      await updateAddress({ id, body: { isDefault: true } }).unwrap();
      setDefaultAddressConfirmId(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update address.'));
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

  const busy = saving || updatingGst || updatingAddress || submitting;
  const orgStateName = orgDraft ? stateFromCode(orgDraft.stateCode).stateName : null;

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
      {success ? (
        <div className="mb-4">
          <StatusMessage tone="success">{success}</StatusMessage>
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
                        ? { borderColor: ACCENT[FORM_SECTION_TONE], backgroundColor: ACCENT[FORM_SECTION_TONE], color: '#0a0a0a' }
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
              {isLoading || !org || !orgDraft ? (
                <p className="text-sm text-muted">Loading…</p>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-lg border border-border p-5 space-y-4">
                    <SubHeading>Identity</SubHeading>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="legalName">Legal name</Label>
                        <Input
                          id="legalName"
                          value={orgDraft.legalName}
                          onChange={(event) =>
                            setOrgDraft((prev) => (prev ? { ...prev, legalName: event.target.value } : prev))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="tradeName">Trade name</Label>
                        <Input
                          id="tradeName"
                          value={orgDraft.tradeName}
                          onChange={(event) =>
                            setOrgDraft((prev) => (prev ? { ...prev, tradeName: event.target.value } : prev))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="gstin">Default GSTIN</Label>
                      <Input
                        id="gstin"
                        value={orgDraft.gstin}
                        onChange={(event) =>
                          setOrgDraft((prev) => (prev ? { ...prev, gstin: event.target.value } : prev))
                        }
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={orgDraft.gstRegistered}
                        onChange={(event) =>
                          setOrgDraft((prev) =>
                            prev ? { ...prev, gstRegistered: event.target.checked } : prev,
                          )
                        }
                        className="h-4 w-4 rounded border-border"
                      />
                      GST registered
                    </label>
                  </div>

                  <div className="rounded-lg border border-border p-5 space-y-4">
                    <SubHeading>Location & fiscal year</SubHeading>
                    <div>
                      <Label htmlFor="stateCode">State</Label>
                      <select
                        id="stateCode"
                        className={SELECT_CLASS}
                        value={orgDraft.stateCode}
                        onChange={(event) =>
                          setOrgDraft((prev) => (prev ? { ...prev, stateCode: event.target.value } : prev))
                        }
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
                      <Label htmlFor="addressLine1">Address</Label>
                      <Input
                        id="addressLine1"
                        value={orgDraft.addressLine1}
                        onChange={(event) =>
                          setOrgDraft((prev) => (prev ? { ...prev, addressLine1: event.target.value } : prev))
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={orgDraft.city}
                          onChange={(event) =>
                            setOrgDraft((prev) => (prev ? { ...prev, city: event.target.value } : prev))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode">Postal code</Label>
                        <Input
                          id="postalCode"
                          value={orgDraft.postalCode}
                          onChange={(event) =>
                            setOrgDraft((prev) => (prev ? { ...prev, postalCode: event.target.value } : prev))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="fiscalYearStartMonth">Fiscal year start month</Label>
                      <select
                        id="fiscalYearStartMonth"
                        className={SELECT_CLASS}
                        value={orgDraft.fiscalYearStartMonth}
                        onChange={(event) =>
                          setOrgDraft((prev) =>
                            prev ? { ...prev, fiscalYearStartMonth: Number(event.target.value) } : prev,
                          )
                        }
                      >
                        {FISCAL_YEAR_MONTHS.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="mt-6 space-y-6">
              {gstLoading ? <p className="text-sm text-muted">Loading GST profiles…</p> : null}

              {pendingGst.length ? (
                <div className="space-y-3">
                  <SubHeading>Pending letterheads (submit on confirm)</SubHeading>
                  <ul className="space-y-2 text-sm">
                    {pendingGst.map((profile) => (
                      <li
                        key={profile.tempId}
                        className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-3"
                      >
                        <div>
                          <div className="font-medium text-foreground">
                            {profile.label || profile.gstin}
                            {profile.isDefault ? ' · Default (on submit)' : ''}
                          </div>
                          <div className="mt-1 text-muted">
                            GST {profile.gstin}
                            {profile.logoFile ? ` · Logo: ${profile.logoFile.name}` : ''}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setPendingGst((prev) => prev.filter((item) => item.tempId !== profile.tempId))
                          }
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
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
                                onClick={() => setDefaultGstConfirmId(profile.id)}
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

              <form onSubmit={onAddGstToList} className="space-y-4 rounded-lg border border-border p-5">
                <SubHeading>Add GST profile to list</SubHeading>

                <div className="space-y-4 rounded-md bg-foreground/[0.03] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: ACCENT.orange }}>
                    1 · Identity
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="gstLabel">Label</Label>
                      <Input id="gstLabel" name="label" placeholder="GST 1 / Peenya" />
                    </div>
                    <div>
                      <Label htmlFor="gstGstin">GSTIN</Label>
                      <Input id="gstGstin" name="gstin" required />
                    </div>
                    <div>
                      <Label htmlFor="gstLegal">Legal name</Label>
                      <Input id="gstLegal" name="legalName" />
                    </div>
                    <div>
                      <Label htmlFor="gstTrade">Trade name</Label>
                      <Input id="gstTrade" name="tradeName" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-md bg-foreground/[0.03] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: ACCENT.orange }}>
                    2 · CIN & PAN
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="gstCin">CIN</Label>
                      <Input id="gstCin" name="cin" />
                    </div>
                    <div>
                      <Label htmlFor="gstPan">PAN</Label>
                      <Input id="gstPan" name="pan" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-md bg-foreground/[0.03] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: ACCENT.orange }}>
                    3 · Address & logo
                  </p>
                  <div>
                    <Label htmlFor="gstAddr1">Address line 1</Label>
                    <Input id="gstAddr1" name="addressLine1" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="gstAddr2">Address line 2</Label>
                      <Input id="gstAddr2" name="addressLine2" />
                    </div>
                    <div>
                      <Label htmlFor="gstCity">City</Label>
                      <Input id="gstCity" name="city" />
                    </div>
                    <div>
                      <Label htmlFor="gstState">State</Label>
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
                      <Label htmlFor="gstPostal">Postal code</Label>
                      <Input id="gstPostal" name="postalCode" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="gstLogo">Logo</Label>
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
                <Button type="submit">Add to list</Button>
              </form>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-6 space-y-6">
              {pendingAddresses.length ? (
                <div className="space-y-3">
                  <SubHeading>Pending addresses (submit on confirm)</SubHeading>
                  <ul className="space-y-2 text-sm">
                    {pendingAddresses.map((address) => (
                      <li
                        key={address.tempId}
                        className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-3"
                      >
                        <div>
                          <span className="font-medium text-foreground">{address.label}</span>
                          <span className="text-muted"> · {address.addressType}</span>
                          <div className="mt-1 text-muted">
                            {[address.line1, address.city, address.stateName, address.postalCode]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setPendingAddresses((prev) =>
                              prev.filter((item) => item.tempId !== address.tempId),
                            )
                          }
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
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
                            onClick={() => setDefaultAddressConfirmId(address.id)}
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

              <form onSubmit={onAddAddressToList} className="space-y-4 rounded-lg border border-border p-5">
                <SubHeading>Add address to list</SubHeading>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="addrLabel">Label</Label>
                    <Input id="addrLabel" name="label" placeholder="Registered office" />
                  </div>
                  <div>
                    <Label htmlFor="addrType">Type</Label>
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
                    <Label htmlFor="addrLine1">Line 1</Label>
                    <Input id="addrLine1" name="line1" required />
                  </div>
                  <div>
                    <Label htmlFor="addrLine2">Line 2</Label>
                    <Input id="addrLine2" name="line2" />
                  </div>
                  <div>
                    <Label htmlFor="addrCity">City</Label>
                    <Input id="addrCity" name="city" />
                  </div>
                  <div>
                    <Label htmlFor="addrState">State</Label>
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
                    <Label htmlFor="addrPostal">Postal code</Label>
                    <Input id="addrPostal" name="postalCode" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" name="isDefault" className="h-4 w-4 rounded border-border" />
                  Default address
                </label>
                <Button type="submit">Add to list</Button>
              </form>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-6 space-y-6">
              {pendingOfficers.length ? (
                <div className="space-y-3">
                  <SubHeading>Pending officers (submit on confirm)</SubHeading>
                  <ul className="space-y-2 text-sm">
                    {pendingOfficers.map((officer) => (
                      <li
                        key={officer.tempId}
                        className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-3"
                      >
                        <div>
                          <span className="font-medium text-foreground">{officer.fullName}</span>
                          <span className="text-muted">
                            {' '}
                            · {officer.role.toUpperCase()}
                            {officer.designation ? ` · ${officer.designation}` : ''}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setPendingOfficers((prev) =>
                              prev.filter((item) => item.tempId !== officer.tempId),
                            )
                          }
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
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

              <form onSubmit={onAddOfficerToList} className="space-y-4 rounded-lg border border-border p-5">
                <SubHeading>Add officer to list</SubHeading>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="officerRole">Role</Label>
                    <select id="officerRole" name="role" className={SELECT_CLASS} defaultValue="director">
                      <option value="ceo">CEO</option>
                      <option value="director">Director</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="officerName">Full name</Label>
                    <Input id="officerName" name="fullName" required />
                  </div>
                  <div>
                    <Label htmlFor="officerDesignation">Designation</Label>
                    <Input id="officerDesignation" name="designation" />
                  </div>
                  <div>
                    <Label htmlFor="officerDin">DIN</Label>
                    <Input id="officerDin" name="din" />
                  </div>
                  <div>
                    <Label htmlFor="officerEmail">Email</Label>
                    <Input id="officerEmail" name="email" type="email" />
                  </div>
                  <div>
                    <Label htmlFor="officerPhone">Phone</Label>
                    <Input id="officerPhone" name="phone" />
                  </div>
                </div>
                <Button type="submit">Add to list</Button>
              </form>
            </div>
          ) : null}

          {step === 4 && orgDraft ? (
            <div className="mt-6 space-y-5 text-sm">
              <div className="rounded-lg border border-border p-4">
                <SubHeading>Organisation profile</SubHeading>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted">Legal / trade name</dt>
                    <dd>
                      {[orgDraft.legalName, orgDraft.tradeName].filter(Boolean).join(' · ') || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Default GSTIN</dt>
                    <dd>{orgDraft.gstin || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">GST registered</dt>
                    <dd>{orgDraft.gstRegistered ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Location</dt>
                    <dd>
                      {[orgDraft.addressLine1, orgDraft.city, orgStateName, orgDraft.postalCode]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-border p-4">
                <SubHeading>GST letterheads</SubHeading>
                <p className="mt-2 text-muted">
                  {profiles.length} saved · {pendingGst.length} pending
                </p>
                {pendingGst.length ? (
                  <ul className="mt-2 list-inside list-disc text-muted">
                    {pendingGst.map((item) => (
                      <li key={item.tempId}>
                        {item.label || item.gstin} — {item.gstin}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="rounded-lg border border-border p-4">
                <SubHeading>Addresses</SubHeading>
                <p className="mt-2 text-muted">
                  {addresses.length} saved · {pendingAddresses.length} pending
                </p>
                {pendingAddresses.length ? (
                  <ul className="mt-2 list-inside list-disc text-muted">
                    {pendingAddresses.map((item) => (
                      <li key={item.tempId}>
                        {item.label} · {item.addressType}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="rounded-lg border border-border p-4">
                <SubHeading>Directors & CEO</SubHeading>
                <p className="mt-2 text-muted">
                  {officers.length} saved · {pendingOfficers.length} pending
                </p>
                {pendingOfficers.length ? (
                  <ul className="mt-2 list-inside list-disc text-muted">
                    {pendingOfficers.map((item) => (
                      <li key={item.tempId}>
                        {item.fullName} · {item.role}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" disabled={step === 0} onClick={goBack}>
              Back
            </Button>
            {step < lastStep ? (
              <Button type="button" onClick={goNext}>
                Next stage
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  if (!validateOrgDraft()) {
                    setStep(0);
                    return;
                  }
                  setConfirmOpen(true);
                }}
              >
                Confirm & submit
              </Button>
            )}
          </div>
        </div>
      </div>

      <ActionConfirmDialog
        open={confirmOpen}
        title="Save organisation settings?"
        description={`This will update the organisation profile${
          pendingGst.length ? `, create ${pendingGst.length} GST profile(s)` : ''
        }${pendingAddresses.length ? `, create ${pendingAddresses.length} address(es)` : ''}${
          pendingOfficers.length ? `, create ${pendingOfficers.length} officer(s)` : ''
        }. Review the preview before confirming.`}
        confirmLabel="Save settings"
        pending={submitting || saving}
        onConfirm={() => void executeBatchSubmit()}
        onCancel={() => {
          if (!submitting) setConfirmOpen(false);
        }}
      />

      <ActionConfirmDialog
        open={Boolean(defaultGstConfirmId)}
        title="Set default letterhead?"
        description="This will immediately set this GST profile as the default letterhead for new documents."
        confirmLabel="Make default"
        pending={updatingGst}
        onConfirm={() => {
          if (defaultGstConfirmId) void confirmDefaultGst(defaultGstConfirmId);
        }}
        onCancel={() => {
          if (!updatingGst) setDefaultGstConfirmId(null);
        }}
      />

      <ActionConfirmDialog
        open={Boolean(defaultAddressConfirmId)}
        title="Mark default address?"
        description="This will immediately set this address as the company default."
        confirmLabel="Mark default"
        pending={updatingAddress}
        onConfirm={() => {
          if (defaultAddressConfirmId) void confirmDefaultAddress(defaultAddressConfirmId);
        }}
        onCancel={() => {
          if (!updatingAddress) setDefaultAddressConfirmId(null);
        }}
      />
    </>
  );
}
