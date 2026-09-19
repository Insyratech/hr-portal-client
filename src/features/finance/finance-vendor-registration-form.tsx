'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import {
  INDIAN_STATES,
  SELECT_CLASS,
  optionalFormString,
  stateFromCode,
} from '@/features/finance/finance-constants';
import { printVendorRegistration } from '@/features/finance/finance-vendor-print';
import { uploadFinanceVendorDocument } from '@/features/finance/finance-vendor-uploads';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useCreateFinanceOrgAddressMutation,
  useCreateFinanceVendorDocumentUploadMutation,
  useCreateFinanceVendorRegistrationMutation,
  useGetFinanceOrgAddressesQuery,
  useGetFinanceOrgGstProfilesQuery,
  useGetFinanceVendorRegistrationQuery,
  useLazyGetFinanceVendorPrintQuery,
  useUpdateFinanceVendorRegistrationMutation,
} from '@/store/api/api';
import type {
  FinanceOrgAddress,
  FinanceOrgGstProfile,
  FinanceVendorDocumentType,
  FinanceVendorRegistration,
} from '@/types/api';

const DOCUMENT_TYPES: { type: FinanceVendorDocumentType; label: string }[] = [
  { type: 'income_tax', label: 'Latest Income Tax details' },
  { type: 'sales_tax_license', label: 'Copy of Sales Tax License' },
  { type: 'msme_ssi_license', label: 'SSI / MSME / Shops & establishment license' },
  { type: 'gst_certificate', label: 'GST Registration Certificate' },
  { type: 'pan_card', label: 'PAN Card copy' },
  { type: 'cancelled_cheque', label: 'Cancelled cheque' },
  { type: 'iso_certificate', label: 'ISO Certificate' },
];

function formatOrgAddress(address: FinanceOrgAddress): string {
  return [address.line1, address.line2, address.city, address.stateName, address.postalCode]
    .filter(Boolean)
    .join(', ');
}

function formatLetterheadAddress(profile: FinanceOrgGstProfile): string {
  return [profile.addressLine1, profile.addressLine2, profile.city, profile.postalCode]
    .filter(Boolean)
    .join(', ');
}

type PrincipalRow = { customerNameAddress: string; productSupplied: string };

function emptyPrincipals(): PrincipalRow[] {
  return [
    { customerNameAddress: '', productSupplied: '' },
    { customerNameAddress: '', productSupplied: '' },
  ];
}

