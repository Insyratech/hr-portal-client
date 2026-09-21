'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { ActionConfirmDialog } from '@/components/dashboard/action-confirm-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import {
  FISCAL_YEAR_MONTHS,
  INDIAN_STATES,
  SELECT_CLASS,
  stateFromCode,
} from '@/features/finance/finance-constants';
import { FinanceGstRegistrationForm } from '@/features/finance/finance-gst-registration-form';
import { apiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { ACCENT, FORM_SECTION_TONE } from '@/lib/ui-accents';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateFinanceOrgAddressMutation,
  useGetFinanceOrgAddressesQuery,
  useGetFinanceOrgGstProfilesQuery,
  useGetFinanceOrganizationQuery,
  useUpdateFinanceOrgAddressMutation,
  useUpdateFinanceOrgGstProfileMutation,
  useUpdateFinanceOrganizationMutation,
} from '@/store/api/api';
import type { FinanceOrgGstProfile } from '@/types/api';

const MAX_ACTIVE_GST = 4;

const STEPS: {
  id: string;
  title: string;
  subtitle: string;
  heading: string;
  description: string;
  icon: IconName;
}[] = [
  {
    id: 'fiscal',
    title: 'Fiscal year',
    subtitle: 'Company calendar',
    heading: 'Fiscal year',
    description:
      'Company fiscal calendar for reports. Legal identity, addresses, and officers live on each GST registration.',
    icon: 'building',
  },
  {
    id: 'addresses',
    title: 'Addresses',
    subtitle: 'Billing & shipping book',
    heading: 'Shared address book',
    description:
      'Reusable billing and shipping addresses for vendor registration dropdowns (not letterheads).',
    icon: 'grid',
  },
  {
    id: 'preview',
    title: 'Preview',
    subtitle: 'Review & submit',
    heading: 'Review and submit',
    description: 'Confirm fiscal year and any new shared addresses before saving.',
    icon: 'file',
  },
];

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

  const [updateOrg, { isLoading: saving }] = useUpdateFinanceOrganizationMutation();
  const [updateGst, { isLoading: updatingGst }] = useUpdateFinanceOrgGstProfileMutation();
  const [createAddress] = useCreateFinanceOrgAddressMutation();
  const [updateAddress, { isLoading: updatingAddress }] = useUpdateFinanceOrgAddressMutation();

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState(4);
  const [pendingAddresses, setPendingAddresses] = useState<PendingOrgAddress[]>([]);
  const [defaultGstConfirmId, setDefaultGstConfirmId] = useState<string | null>(null);
  const [defaultAddressConfirmId, setDefaultAddressConfirmId] = useState<string | null>(null);
  const [gstRegisterOpen, setGstRegisterOpen] = useState(false);
  const [editingGst, setEditingGst] = useState<FinanceOrgGstProfile | null>(null);

  const org = data?.data;
  const profiles = gstData?.data ?? [];
  const activeProfiles = profiles.filter((profile) => profile.active);
  const canRegisterGst = activeProfiles.length < MAX_ACTIVE_GST;
  const addresses = addressData?.data ?? [];
  const lastStep = STEPS.length - 1;
  const current = STEPS[step]!;

  useEffect(() => {
    if (!org) return;
    setFiscalYearStartMonth(org.fiscalYearStartMonth);
  }, [org]);

  function goNext() {
    setError(null);
    setStep((prev) => Math.min(prev + 1, lastStep));
  }

  function goBack() {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 0));
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

  async function executeBatchSubmit() {
    if (!org) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await updateOrg({
        legalName: org.legalName,
        tradeName: org.tradeName,
        gstin: org.gstin,
        gstRegistered: org.gstRegistered,
        stateCode: org.stateCode,
        stateName: org.stateName,
        addressLine1: org.addressLine1,
        city: org.city,
        postalCode: org.postalCode,
        fiscalYearStartMonth,
      }).unwrap();

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

      setPendingAddresses([]);
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
  const fiscalLabel =
    FISCAL_YEAR_MONTHS.find((month) => month.value === fiscalYearStartMonth)?.label ?? String(fiscalYearStartMonth);

  return (
    <>
      <DelayedLoadingOverlay active={busy} />
      <PageHeader kicker="Finance" title="Organisation settings" />
      <p className="mb-6 max-w-3xl text-sm text-muted">
        Register each GSTIN as a complete letterhead (identity, address, contact, directors &amp; CEO).
        Shared fiscal year and address book below support reports and vendor forms.
      </p>

      <section className="mb-10 max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <FormHeading>GST registrations</FormHeading>
            <p className="mt-1 text-sm text-muted">
              Each GSTIN is its own letterhead (max {MAX_ACTIVE_GST}). Default GST syncs fiscal org
              identity used by legacy documents.
            </p>
          </div>
          <Button
            type="button"
            disabled={!canRegisterGst}
            onClick={() => {
              setEditingGst(null);
              setGstRegisterOpen(true);
            }}
          >
            Register GST
          </Button>
        </div>
        {!canRegisterGst ? (
          <p className="mt-2 text-xs text-muted">
            Maximum of {MAX_ACTIVE_GST} active GST registrations reached.
          </p>
        ) : null}
        {gstLoading ? (
          <p className="mt-4 text-sm text-muted">Loading GST registrations…</p>
        ) : activeProfiles.length ? (
          <ul className="mt-4 space-y-3">
            {activeProfiles.map((profile) => (
              <li key={profile.id} className="rounded-lg border border-border p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-foreground">
                      {profile.gstin}
                      {profile.isDefault ? (
                        <span className="ml-2 rounded bg-foreground/10 px-2 py-0.5 text-xs font-normal text-muted">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-muted">
                      {profile.legalName || profile.tradeName || '—'}
                      {profile.stateName ? ` · ${profile.stateName}` : ''}
                    </div>
                    {(profile.city || profile.addressLine1) && (
                      <div className="mt-1 text-xs text-muted">
                        {[profile.addressLine1, profile.city, profile.postalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    )}
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setGstRegisterOpen(false);
                        setEditingGst(profile);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
                {profile.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.logoUrl} alt="" className="mt-3 h-10 object-contain" />
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">
            No GST registrations yet. Register your first GSTIN above — that is the primary company
            letterhead setup.
          </p>
        )}
      </section>

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
                    onClick={() => {
                      setError(null);
                      setStep(index);
                    }}
                    className="min-w-0 flex-1 pt-0.5 text-left"
                  >
                    <div
                      className={cn(
                        'text-sm font-medium leading-tight',
                        active ? 'text-foreground' : 'text-muted',
                      )}
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
              {isLoading || !org ? (
                <p className="text-sm text-muted">Loading…</p>
              ) : (
                <div className="rounded-lg border border-border p-5 space-y-4">
                  <SubHeading>Fiscal calendar</SubHeading>
                  {activeProfiles[0] ? (
                    <p className="text-sm text-muted">
                      Letterhead identity comes from GST registrations. Default:{' '}
                      <span className="text-foreground">
                        {activeProfiles.find((p) => p.isDefault)?.gstin ?? activeProfiles[0].gstin}
                      </span>
                    </p>
                  ) : null}
                  <div>
                    <Label htmlFor="fiscalYearStartMonth">Fiscal year start month</Label>
                    <select
                      id="fiscalYearStartMonth"
                      className={SELECT_CLASS}
                      value={fiscalYearStartMonth}
                      onChange={(event) => setFiscalYearStartMonth(Number(event.target.value))}
                    >
                      {FISCAL_YEAR_MONTHS.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {step === 1 ? (
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
                    <Input id="addrLine1" name="line1" />
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

          {step === 2 ? (
            <div className="mt-6 space-y-5 text-sm">
              <div className="rounded-lg border border-border p-4">
                <SubHeading>Fiscal year</SubHeading>
                <p className="mt-2 text-foreground">Starts in {fiscalLabel}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <SubHeading>GST letterheads</SubHeading>
                <p className="mt-2 text-muted">
                  {activeProfiles.length} active registration
                  {activeProfiles.length === 1 ? '' : 's'}
                </p>
                {activeProfiles.length ? (
                  <ul className="mt-2 list-inside list-disc text-muted">
                    {activeProfiles.map((profile) => (
                      <li key={profile.id}>
                        {profile.gstin}
                        {profile.isDefault ? ' (default)' : ''}
                        {profile.legalName ? ` — ${profile.legalName}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="rounded-lg border border-border p-4">
                <SubHeading>Shared addresses</SubHeading>
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
              <Button type="button" onClick={() => setConfirmOpen(true)}>
                Confirm & submit
              </Button>
            )}
          </div>
        </div>
      </div>

      <ActionConfirmDialog
        open={confirmOpen}
        title="Save organisation settings?"
        description={`This will update the fiscal year${
          pendingAddresses.length ? ` and create ${pendingAddresses.length} address(es)` : ''
        }. GST letterheads are managed separately via Register GST.`}
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

      <Dialog open={gstRegisterOpen} onOpenChange={setGstRegisterOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto sm:max-w-5xl">
          <DialogTitle>Register GST</DialogTitle>
          <DialogDescription>
            GSTIN is the key. Complete identity, address, contact, directors &amp; CEO, then confirm.
          </DialogDescription>
          <FinanceGstRegistrationForm
            onCancel={() => setGstRegisterOpen(false)}
            onSaved={() => setGstRegisterOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingGst)}
        onOpenChange={(open) => {
          if (!open) setEditingGst(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto sm:max-w-5xl">
          <DialogTitle>Edit GST registration</DialogTitle>
          <DialogDescription>
            Update letterhead details, contact, logo, and officers for this GSTIN.
          </DialogDescription>
          {editingGst ? (
            <FinanceGstRegistrationForm
              key={editingGst.id}
              profile={editingGst}
              onCancel={() => setEditingGst(null)}
              onSaved={(saved) => setEditingGst(saved)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
