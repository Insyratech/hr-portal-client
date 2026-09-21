'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import {
  INDIAN_STATES,
  SELECT_CLASS,
  stateFromCode,
} from '@/features/finance/finance-constants';
import { FinanceGstRegistrationForm } from '@/features/finance/finance-gst-registration-form';
import { apiErrorMessage } from '@/lib/api-error';
import { ACCENT, FORM_SECTION_TONE } from '@/lib/ui-accents';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateFinanceOrgAddressMutation,
  useGetFinanceOrgAddressesQuery,
  useGetFinanceOrgGstProfilesQuery,
  useUpdateFinanceOrgAddressMutation,
  useUpdateFinanceOrgGstProfileMutation,
} from '@/store/api/api';
import type { FinanceOrgGstProfile } from '@/types/api';

const MAX_ACTIVE_GST = 4;

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
  const { data: gstData, isLoading: gstLoading } = useGetFinanceOrgGstProfilesQuery(undefined, {
    skip: !canManage,
  });
  const { data: addressData } = useGetFinanceOrgAddressesQuery(undefined, { skip: !canManage });

  const [updateGst, { isLoading: updatingGst }] = useUpdateFinanceOrgGstProfileMutation();
  const [createAddress] = useCreateFinanceOrgAddressMutation();
  const [updateAddress, { isLoading: updatingAddress }] = useUpdateFinanceOrgAddressMutation();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAddresses, setPendingAddresses] = useState<PendingOrgAddress[]>([]);
  const [defaultGstConfirmId, setDefaultGstConfirmId] = useState<string | null>(null);
  const [defaultAddressConfirmId, setDefaultAddressConfirmId] = useState<string | null>(null);
  const [gstRegisterOpen, setGstRegisterOpen] = useState(false);
  const [editingGst, setEditingGst] = useState<FinanceOrgGstProfile | null>(null);

  const profiles = gstData?.data ?? [];
  const activeProfiles = profiles.filter((profile) => profile.active);
  const canRegisterGst = activeProfiles.length < MAX_ACTIVE_GST;
  const addresses = addressData?.data ?? [];

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

  async function executeAddressSubmit() {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
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
      setSuccess('Shared addresses saved successfully.');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to save addresses.'));
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

  const busy = updatingGst || updatingAddress || submitting;

  return (
    <>
      <DelayedLoadingOverlay active={busy} />
      <PageHeader kicker="Finance" title="Organisation settings" />
      <p className="mb-6 max-w-3xl text-sm text-muted">
        Register each GSTIN as a complete letterhead (identity, address, fiscal year, contact,
        directors &amp; CEO). Shared address book below is for vendor registration dropdowns.
      </p>

      <section className="mb-10 max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <FormHeading>GST registrations</FormHeading>
            <p className="mt-1 text-sm text-muted">
              Each GSTIN is its own letterhead (max {MAX_ACTIVE_GST}). Fiscal year and officers are
              managed inside Register / Edit GST.
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
            letterhead setup (including fiscal year).
          </p>
        )}
      </section>

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

      <section className="max-w-3xl space-y-6">
        <div>
          <FormHeading>Shared address book</FormHeading>
          <p className="mt-1 text-sm text-muted">
            Billing and shipping addresses for vendor registration dropdowns (not letterheads).
          </p>
        </div>

        {pendingAddresses.length ? (
          <div className="space-y-3">
            <SubHeading>Pending addresses (save below)</SubHeading>
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
              <select id="addrType" name="addressType" className={SELECT_CLASS} defaultValue="registered">
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

        {pendingAddresses.length ? (
          <div className="flex justify-end border-t border-border pt-4">
            <Button type="button" onClick={() => setConfirmOpen(true)}>
              Save {pendingAddresses.length} address{pendingAddresses.length === 1 ? '' : 'es'}
            </Button>
          </div>
        ) : null}
      </section>

      <ActionConfirmDialog
        open={confirmOpen}
        title="Save shared addresses?"
        description={`This will create ${pendingAddresses.length} address(es) in the shared address book.`}
        confirmLabel="Save addresses"
        pending={submitting}
        onConfirm={() => void executeAddressSubmit()}
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
            GSTIN is the key. Complete identity, address, fiscal year, contact, directors &amp; CEO,
            then confirm.
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
            Update letterhead details, fiscal year, contact, logo, and officers for this GSTIN.
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