export function FinanceVendorRegistrationForm({
  vendorId,
  onCancel,
}: {
  vendorId?: string | null;
  onCancel: () => void;
}) {
  const isEdit = Boolean(vendorId);
  const { data: profilesData } = useGetFinanceOrgGstProfilesQuery();
  const { data: addressesData, refetch: refetchAddresses } = useGetFinanceOrgAddressesQuery();
  const { data: registrationData, isLoading: loadingRegistration } = useGetFinanceVendorRegistrationQuery(
    vendorId!,
    { skip: !vendorId },
  );
  const [createRegistration, { isLoading: creating }] = useCreateFinanceVendorRegistrationMutation();
  const [updateRegistration, { isLoading: updating }] = useUpdateFinanceVendorRegistrationMutation();
  const [createAddress, { isLoading: creatingAddress }] = useCreateFinanceOrgAddressMutation();
  const [createDocUpload] = useCreateFinanceVendorDocumentUploadMutation();
  const [fetchPrint] = useLazyGetFinanceVendorPrintQuery();

  const profiles = useMemo(
    () => (profilesData?.data ?? []).filter((item) => item.active),
    [profilesData],
  );
  const addresses = addressesData?.data ?? [];
  const existing = registrationData?.data;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [gstProfileId, setGstProfileId] = useState('');
  const [billingAddressId, setBillingAddressId] = useState('');
  const [shippingAddressId, setShippingAddressId] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [factoryAddress, setFactoryAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [principals, setPrincipals] = useState<PrincipalRow[]>(emptyPrincipals());
  const [showAddAddress, setShowAddAddress] = useState<'billing' | 'shipping' | null>(null);
  const [pendingDocs, setPendingDocs] = useState<Partial<Record<FinanceVendorDocumentType, File>>>({});
  const [savedId, setSavedId] = useState<string | null>(vendorId ?? null);
  const activeVendorId = vendorId || savedId;

  useEffect(() => {
    if (!existing) return;
    setGstProfileId(existing.orgGstProfileId ?? '');
    setBillingAddressId(existing.billingAddressId ?? '');
    setShippingAddressId(existing.shippingAddressId ?? '');
    setRegisteredAddress(existing.registeredAddress ?? '');
    setFactoryAddress(existing.factoryAddress ?? '');
    setBillingAddress(existing.billingAddress ?? '');
    setShippingAddress(existing.shippingAddress ?? '');
    setPrincipals(
      existing.principalCustomers?.length
        ? existing.principalCustomers.map((item) => ({
            customerNameAddress: item.customerNameAddress,
            productSupplied: item.productSupplied,
          }))
        : emptyPrincipals(),
    );
    setSavedId(existing.id);
  }, [existing]);

  useEffect(() => {
    if (existing || gstProfileId || !profiles.length) return;
    const defaultProfile = profiles.find((item) => item.isDefault) ?? profiles[0];
    if (defaultProfile) setGstProfileId(defaultProfile.id);
  }, [existing, gstProfileId, profiles]);

  const selectedProfile = profiles.find((item) => item.id === gstProfileId) ?? null;

  function applyAddressSelection(kind: 'billing' | 'shipping', addressId: string) {
    const address = addresses.find((item) => item.id === addressId);
    const text = address ? formatOrgAddress(address) : '';
    if (kind === 'billing') {
      setBillingAddressId(addressId);
      if (address) setBillingAddress(text);
    } else {
      setShippingAddressId(addressId);
      if (address) setShippingAddress(text);
    }
  }

  async function onAddAddress() {
    if (!showAddAddress) return;
    setError(null);
    const labelEl = document.getElementById('addrLabel') as HTMLInputElement | null;
    const line1El = document.getElementById('addrLine1') as HTMLInputElement | null;
    const line2El = document.getElementById('addrLine2') as HTMLInputElement | null;
    const cityEl = document.getElementById('addrCity') as HTMLInputElement | null;
    const stateEl = document.getElementById('addrState') as HTMLSelectElement | null;
    const postalEl = document.getElementById('addrPostal') as HTMLInputElement | null;
    const line1 = line1El?.value.trim() ?? '';
    if (!line1) {
      setError('Address line 1 is required.');
      return;
    }
    const { stateCode, stateName } = stateFromCode(stateEl?.value ?? '');
    try {
      const created = await createAddress({
        label: labelEl?.value.trim() || 'Address',
        addressType: showAddAddress,
        line1,
        line2: line2El?.value.trim() ?? '',
        city: cityEl?.value.trim() ?? '',
        postalCode: postalEl?.value.trim() ?? '',
        stateCode,
        stateName,
      }).unwrap();
      await refetchAddresses();
      applyAddressSelection(showAddAddress, created.data.id);
      setShowAddAddress(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to add address.'));
    }
  }

  function collectBody(form: FormData) {
    const { stateCode, stateName } = stateFromCode(String(form.get('stateCode') ?? ''));
    return {
      displayName: String(form.get('displayName') ?? '').trim(),
      companyName: String(form.get('companyName') ?? '').trim(),
      email: optionalFormString(form.get('email')),
      phone: optionalFormString(form.get('phone')),
      telephone: optionalFormString(form.get('telephone')),
      fax: optionalFormString(form.get('fax')),
      gstin: optionalFormString(form.get('gstin')),
      pan: optionalFormString(form.get('pan')),
      stateCode,
      stateName,
      registeredAddress,
      factoryAddress,
      billingAddress,
      shippingAddress,
      paymentTermsDays: Number(form.get('paymentTermsDays') ?? 0) || 0,
      notes: String(form.get('notes') ?? '').trim(),
      establishmentType: String(form.get('establishmentType') ?? '').trim(),
      constitution: String(form.get('constitution') ?? '').trim(),
      yearEstablished: String(form.get('yearEstablished') ?? '').trim(),
      salesTaxRegNo: optionalFormString(form.get('salesTaxRegNo')),
      factoryLicenseNo: optionalFormString(form.get('factoryLicenseNo')),
      businessProfile: String(form.get('businessProfile') ?? '').trim(),
      bankNameAddress: String(form.get('bankNameAddress') ?? '').trim(),
      bankAccountNo: optionalFormString(form.get('bankAccountNo')),
      ifsc: optionalFormString(form.get('ifsc')),
      micr: optionalFormString(form.get('micr')),
      creditLimit: optionalFormString(form.get('creditLimit'))
        ? Number(form.get('creditLimit'))
        : null,
      contactPersonName: String(form.get('contactPersonName') ?? '').trim(),
      contactPersonDesignation: String(form.get('contactPersonDesignation') ?? '').trim(),
      contactPersonMobile: optionalFormString(form.get('contactPersonMobile')),
      declarationName: String(form.get('declarationName') ?? '').trim(),
      declarationDesignation: String(form.get('declarationDesignation') ?? '').trim(),
      declarationPlace: String(form.get('declarationPlace') ?? '').trim(),
      declarationDate: optionalFormString(form.get('declarationDate')),
      orgGstProfileId: gstProfileId || null,
      billingAddressId: billingAddressId || null,
      shippingAddressId: shippingAddressId || null,
      officeInspectedBy: String(form.get('officeInspectedBy') ?? '').trim(),
      officeInspectionDate: optionalFormString(form.get('officeInspectionDate')),
      vendorCode: optionalFormString(form.get('vendorCode')),
      officeApprovedBy: String(form.get('officeApprovedBy') ?? '').trim(),
      officeDecision: optionalFormString(form.get('officeDecision')) as
        | 'approved'
        | 'rejected'
        | 'pending'
        | null,
      status: (optionalFormString(form.get('status')) as 'active' | 'inactive' | null) || 'active',
      principalCustomers: principals.filter(
        (row) => row.customerNameAddress.trim() || row.productSupplied.trim(),
      ),
    };
  }

  async function uploadPending(vendor: FinanceVendorRegistration) {
    const entries = Object.entries(pendingDocs) as [FinanceVendorDocumentType, File][];
    for (const [documentType, file] of entries) {
      if (!file) continue;
      await uploadFinanceVendorDocument(createDocUpload, vendor.id, documentType, file);
    }
    setPendingDocs({});
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const body = collectBody(new FormData(event.currentTarget));
    if (!body.displayName) {
      setError('Vendor name is required.');
      return;
    }
    try {
      const result = activeVendorId
        ? await updateRegistration({ id: activeVendorId, body }).unwrap()
        : await createRegistration(body).unwrap();
      setSavedId(result.data.id);
      await uploadPending(result.data);
      setSuccess('Vendor registration saved. You can download the PDF or close when finished.');
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to save vendor registration.'));
    }
  }

  async function onDownloadPdf() {
    const id = activeVendorId;
    if (!id) {
      setError('Save the vendor registration before downloading PDF.');
      return;
    }
    setError(null);
    try {
      const result = await fetchPrint(id).unwrap();
      printVendorRegistration(result.data);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to prepare PDF.'));
    }
  }

  if (isEdit && loadingRegistration) {
    return <p className="mt-4 text-sm text-muted">Loading registration…</p>;
  }

  const defaults = existing;

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:justify-between">
        <div className="max-w-md">
          <Label htmlFor="orgGstProfileId">Our company GST profile (letterhead)</Label>
          <select
            id="orgGstProfileId"
            className={SELECT_CLASS}
            value={gstProfileId}
            onChange={(event) => setGstProfileId(event.target.value)}
          >
            <option value="">Select GST profile</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.label || profile.gstin} — {profile.gstin}
              </option>
            ))}
          </select>
          {!profiles.length ? (
            <p className="mt-1 text-xs text-muted">Add GST profiles under Finance → Settings first.</p>
          ) : null}
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

      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-[0.18em] text-meta">Vendor details</h3>
        <div>
          <Label htmlFor="displayName">Vendor name</Label>
          <Input id="displayName" name="displayName" defaultValue={defaults?.displayName} required />
        </div>
        <div>
          <Label htmlFor="companyName">Company name</Label>
          <Input id="companyName" name="companyName" defaultValue={defaults?.companyName} />
        </div>
        <div>
          <Label htmlFor="registeredAddress">Address (Reg) Office</Label>
          <Input
            id="registeredAddress"
            value={registeredAddress}
            onChange={(event) => setRegisteredAddress(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="factoryAddress">Address Factory / Operating</Label>
          <Input
            id="factoryAddress"
            value={factoryAddress}
            onChange={(event) => setFactoryAddress(event.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="billingAddressSelect">Billing address (from company addresses)</Label>
            <select
              id="billingAddressSelect"
              className={SELECT_CLASS}
              value={billingAddressId}
              onChange={(event) => {
                if (event.target.value === '__add__') {
                  setShowAddAddress('billing');
                  return;
                }
                applyAddressSelection('billing', event.target.value);
              }}
            >
              <option value="">Select or type below</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label} — {formatOrgAddress(address)}
                </option>
              ))}
              <option value="__add__">+ Add new address…</option>
            </select>
            <Input
              className="mt-2"
              value={billingAddress}
              onChange={(event) => setBillingAddress(event.target.value)}
              placeholder="Billing address text"
            />
          </div>
          <div>
            <Label htmlFor="shippingAddressSelect">Shipping address</Label>
            <select
              id="shippingAddressSelect"
              className={SELECT_CLASS}
              value={shippingAddressId}
              onChange={(event) => {
                if (event.target.value === '__add__') {
                  setShowAddAddress('shipping');
                  return;
                }
                applyAddressSelection('shipping', event.target.value);
              }}
            >
              <option value="">Select or type below</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label} — {formatOrgAddress(address)}
                </option>
              ))}
              <option value="__add__">+ Add new address…</option>
            </select>
            <Input
              className="mt-2"
              value={shippingAddress}
              onChange={(event) => setShippingAddress(event.target.value)}
              placeholder="Shipping address text"
            />
          </div>
        </div>

        {showAddAddress ? (
          <div className="rounded border border-border p-4">
            <p className="mb-3 text-sm font-medium">
              Add {showAddAddress} address (saved to company address book)
            </p>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="addrLabel">Label</Label>
                  <Input id="addrLabel" placeholder="Warehouse 2" />
                </div>
                <div>
                  <Label htmlFor="addrLine1">Line 1</Label>
                  <Input id="addrLine1" />
                </div>
                <div>
                  <Label htmlFor="addrLine2">Line 2</Label>
                  <Input id="addrLine2" />
                </div>
                <div>
                  <Label htmlFor="addrCity">City</Label>
                  <Input id="addrCity" />
                </div>
                <div>
                  <Label htmlFor="addrState">State</Label>
                  <select id="addrState" className={SELECT_CLASS} defaultValue="">
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
                  <Input id="addrPostal" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" loading={creatingAddress} onClick={onAddAddress}>
                  Save address
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddAddress(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="telephone">Telephone No</Label>
            <Input id="telephone" name="telephone" defaultValue={defaults?.telephone ?? ''} />
          </div>
          <div>
            <Label htmlFor="fax">Fax No</Label>
            <Input id="fax" name="fax" defaultValue={defaults?.fax ?? ''} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={defaults?.email ?? ''} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="contactPersonName">Primary contact name</Label>
            <Input
              id="contactPersonName"
              name="contactPersonName"
              defaultValue={defaults?.contactPersonName}
            />
          </div>
          <div>
            <Label htmlFor="contactPersonDesignation">Designation</Label>
            <Input
              id="contactPersonDesignation"
              name="contactPersonDesignation"
              defaultValue={defaults?.contactPersonDesignation}
            />
          </div>
          <div>
            <Label htmlFor="contactPersonMobile">Mobile No</Label>
            <Input
              id="contactPersonMobile"
              name="contactPersonMobile"
              defaultValue={defaults?.contactPersonMobile ?? ''}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="establishmentType">Types of establishment</Label>
            <Input
              id="establishmentType"
              name="establishmentType"
              defaultValue={defaults?.establishmentType}
            />
          </div>
          <div>
            <Label htmlFor="constitution">Constitution of company</Label>
            <Input id="constitution" name="constitution" defaultValue={defaults?.constitution} />
          </div>
          <div>
            <Label htmlFor="yearEstablished">Year of establishment</Label>
            <Input
              id="yearEstablished"
              name="yearEstablished"
              defaultValue={defaults?.yearEstablished}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pan">PAN No</Label>
            <Input id="pan" name="pan" defaultValue={defaults?.pan ?? ''} />
          </div>
          <div>
            <Label htmlFor="gstin">GST No</Label>
            <Input id="gstin" name="gstin" defaultValue={defaults?.gstin ?? ''} />
          </div>
          <div>
            <Label htmlFor="salesTaxRegNo">Sales Tax registration No</Label>
            <Input
              id="salesTaxRegNo"
              name="salesTaxRegNo"
              defaultValue={defaults?.salesTaxRegNo ?? ''}
            />
          </div>
          <div>
            <Label htmlFor="factoryLicenseNo">Factory / SSI / Shops license No</Label>
            <Input
              id="factoryLicenseNo"
              name="factoryLicenseNo"
              defaultValue={defaults?.factoryLicenseNo ?? ''}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="stateCode">State</Label>
          <select
            id="stateCode"
            name="stateCode"
            className={SELECT_CLASS}
            defaultValue={defaults?.stateCode ?? ''}
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
          <Label htmlFor="businessProfile">Business profile</Label>
          <Input id="businessProfile" name="businessProfile" defaultValue={defaults?.businessProfile} />
        </div>
        <div>
          <Label htmlFor="bankNameAddress">Name and address of Bankers</Label>
          <Input id="bankNameAddress" name="bankNameAddress" defaultValue={defaults?.bankNameAddress} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="bankAccountNo">Account No</Label>
            <Input id="bankAccountNo" name="bankAccountNo" defaultValue={defaults?.bankAccountNo ?? ''} />
          </div>
          <div>
            <Label htmlFor="ifsc">IFSC Code</Label>
            <Input id="ifsc" name="ifsc" defaultValue={defaults?.ifsc ?? ''} />
          </div>
          <div>
            <Label htmlFor="micr">MICR No</Label>
            <Input id="micr" name="micr" defaultValue={defaults?.micr ?? ''} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="creditLimit">Credit limit</Label>
            <Input
              id="creditLimit"
              name="creditLimit"
              type="number"
              step="0.01"
              defaultValue={defaults?.creditLimit ?? ''}
            />
          </div>
          <div>
            <Label htmlFor="paymentTermsDays">Payment terms (days)</Label>
            <Input
              id="paymentTermsDays"
              name="paymentTermsDays"
              type="number"
              min={0}
              defaultValue={defaults?.paymentTermsDays ?? 0}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone (short)</Label>
            <Input id="phone" name="phone" defaultValue={defaults?.phone ?? ''} />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" name="notes" defaultValue={defaults?.notes} />
        </div>
        {activeVendorId ? (
          <div>
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" className={SELECT_CLASS} defaultValue={defaults?.status ?? 'active'}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs uppercase tracking-[0.18em] text-meta">Commercial information</h3>
        {principals.map((row, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Principal customer name & address</Label>
              <Input
                value={row.customerNameAddress}
                onChange={(event) => {
                  const next = [...principals];
                  next[index] = { ...next[index], customerNameAddress: event.target.value };
                  setPrincipals(next);
                }}
              />
            </div>
            <div>
              <Label>Product supplied</Label>
              <Input
                value={row.productSupplied}
                onChange={(event) => {
                  const next = [...principals];
                  next[index] = { ...next[index], productSupplied: event.target.value };
                  setPrincipals(next);
                }}
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setPrincipals((prev) => [...prev, { customerNameAddress: '', productSupplied: '' }])}
        >
          Add customer row
        </Button>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs uppercase tracking-[0.18em] text-meta">Documents to enclose</h3>
        <div className="space-y-3">
          {DOCUMENT_TYPES.map((item) => {
            const uploaded = defaults?.documents?.find((doc) => doc.documentType === item.type);
            return (
              <div key={item.type} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <Label htmlFor={`doc-${item.type}`}>{item.label}</Label>
                  {uploaded ? (
                    <p className="text-xs text-muted">
                      Uploaded: {uploaded.fileName}
                      {uploaded.downloadUrl ? (
                        <>
                          {' · '}
                          <a href={uploaded.downloadUrl} target="_blank" rel="noreferrer" className="underline">
                            View
                          </a>
                        </>
                      ) : null}
                    </p>
                  ) : null}
                  {pendingDocs[item.type] ? (
                    <p className="text-xs text-muted">Selected: {pendingDocs[item.type]?.name}</p>
                  ) : null}
                </div>
                <Input
                  id={`doc-${item.type}`}
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setPendingDocs((prev) => ({ ...prev, [item.type]: file }));
                  }}
                />
              </div>
            );
          })}
        </div>
        {!activeVendorId ? (
          <p className="text-xs text-muted">Selected documents are uploaded when you save the registration.</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs uppercase tracking-[0.18em] text-meta">Declaration & signature</h3>
        <p className="text-sm text-muted">
          I / We hereby declare that the information furnished above is true to the best of my / our
          knowledge and belief and I / We undertake to inform you of any changes therein immediately.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="declarationName">Name</Label>
            <Input id="declarationName" name="declarationName" defaultValue={defaults?.declarationName} />
          </div>
          <div>
            <Label htmlFor="declarationDesignation">Designation</Label>
            <Input
              id="declarationDesignation"
              name="declarationDesignation"
              defaultValue={defaults?.declarationDesignation}
            />
          </div>
          <div>
            <Label htmlFor="declarationPlace">Place / Address</Label>
            <Input id="declarationPlace" name="declarationPlace" defaultValue={defaults?.declarationPlace} />
          </div>
          <div>
            <Label htmlFor="declarationDate">Date</Label>
            <Input
              id="declarationDate"
              name="declarationDate"
              type="date"
              defaultValue={defaults?.declarationDate ?? ''}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs uppercase tracking-[0.18em] text-meta">For office use only</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="officeInspectedBy">Inspection carried out by</Label>
            <Input
              id="officeInspectedBy"
              name="officeInspectedBy"
              defaultValue={defaults?.officeInspectedBy}
            />
          </div>
          <div>
            <Label htmlFor="officeInspectionDate">Inspection date</Label>
            <Input
              id="officeInspectionDate"
              name="officeInspectionDate"
              type="date"
              defaultValue={defaults?.officeInspectionDate ?? ''}
            />
          </div>
          <div>
            <Label htmlFor="vendorCode">Vendor code</Label>
            <Input id="vendorCode" name="vendorCode" defaultValue={defaults?.vendorCode ?? ''} />
          </div>
          <div>
            <Label htmlFor="officeApprovedBy">Approved / Rejected by</Label>
            <Input id="officeApprovedBy" name="officeApprovedBy" defaultValue={defaults?.officeApprovedBy} />
          </div>
          <div>
            <Label htmlFor="officeDecision">Decision</Label>
            <select
              id="officeDecision"
              name="officeDecision"
              className={SELECT_CLASS}
              defaultValue={defaults?.officeDecision ?? ''}
            >
              <option value="">Pending review</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </section>

      {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
      {success ? <StatusMessage tone="success">{success}</StatusMessage> : null}

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {success ? 'Close' : 'Cancel'}
        </Button>
        <Button type="button" variant="outline" onClick={onDownloadPdf} disabled={!activeVendorId}>
          Download as PDF
        </Button>
        <Button type="submit" loading={creating || updating}>
          {creating || updating ? 'Saving…' : activeVendorId ? 'Save registration' : 'Register vendor'}
        </Button>
      </div>
    </form>
  );
}
